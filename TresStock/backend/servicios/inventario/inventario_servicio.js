// importa el pool de conexiones
const pool = require('../../configuracion/base_datos');
const { obtenerFechaActualChile } = require('../../utilidades/fechas');
const { predecirPronosticos } = require('../../modelo/pronostico_lightgbm');

// Nivel de servicio aproximado del 95% para el stock de seguridad.
// La demanda diaria se estima con los 6 meses anteriores a la ultima venta.
const FACTOR_SERVICIO_STOCK = 1.65;

// Calcula pronósticos experimentales usando el artefacto LightGBM evaluado en Node.js.
const obtenerPronosticosLightgbm = async () => {
    const resultado = await pool.query(`
        WITH corte AS (
            SELECT MAX(fecha_hora)::date AS fecha_corte
            FROM base_datos.ventas
        ), calendario AS (
            SELECT generate_series(c.fecha_corte - 34, c.fecha_corte, INTERVAL '1 day')::date AS fecha
            FROM corte c
            WHERE c.fecha_corte IS NOT NULL
        ), ventas_diarias AS (
            SELECT dv.codigo, v.fecha_hora::date AS fecha, SUM(GREATEST(dv.cantidad, 0)) AS unidades
            FROM base_datos.detalle_venta dv
            INNER JOIN base_datos.ventas v ON v.id_venta = dv.id_venta
            CROSS JOIN corte c
            WHERE v.fecha_hora >= (c.fecha_corte - 34)::timestamp
                AND v.fecha_hora < (c.fecha_corte + 1)::timestamp
            GROUP BY dv.codigo, v.fecha_hora::date
        ), productos_por_peso AS (
            SELECT DISTINCT codigo
            FROM base_datos.detalle_venta
            WHERE cantidad <> TRUNC(cantidad)
        )
        SELECT p.codigo, c.fecha_corte,
            COALESCE((
                p.familia ~* '(^|[^[:alnum:]])BALANZA([^[:alnum:]]|$)'
                OR p.descripcion ~* '(^|[^[:alnum:]])(KG|KGS|KILO|KILOS)([^[:alnum:]]|$)'
                OR pp.codigo IS NOT NULL
            ), FALSE) AS es_producto_balanza,
            ARRAY_AGG(COALESCE(vd.unidades, 0)::float8 ORDER BY cal.fecha) AS ventas
        FROM base_datos.productos p
        CROSS JOIN corte c
        CROSS JOIN calendario cal
        LEFT JOIN ventas_diarias vd ON vd.codigo = p.codigo AND vd.fecha = cal.fecha
        LEFT JOIN productos_por_peso pp ON pp.codigo = p.codigo
        GROUP BY p.codigo, c.fecha_corte, p.familia, p.descripcion, pp.codigo
        ORDER BY p.codigo
    `);

    if (!resultado.rows.length) return { fecha_corte: null, metodo: 'lightgbm_experimental', productos: [] };

    const solicitud = {
        fecha_corte: resultado.rows[0].fecha_corte.toISOString().slice(0, 10),
        productos: resultado.rows.map(fila => ({
            codigo: fila.codigo,
            ventas: fila.ventas,
            es_producto_balanza: fila.es_producto_balanza
        }))
    };
    return predecirPronosticos(solicitud);
};


