// importa el pool de conexiones
const pool = require('../../configuracion/base_datos');


// FUNCION 1 OBTENER INVENTARIO
const obtenerInventario = async () => {

    const resultado = await pool.query(
        `WITH periodo AS (
            SELECT
                MAX(fecha_hora)::date AS fecha_fin,
                (MAX(fecha_hora)::date - INTERVAL '6 months')::date AS fecha_inicio
            FROM base_datos.ventas
        ),

        productos_con_ventas AS (
            SELECT DISTINCT dv.codigo
            FROM base_datos.detalle_venta dv
            INNER JOIN base_datos.ventas v
                ON v.id_venta = dv.id_venta
            CROSS JOIN periodo p
            WHERE v.fecha_hora::date > p.fecha_inicio
                AND v.fecha_hora::date <= p.fecha_fin
        ),

        productos_con_plazo AS (
            SELECT DISTINCT pp.codigo
            FROM base_datos.producto_proveedor pp
            INNER JOIN base_datos.proveedores prov
                ON prov.id_proveedor = pp.id_proveedor
            WHERE prov.tiempo_entrega_dias IS NOT NULL
        ),

        productos_por_peso AS (
            SELECT DISTINCT codigo
            FROM base_datos.detalle_venta
            WHERE cantidad <> TRUNC(cantidad)
        )

        SELECT
            p.codigo,
            p.cod_barra,
            p.descripcion,
            p.familia,
            p.imagen,
            (
                p.familia ~* '(^|[^[:alnum:]])BALANZA([^[:alnum:]]|$)'
                OR p.descripcion ~* '(^|[^[:alnum:]])(KG|KGS|KILO|KILOS)([^[:alnum:]]|$)'
                OR ppeso.codigo IS NOT NULL
            ) AS es_producto_balanza,

            COALESCE(i.stock_actual, 0) AS stock_actual,
            COALESCE(i.stock_minimo, 0) AS stock_minimo,

            (pv.codigo IS NOT NULL AND pp.codigo IS NOT NULL)
                AS stock_minimo_calculable,

            CASE
                WHEN COALESCE(i.stock_actual, 0) < 0
                    THEN 'STOCK NEGATIVO'

                WHEN COALESCE(i.stock_actual, 0) = 0
                    THEN 'SIN STOCK'

                WHEN pv.codigo IS NULL OR pp.codigo IS NULL
                    THEN 'PENDIENTE'

                WHEN COALESCE(i.stock_minimo, 0) > 0
                    AND COALESCE(i.stock_actual, 0) <= i.stock_minimo
                    THEN 'STOCK BAJO'

                ELSE 'OPTIMO'
            END AS estado

        FROM base_datos.productos p
        LEFT JOIN base_datos.inventario i
            ON p.codigo = i.codigo
        LEFT JOIN productos_con_ventas pv
            ON p.codigo = pv.codigo
        LEFT JOIN productos_con_plazo pp
            ON p.codigo = pp.codigo
        LEFT JOIN productos_por_peso ppeso
            ON p.codigo = ppeso.codigo

        ORDER BY p.descripcion`
    );


    return resultado.rows;
};


// FUNCION 2 OBTENER RESUMEN INVENTARIO
const obtenerResumenInventario = async () => {

    const resultado = await pool.query(
        `SELECT

            COUNT(*) AS total_productos,

            COUNT(*) FILTER (
                WHERE COALESCE(i.stock_actual, 0) < 0
            ) AS stock_negativo,

            COUNT(*) FILTER (
                WHERE
                    COALESCE(i.stock_actual, 0) > 0
                    AND COALESCE(i.stock_minimo, 0) > 0
                    AND COALESCE(i.stock_actual, 0)
                        <= COALESCE(i.stock_minimo, 0)
            ) AS stock_bajo,

            COUNT(*) FILTER (
                WHERE COALESCE(i.stock_actual, 0) = 0
            ) AS sin_stock,

            (
                SELECT COUNT(DISTINCT lv.codigo)

                FROM base_datos.lotes_vencimiento lv

                WHERE
                    lv.cantidad > 0
                    AND lv.fecha_vencimiento >= CURRENT_DATE
                    AND lv.fecha_vencimiento
                        <= CURRENT_DATE + INTERVAL '30 days'

            ) AS proximos_vencer

        FROM base_datos.productos p

        LEFT JOIN base_datos.inventario i
            ON p.codigo = i.codigo`
    );


    return resultado.rows[0];
};