// FUNCION 1 OBTENER INVENTARIO
const obtenerInventario = async () => {

    const resultado = await pool.query(
        `WITH periodo AS (
            SELECT
                MAX(fecha_hora)::date AS fecha_fin,
                (MAX(fecha_hora)::date - INTERVAL '6 months')::date AS fecha_inicio
            FROM base_datos.ventas
        ),

        -- Ventas positivas agregadas en los últimos 28 días registrados.
        demanda_ultimos_28_dias AS (
            SELECT dv.codigo, SUM(GREATEST(dv.cantidad, 0)) AS unidades_positivas
            FROM base_datos.detalle_venta dv
            INNER JOIN base_datos.ventas v ON v.id_venta = dv.id_venta
            CROSS JOIN periodo p
            WHERE p.fecha_fin IS NOT NULL
                AND v.fecha_hora >= (p.fecha_fin - INTERVAL '27 days')::timestamp
                AND v.fecha_hora < (p.fecha_fin + 1)::timestamp
            GROUP BY dv.codigo
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

        -- Presencia de una venta en cualquier fecha del historial importado.
        -- No se interpreta como fecha de ingreso ni vigencia fisica.
        productos_con_historial AS (
            SELECT DISTINCT dv.codigo
            FROM base_datos.detalle_venta dv
            INNER JOIN base_datos.ventas v
                ON v.id_venta = dv.id_venta
        ),

        plazos_reposicion AS (
            SELECT
                pp.codigo,
                MAX(prov.tiempo_entrega_dias) AS dias_entrega
            FROM base_datos.producto_proveedor pp
            INNER JOIN base_datos.proveedores prov
                ON prov.id_proveedor = pp.id_proveedor
            WHERE prov.tiempo_entrega_dias IS NOT NULL
            GROUP BY pp.codigo
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
            COALESCE(i.stock_seguridad, 0) AS stock_seguridad,
            (
                COALESCE(i.stock_minimo, 0)
                + COALESCE(i.stock_seguridad, 0)
            ) AS punto_reposicion,

            GREATEST(7, COALESCE(pr.dias_entrega, 7)) AS dias_entrega,
            (pr.dias_entrega IS NULL OR pr.dias_entrega < 7)
                AS plazo_estimado,

            COALESCE(d28.unidades_positivas, 0) AS ventas_ultimos_28_dias,
            -- Proyecta el promedio móvil; redondea unidades hacia arriba y conserva decimales para balanza.
            CASE WHEN per.fecha_fin IS NULL THEN NULL
                WHEN p.familia ~* '(^|[^[:alnum:]])BALANZA([^[:alnum:]]|$)'
                    OR p.descripcion ~* '(^|[^[:alnum:]])(KG|KGS|KILO|KILOS)([^[:alnum:]]|$)'
                    OR ppeso.codigo IS NOT NULL
                    THEN ROUND(COALESCE(d28.unidades_positivas, 0) * 7 / 28, 3)
                ELSE CEIL(COALESCE(d28.unidades_positivas, 0) * 7 / 28)
            END AS pronostico_7_dias,
            CASE WHEN per.fecha_fin IS NULL THEN NULL
                WHEN p.familia ~* '(^|[^[:alnum:]])BALANZA([^[:alnum:]]|$)'
                    OR p.descripcion ~* '(^|[^[:alnum:]])(KG|KGS|KILO|KILOS)([^[:alnum:]]|$)'
                    OR ppeso.codigo IS NOT NULL
                    THEN ROUND(COALESCE(d28.unidades_positivas, 0) * 14 / 28, 3)
                ELSE CEIL(COALESCE(d28.unidades_positivas, 0) * 14 / 28)
            END AS pronostico_14_dias,
            CASE WHEN per.fecha_fin IS NULL THEN NULL
                WHEN p.familia ~* '(^|[^[:alnum:]])BALANZA([^[:alnum:]]|$)'
                    OR p.descripcion ~* '(^|[^[:alnum:]])(KG|KGS|KILO|KILOS)([^[:alnum:]]|$)'
                    OR ppeso.codigo IS NOT NULL
                    THEN ROUND(COALESCE(d28.unidades_positivas, 0) * 30 / 28, 3)
                ELSE CEIL(COALESCE(d28.unidades_positivas, 0) * 30 / 28)
            END AS pronostico_30_dias,
            per.fecha_fin AS fecha_corte_pronostico,

            -- Permite distinguir falta de ventas de un error en el calculo.
            (pv.codigo IS NULL) AS sin_ventas_recientes,
            CASE
                WHEN pv.codigo IS NOT NULL THEN 'RECIENTES'
                WHEN ph.codigo IS NOT NULL THEN 'ANTIGUAS'
                ELSE 'SIN_HISTORIAL'
            END AS actividad_comercial,
            (pv.codigo IS NOT NULL) AS stock_minimo_calculable,
            (pv.codigo IS NOT NULL) AS stock_seguridad_calculable,

            CASE
                WHEN COALESCE(i.stock_actual, 0) < 0
                    THEN 'STOCK NEGATIVO'

                WHEN COALESCE(i.stock_actual, 0) = 0
                    THEN 'SIN STOCK'

                WHEN pv.codigo IS NULL AND ph.codigo IS NOT NULL
                    THEN 'SIN VENTAS RECIENTES'

                WHEN pv.codigo IS NULL
                    THEN 'SIN HISTORIAL'

                WHEN (
                    COALESCE(i.stock_minimo, 0)
                    + COALESCE(i.stock_seguridad, 0)
                ) > 0
                    AND COALESCE(i.stock_actual, 0) <= (
                        COALESCE(i.stock_minimo, 0)
                        + COALESCE(i.stock_seguridad, 0)
                    )
                    THEN 'STOCK BAJO'

                ELSE 'OPTIMO'
            END AS estado

        FROM base_datos.productos p
        CROSS JOIN periodo per
        LEFT JOIN base_datos.inventario i
            ON p.codigo = i.codigo
        LEFT JOIN productos_con_ventas pv
            ON p.codigo = pv.codigo
        LEFT JOIN productos_con_historial ph
            ON p.codigo = ph.codigo
        LEFT JOIN plazos_reposicion pr
            ON p.codigo = pr.codigo
        LEFT JOIN demanda_ultimos_28_dias d28
            ON p.codigo = d28.codigo
        LEFT JOIN productos_por_peso ppeso
            ON p.codigo = ppeso.codigo

        WHERE p.controla_stock = TRUE
        ORDER BY p.descripcion`
    );

    return resultado.rows;
};