// FUNCION 3 OBTENER FAMILIAS
const obtenerFamilias = async () => {

    const resultado = await pool.query(
        `SELECT DISTINCT familia

        FROM base_datos.productos

        WHERE
            familia IS NOT NULL
            AND TRIM(familia) <> ''

        ORDER BY familia`
    );


    return resultado.rows;
};


// FUNCION 4 RECALCULAR STOCK MINIMO

const recalcularStockMinimo = async () => {

    const resultado = await pool.query(
        `
        WITH periodo AS
        (
            SELECT
                MAX(fecha_hora)::date AS fecha_fin,
                (
                    MAX(fecha_hora)::date
                    - INTERVAL '6 months'
                )::date AS fecha_inicio
            FROM base_datos.ventas
        ),

        ventas_6_meses AS
        (
            SELECT
                dv.codigo,

                SUM(
                    dv.cantidad
                ) AS cantidad_vendida,

                (
                    p.fecha_fin -
                    p.fecha_inicio
                ) AS dias_periodo

            FROM base_datos.detalle_venta dv

            INNER JOIN base_datos.ventas v
                ON v.id_venta = dv.id_venta

            CROSS JOIN periodo p

            WHERE
                v.fecha_hora::date >
                p.fecha_inicio

                AND

                v.fecha_hora::date <=
                p.fecha_fin

            GROUP BY
                dv.codigo,
                p.fecha_inicio,
                p.fecha_fin
        ),

        calculo_stock AS
        (
            SELECT
                pp.codigo,

                CEIL(
                    GREATEST(
                        COALESCE(
                            v6.cantidad_vendida,
                            0
                        ),
                        0
                    )
                    /
                    NULLIF(
                        v6.dias_periodo,
                        0
                    )
                    *
                    MAX(
                        prov.tiempo_entrega_dias
                    )
                )::INTEGER
                AS stock_minimo

            FROM base_datos.producto_proveedor pp

            INNER JOIN base_datos.proveedores prov
                ON prov.id_proveedor =
                pp.id_proveedor

            INNER JOIN ventas_6_meses v6
                ON v6.codigo =
                pp.codigo

            WHERE
                prov.tiempo_entrega_dias
                IS NOT NULL

            GROUP BY
                pp.codigo,
                v6.cantidad_vendida,
                v6.dias_periodo
        )

        UPDATE base_datos.inventario i

        SET stock_minimo =
            COALESCE(cs.stock_minimo, 0)

        FROM base_datos.productos p

        LEFT JOIN calculo_stock cs
            ON cs.codigo = p.codigo

        WHERE i.codigo = p.codigo
            AND i.stock_minimo IS DISTINCT FROM
                COALESCE(cs.stock_minimo, 0)

        RETURNING
            i.codigo,
            i.stock_minimo
        `
    );


    return {
        productos_actualizados:
            resultado.rowCount
    };

};