// entrega las ventas positivas de cada uno de los últimos 28 días registrados para un producto
const obtenerVentasDiariasPronostico = async (codigo) => {
    const resultado = await pool.query(
        `WITH periodo AS (
            SELECT MAX(fecha_hora)::date AS fecha_fin
            FROM base_datos.ventas
        ),
        dias AS (
            SELECT serie.fecha::date AS fecha
            FROM periodo p
            CROSS JOIN LATERAL generate_series(
                p.fecha_fin - INTERVAL '27 days',
                p.fecha_fin,
                INTERVAL '1 day'
            ) AS serie(fecha)
        )
        SELECT
            d.fecha,
            COALESCE(SUM(GREATEST(dv.cantidad, 0)), 0) AS unidades
        FROM dias d
        LEFT JOIN base_datos.ventas v
            ON v.fecha_hora >= d.fecha::timestamp
            AND v.fecha_hora < (d.fecha + 1)::timestamp
        LEFT JOIN base_datos.detalle_venta dv
            ON dv.id_venta = v.id_venta
            AND dv.codigo = $1
        GROUP BY d.fecha
        ORDER BY d.fecha ASC`,
        [codigo]
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
                    AND (
                        COALESCE(i.stock_minimo, 0)
                        + COALESCE(i.stock_seguridad, 0)
                    ) > 0
                    AND COALESCE(i.stock_actual, 0) <= (
                        COALESCE(i.stock_minimo, 0)
                        + COALESCE(i.stock_seguridad, 0)
                    )
            ) AS stock_bajo,

            COUNT(*) FILTER (
                WHERE COALESCE(i.stock_actual, 0) = 0
            ) AS sin_stock,

            (
                SELECT COUNT(DISTINCT lv.codigo)

                FROM base_datos.lotes_vencimiento lv
                 INNER JOIN base_datos.productos producto_lote
                    ON producto_lote.codigo = lv.codigo
                       AND producto_lote.controla_stock = TRUE

                WHERE
                    lv.cantidad > 0
                    AND lv.fecha_vencimiento >= CURRENT_DATE
                    AND lv.fecha_vencimiento
                        <= CURRENT_DATE + INTERVAL '30 days'

            ) AS proximos_vencer

        FROM base_datos.productos p

        LEFT JOIN base_datos.inventario i
            ON p.codigo = i.codigo
        WHERE p.controla_stock = TRUE`
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
            AND controla_stock = TRUE

        ORDER BY familia`
    );


    return resultado.rows;
};