// FUNCION 5 OBTENER HISTORIAL DE MOVIMIENTOS
const obtenerMovimientosInventario = async (filtros = {}) => {

    const paginaSolicitada = Number.parseInt(filtros.pagina, 10);
    const pagina = Number.isSafeInteger(paginaSolicitada) && paginaSolicitada > 0
        ? paginaSolicitada
        : 1;
    const limiteSolicitado = Number.parseInt(filtros.limite, 10);

    const limite = Number.isSafeInteger(limiteSolicitado) &&
        limiteSolicitado >= 1 &&
        limiteSolicitado <= 120
            ? limiteSolicitado
            : 120;
    const valores = [];
    const condiciones = [];

    const codigoExacto = String(filtros.codigo || '').trim();
    if (codigoExacto && codigoExacto.length <= 50) {
        valores.push(codigoExacto);
        condiciones.push(`m.codigo = $${valores.length}`);
    }

    if (['ENTRADA', 'SALIDA', 'AJUSTE'].includes(filtros.tipo)) {
        valores.push(filtros.tipo);
        condiciones.push(`m.tipo = $${valores.length}`);
    }

    const busqueda = String(filtros.buscar || '').trim();

    if (busqueda) {
        valores.push(`%${busqueda.slice(0, 150)}%`);
        condiciones.push(`(
            p.descripcion ILIKE $${valores.length}
            OR p.codigo ILIKE $${valores.length}
            OR p.cod_barra ILIKE $${valores.length}
            OR m.correo_usuario ILIKE $${valores.length}
        )`);
    }

    if (filtros.desde && /^\d{4}-\d{2}-\d{2}$/.test(filtros.desde)) {
        valores.push(filtros.desde);
        condiciones.push(`m.fecha_hora >= $${valores.length}::DATE`);
    }

    if (filtros.hasta && /^\d{4}-\d{2}-\d{2}$/.test(filtros.hasta)) {
        valores.push(filtros.hasta);
        condiciones.push(`m.fecha_hora < ($${valores.length}::DATE + INTERVAL '1 day')`);
    }

    const where = condiciones.length > 0
        ? `WHERE ${condiciones.join(' AND ')}`
        : '';

    const ordenes = {
        recientes: 'm.fecha_hora DESC, m.id_movimiento DESC',
        antiguos: 'm.fecha_hora ASC, m.id_movimiento ASC',
        cantidad_mayor: 'm.cantidad DESC, m.fecha_hora DESC',
        cantidad_menor: 'm.cantidad ASC, m.fecha_hora DESC'
    };
    const orden = ordenes[filtros.orden] || ordenes.recientes;

    const resultadoTotal = await pool.query(
        `SELECT COUNT(*) AS total
         FROM base_datos.movimientos_inventario m
         INNER JOIN base_datos.productos p ON p.codigo = m.codigo
         ${where}`,
        valores
    );

    const total = Number(resultadoTotal.rows[0].total);
    const totalPaginas = Math.max(1, Math.ceil(total / limite));
    const paginaActual = Math.min(pagina, totalPaginas);
    const offset = (paginaActual - 1) * limite;
    const valoresConsulta = [...valores, limite, offset];

    const resultado = await pool.query(
        `SELECT
            m.id_movimiento,
            m.codigo,
            p.descripcion AS producto,
            m.tipo,
            m.cantidad,
            m.fecha_hora,
            m.motivo,
            m.correo_usuario,
            m.stock_anterior,
            m.stock_nuevo
         FROM base_datos.movimientos_inventario m
         INNER JOIN base_datos.productos p ON p.codigo = m.codigo
         ${where}
         ORDER BY ${orden}
         LIMIT $${valores.length + 1}
         OFFSET $${valores.length + 2}`,
        valoresConsulta
    );

    return {
        movimientos: resultado.rows,
        paginacion: {
            pagina_actual: paginaActual,
            total_paginas: totalPaginas,
            total_movimientos: total,
            limite
        }
    };
};