// FUNCION 4 RECALCULAR STOCK MINIMO Y STOCK DE SEGURIDAD
// Se mantiene el nombre de la funcion para no cambiar controladores ni rutas.
const recalcularStockMinimo = async () => {

    const resultado = await pool.query(
        `WITH periodo AS (
            SELECT
                MAX(fecha_hora)::date AS fecha_fin,
                (MAX(fecha_hora)::date - INTERVAL '6 months')::date AS fecha_inicio,
                (
                    MAX(fecha_hora)::date
                    - (MAX(fecha_hora)::date - INTERVAL '6 months')::date
                )::numeric AS dias_periodo
            FROM base_datos.ventas
        ),

        -- Si hay varios proveedores se usa el mayor plazo de entrega.
        -- Sin proveedor se aplican 7 dias estimados.
        plazos AS (
            SELECT
                pp.codigo,
                GREATEST(7, MAX(prov.tiempo_entrega_dias)) AS dias_entrega
            FROM base_datos.producto_proveedor pp
            INNER JOIN base_datos.proveedores prov
                ON prov.id_proveedor = pp.id_proveedor
            WHERE prov.tiempo_entrega_dias IS NOT NULL
            GROUP BY pp.codigo
        ),

        -- Agrupa las ventas por producto y por dia.
        -- Las correcciones negativas se mantienen para el stock minimo,
        -- pero no generan demanda negativa en la variabilidad diaria.
        ventas_por_dia AS (
            SELECT
                dv.codigo,
                v.fecha_hora::date AS fecha_venta,
                SUM(dv.cantidad) AS venta_neta_dia
            FROM base_datos.detalle_venta dv
            INNER JOIN base_datos.ventas v
                ON v.id_venta = dv.id_venta
            CROSS JOIN periodo p
            WHERE v.fecha_hora >= (p.fecha_inicio + 1)::timestamp
                AND v.fecha_hora < (p.fecha_fin + 1)::timestamp
            GROUP BY dv.codigo, v.fecha_hora::date
        ),

        -- Los dias sin ventas cuentan como 0: el divisor incluye
        -- todos los dias calendario del mismo periodo de 6 meses.
        resumen_ventas AS (
            SELECT
                codigo,
                SUM(venta_neta_dia) AS total_neto,
                SUM(GREATEST(venta_neta_dia, 0)) AS demanda_positiva,
                SUM(POWER(GREATEST(venta_neta_dia, 0), 2)) AS cuadrados_diarios
            FROM ventas_por_dia
            GROUP BY codigo
        ),

        calculos AS (
            SELECT
                p.codigo,

                -- El minimo conserva la formula que ya tenia TresStock:
                -- promedio neto diario de 6 meses * dias de entrega.
                CASE
                    WHEN per.dias_periodo > 0 THEN
                        LEAST(
                            CEIL(
                                GREATEST(COALESCE(rv.total_neto, 0), 0)
                                / per.dias_periodo
                                * COALESCE(pl.dias_entrega, 7)
                            ),
                            2147483647::numeric
                        )::integer
                    ELSE 0
                END AS stock_minimo,

                -- Seguridad: Z * desviacion diaria * raiz(plazo).
                -- Varianza poblacional: E[X^2] - E[X]^2.
                CASE
                    WHEN per.dias_periodo > 0 THEN
                        LEAST(
                            CEIL(
                                $1::numeric
                                * SQRT(GREATEST(
                                    0::numeric,
                                    COALESCE(rv.cuadrados_diarios, 0)
                                        / per.dias_periodo
                                    - POWER(
                                        COALESCE(rv.demanda_positiva, 0)
                                            / per.dias_periodo,
                                        2
                                    )
                                ))
                                * SQRT(COALESCE(pl.dias_entrega, 7)::numeric)
                            ),
                            2147483647::numeric
                        )::integer
                    ELSE 0
                END AS stock_seguridad

            FROM base_datos.productos p
            CROSS JOIN periodo per
            LEFT JOIN resumen_ventas rv
                ON rv.codigo = p.codigo
            LEFT JOIN plazos pl
                ON pl.codigo = p.codigo
            WHERE p.controla_stock = TRUE
        )

        UPDATE base_datos.inventario i
        SET stock_minimo = c.stock_minimo,
            stock_seguridad = c.stock_seguridad
        FROM calculos c
        WHERE i.codigo = c.codigo
            AND (
                i.stock_minimo IS DISTINCT FROM c.stock_minimo
                OR i.stock_seguridad IS DISTINCT FROM c.stock_seguridad
            )
        RETURNING i.codigo, i.stock_minimo, i.stock_seguridad`,
        [FACTOR_SERVICIO_STOCK]
    );

    return {
        productos_actualizados: resultado.rowCount
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
            Number.isNaN(fechaParseada.getTime()) || fechaParseada.toISOString().slice(0, 10) !== fechaVencimiento ||
            fechaVencimiento < obtenerFechaActualChile()) {
            const error = new Error('La fecha de vencimiento debe ser hoy o posterior y solo se admite al sumar stock');
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
            `SELECT codigo, controla_stock FROM base_datos.productos WHERE codigo = $1 FOR UPDATE`,
            [codigo]
        );
        if (!producto.rowCount) {
            const error = new Error('Producto no encontrado');
            error.status = 404;
            throw error;
        }
        if (producto.rows[0].controla_stock === false) {
            const error = new Error('Este registro no controla stock. Puedes cambiarlo desde Productos.');
            error.status = 400;
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
             RETURNING codigo, stock_actual, stock_minimo, stock_seguridad`,
            [stockNuevo, codigo]
        );

        // registra el lote con la misma cantidad que se añadió al inventario
        if (fechaVencimiento) {
            await cliente.query(
                `INSERT INTO base_datos.lotes_vencimiento
                    (codigo, cantidad, cantidad_original, fecha_vencimiento)
                 VALUES ($1, $2, $2, $3)`,
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
            stock_seguridad: Number(resultado.rows[0].stock_seguridad),
            punto_reposicion: Number(resultado.rows[0].stock_minimo) +
                Number(resultado.rows[0].stock_seguridad),
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
    obtenerPronosticosLightgbm,
    obtenerVentasDiariasPronostico,
    obtenerResumenInventario,
    obtenerFamilias,
    recalcularStockMinimo,
    obtenerMovimientosInventario,
    ajustarInventario
};