// FUNCION 6 AJUSTAR INVENTARIO
const ajustarInventario = async (
    codigo,
    cantidad,
    operacion,
    idUsuario,
    motivo,
    fechaVencimiento = null
) => {

    // valida los parametros nuevamente antes de modificar PostgreSQL
    const operacionValida = ['sumar', 'restar', 'fijar'].includes(operacion);
    const cantidadValida = Number.isFinite(cantidad) && cantidad <= 99999999.9999 &&
        (operacion === 'fijar' ? cantidad >= 0 : cantidad > 0) &&
        Math.abs(cantidad - Math.round(cantidad * 10000) / 10000) < 1e-9;

    if (!operacionValida || !cantidadValida || !motivo || motivo.length > 100) {
        const error = new Error('Datos inválidos para ajustar inventario');
        error.status = 400;
        throw error;
    }
    if (fechaVencimiento) {
        const fechaParseada = new Date(`${fechaVencimiento}T00:00:00Z`);
        if (operacion !== 'sumar' || !/^\d{4}-\d{2}-\d{2}$/.test(fechaVencimiento) ||
            Number.isNaN(fechaParseada.getTime()) || fechaParseada.toISOString().slice(0, 10) !== fechaVencimiento) {
            const error = new Error('La fecha de vencimiento no es válida para esta operación');
            error.status = 400;
            throw error;
        }
    }

    const cliente = await pool.connect();
    try {
        await cliente.query('BEGIN');

        // obtiene el correo vigente del usuario autenticado
        const usuario = await cliente.query(
            `SELECT email FROM base_datos.usuarios
             WHERE id_usuario = $1 AND activo = TRUE`,
            [idUsuario]
        );
        if (!usuario.rowCount) {
            const error = new Error('No hay una sesión válida para realizar el ajuste');
            error.status = 401;
            throw error;
        }

        // comprueba que el producto exista
        const producto = await cliente.query(
            `SELECT codigo FROM base_datos.productos WHERE codigo = $1`,
            [codigo]
        );
        if (!producto.rowCount) {
            const error = new Error('Producto no encontrado');
            error.status = 404;
            throw error;
        }

        // crea el inventario si falta y bloquea la fila para evitar concurrencia
        await cliente.query(
            `INSERT INTO base_datos.inventario (codigo, stock_actual, stock_minimo)
             VALUES ($1, 0, 0)
             ON CONFLICT (codigo) DO NOTHING`,
            [codigo]
        );

        const inventario = await cliente.query(
            `SELECT stock_actual FROM base_datos.inventario
             WHERE codigo = $1 FOR UPDATE`,
            [codigo]
        );
        const stockAnterior = Number(inventario.rows[0].stock_actual);
        const stockNuevo = Number((operacion === 'fijar' ? cantidad
            : operacion === 'restar' ? stockAnterior - cantidad
            : stockAnterior + cantidad).toFixed(4));

        // se puede recuperar con una entrada un saldo histórico negativo;
        // no se permite crear nuevos negativos mediante una salida manual
        if (operacion === 'restar' && stockNuevo < 0) {
            const error = new Error('No hay inventario suficiente para realizar la resta');
            error.status = 400;
            throw error;
        }
        if (operacion === 'fijar' && Math.abs(stockNuevo - stockAnterior) < 1e-9) {
            const error = new Error('El nuevo stock es igual al actual');
            error.status = 400;
            throw error;
        }
        if (Math.abs(stockNuevo) > 99999999.9999) {
            const error = new Error('El inventario resultante excede el límite permitido');
            error.status = 400;
            throw error;
        }

        const resultado = await cliente.query(
            `UPDATE base_datos.inventario SET stock_actual = $1
             WHERE codigo = $2
             RETURNING codigo, stock_actual, stock_minimo`,
            [stockNuevo, codigo]
        );

        // registra el lote con la misma cantidad que se añadió al inventario
        if (fechaVencimiento) {
            await cliente.query(
                `INSERT INTO base_datos.lotes_vencimiento (codigo, cantidad, fecha_vencimiento)
                 VALUES ($1, $2, $3)`,
                [codigo, cantidad, fechaVencimiento]
            );
        }

        // AJUSTE almacena la magnitud absoluta; el motivo conserva
        // explícitamente la dirección mediante stock anterior y nuevo
        const tipo = operacion === 'fijar' ? 'AJUSTE'
            : operacion === 'sumar' ? 'ENTRADA' : 'SALIDA';
        const diferencia = Number(Math.abs(stockNuevo - stockAnterior).toFixed(4));
        let motivoCompleto = operacion === 'fijar'
            ? `${motivo}. Stock: ${stockAnterior} a ${stockNuevo}`
            : motivo;
        if (fechaVencimiento) motivoCompleto += ` (Lote vence ${fechaVencimiento})`;

        if (diferencia > 0) {
            await cliente.query(
                `INSERT INTO base_datos.movimientos_inventario
                    (codigo, tipo, cantidad, motivo, correo_usuario, stock_anterior, stock_nuevo)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [codigo, tipo, diferencia, motivoCompleto.slice(0, 255), usuario.rows[0].email,
                    stockAnterior, stockNuevo]
            );
        }

        await cliente.query('COMMIT');
        return {
            codigo: resultado.rows[0].codigo,
            stock_anterior: stockAnterior,
            stock_actual: Number(resultado.rows[0].stock_actual),
            stock_minimo: Number(resultado.rows[0].stock_minimo),
            cantidad_ajustada: diferencia,
            operacion
        };

    } catch (error) {
        await cliente.query('ROLLBACK');
        throw error;
    } finally {
        cliente.release();
    }
};


// exporta las funciones
module.exports = {
    obtenerInventario,
    obtenerResumenInventario,
    obtenerFamilias,
    recalcularStockMinimo,
    obtenerMovimientosInventario,
    ajustarInventario
};
