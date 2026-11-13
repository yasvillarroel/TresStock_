const pool = require('../../configuracion/base_datos');
const { obtenerFechaActualChile } = require('../../utilidades/fechas');

const actualizarFechaVencimiento = async (idLote, fechaVencimiento) => {
    const fechaParseada = new Date(`${fechaVencimiento}T00:00:00Z`);
    if (!Number.isSafeInteger(idLote) || idLote <= 0 ||
        !/^\d{4}-\d{2}-\d{2}$/.test(fechaVencimiento) ||
        Number.isNaN(fechaParseada.getTime()) ||
        fechaParseada.toISOString().slice(0, 10) !== fechaVencimiento ||
        fechaVencimiento < obtenerFechaActualChile()) {
        const error = new Error('La fecha de vencimiento debe ser hoy o una fecha futura.');
        error.status = 400;
        throw error;
    }

    const resultado = await pool.query(
        `UPDATE base_datos.lotes_vencimiento
         SET fecha_vencimiento = $1
         WHERE id_lote = $2
         RETURNING id_lote, codigo, fecha_vencimiento`,
        [fechaVencimiento, idLote]
    );
    if (!resultado.rowCount) {
        const error = new Error('No se encontró el lote que quieres modificar.');
        error.status = 404;
        throw error;
    }

    return resultado.rows[0];
};

const darDeBajaLote = async (idLote, estadoBaja, motivoBaja, cantidadMermaSolicitada, descontarStock, idUsuario) => {
    const estadosPermitidos = ['ELIMINADO', 'VENDIDO', 'MERMA', 'OTRO'];
    const motivo = String(motivoBaja || '').trim();
    const cantidadMerma = Number(cantidadMermaSolicitada);
    const cantidadMermaValida = Number.isFinite(cantidadMerma) &&
        cantidadMerma > 0 && cantidadMerma <= 9999.9999 &&
        Math.abs(cantidadMerma - Math.round(cantidadMerma * 10000) / 10000) < 1e-9;
    if (!Number.isSafeInteger(idLote) || idLote <= 0 ||
        !estadosPermitidos.includes(estadoBaja) ||
        !motivo || motivo.length > 255 ||
        (estadoBaja === 'MERMA' && !cantidadMermaValida) ||
        (estadoBaja !== 'MERMA' && cantidadMermaSolicitada !== null) ||
        typeof descontarStock !== 'boolean' ||
        (descontarStock && estadoBaja !== 'MERMA') ||
        !Number.isSafeInteger(idUsuario) || idUsuario <= 0) {
        const error = new Error('Indica un estado y un motivo válido para dar de baja el lote.');
        error.status = 400;
        throw error;
    }

    const cliente = await pool.connect();
    let transaccionAbierta = false;
    try {
        await cliente.query('BEGIN');
        transaccionAbierta = true;

        const usuario = await cliente.query(
            'SELECT email FROM base_datos.usuarios WHERE id_usuario = $1 AND activo = TRUE',
            [idUsuario]
        );
        if (!usuario.rowCount) {
            const error = new Error('La cuenta no está activa.');
            error.status = 401;
            throw error;
        }

        const resultadoLote = await cliente.query(
            `SELECT id_lote, codigo, cantidad, cantidad_original, fecha_vencimiento
             FROM base_datos.lotes_vencimiento
             WHERE id_lote = $1 AND activo = TRUE
             FOR UPDATE`,
            [idLote]
        );
        if (!resultadoLote.rowCount) {
            const error = new Error('No se encontró un lote activo para dar de baja.');
            error.status = 404;
            throw error;
        }

        const lote = resultadoLote.rows[0];
        const cantidad = Number(lote.cantidad);
        if (estadoBaja === 'MERMA' && cantidadMerma > cantidad) {
            const error = new Error('La cantidad perdida no puede superar la cantidad registrada en el lote.');
            error.status = 400;
            throw error;
        }

        let inventario = null;
        let merma = null;
        if (estadoBaja === 'MERMA') {
            let loteMerma = lote;
            if (cantidadMerma < cantidad) {
                const loteAfectado = await cliente.query(
                    `INSERT INTO base_datos.lotes_vencimiento
                        (codigo, cantidad, cantidad_original, fecha_vencimiento, fecha_ingreso,
                         activo, estado_baja, motivo_baja, fecha_baja, correo_usuario_baja)
                     VALUES ($1, $2, $3, $4, $5, FALSE, 'MERMA', $6, CURRENT_TIMESTAMP, $7)
                     RETURNING id_lote, codigo, cantidad, cantidad_original, fecha_vencimiento,
                               activo, estado_baja, motivo_baja, fecha_baja, correo_usuario_baja`,
                    [lote.codigo, cantidadMerma, lote.cantidad_original, lote.fecha_vencimiento,
                        lote.fecha_ingreso, motivo, usuario.rows[0].email]
                );
                loteMerma = loteAfectado.rows[0];

                await cliente.query(
                    `UPDATE base_datos.lotes_vencimiento
                     SET cantidad = cantidad - $2
                     WHERE id_lote = $1`,
                    [idLote, cantidadMerma]
                );
            }

            await cliente.query(
                `INSERT INTO base_datos.mermas_inventario
                    (codigo, id_lote, cantidad, motivo, descontado_stock, correo_usuario)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [lote.codigo, loteMerma.id_lote, cantidadMerma, motivo, descontarStock, usuario.rows[0].email]
            );
            merma = {id_lote: loteMerma.id_lote, cantidad: cantidadMerma, descontado_stock: descontarStock};
        }

        if (descontarStock) {
            await cliente.query(
                `INSERT INTO base_datos.inventario (codigo, stock_actual, stock_minimo)
                 VALUES ($1, 0, 0)
                 ON CONFLICT (codigo) DO NOTHING`,
                [lote.codigo]
            );
            const resultadoInventario = await cliente.query(
                `UPDATE base_datos.inventario
                 SET stock_actual = stock_actual - $1
                 WHERE codigo = $2
                 RETURNING stock_actual`,
                [cantidadMerma, lote.codigo]
            );
            inventario = resultadoInventario.rows[0];
            await cliente.query(
                `INSERT INTO base_datos.movimientos_inventario
                    (codigo, tipo, cantidad, motivo, correo_usuario)
                 VALUES ($1, 'SALIDA', $2, $3, $4)`,
                [lote.codigo, cantidadMerma, `Merma del lote ${lote.id_lote}: ${motivo}`.slice(0, 255), usuario.rows[0].email]
            );
        }

        const resultado = estadoBaja === 'MERMA' && cantidadMerma < cantidad
            ? await cliente.query(
                `SELECT id_lote, codigo, cantidad, cantidad_original, fecha_vencimiento, activo,
                        estado_baja, motivo_baja, fecha_baja, correo_usuario_baja
                 FROM base_datos.lotes_vencimiento
                 WHERE id_lote = $1`,
                [idLote]
            )
            : await cliente.query(
                `UPDATE base_datos.lotes_vencimiento
                 SET cantidad = CASE WHEN $2 = 'MERMA' THEN 0 ELSE cantidad END,
                     activo = FALSE,
                     estado_baja = $2,
                     motivo_baja = $3,
                     fecha_baja = CURRENT_TIMESTAMP,
                     correo_usuario_baja = $4
                 WHERE id_lote = $1
                 RETURNING id_lote, codigo, cantidad, cantidad_original, fecha_vencimiento, activo,
                           estado_baja, motivo_baja, fecha_baja, correo_usuario_baja`,
                [idLote, estadoBaja, motivo, usuario.rows[0].email]
            );

        await cliente.query('COMMIT');
        transaccionAbierta = false;
        return {lote: resultado.rows[0], inventario, merma};
    } catch (error) {
        if (transaccionAbierta) await cliente.query('ROLLBACK');
        throw error;
    } finally {
        cliente.release();
    }
};

const obtenerLotesVencimiento = async (estadoSolicitado, paginaSolicitada, filtrosSolicitados = {}) => {
    const estado = estadoSolicitado === 'inactivos' ? 'inactivos' : 'activos';
    const paginaNumero = Number.parseInt(paginaSolicitada, 10);
    const paginaPedida = Number.isSafeInteger(paginaNumero) && paginaNumero > 0 ? paginaNumero : 1;
    const limite = 15;
    const condicion = estado === 'activos'
        ? 'lv.activo = TRUE AND lv.cantidad > 0 AND lv.fecha_vencimiento >= CURRENT_DATE'
        : '(lv.activo = FALSE OR lv.cantidad <= 0 OR lv.fecha_vencimiento < CURRENT_DATE)';

    const estadoFiltro = String(filtrosSolicitados.estado || '').trim().toUpperCase();
    const ordenSolicitado = String(filtrosSolicitados.orden || 'asc').trim().toLowerCase();
    if (!['asc', 'desc'].includes(ordenSolicitado)) {
        const error = new Error('El orden de fechas seleccionado no es válido.');
        error.status = 400;
        throw error;
    }
    const estadosPermitidos = [
        'VENCIMIENTO CRÍTICO', 'VENCIMIENTO EN RIESGO', 'PRÓXIMO A VENCER',
        'VENCIDO', 'AGOTADO', 'VENDIDO', 'ELIMINADO', 'MERMA', 'OTRO'
    ];
    if (estadoFiltro && !estadosPermitidos.includes(estadoFiltro)) {
        const error = new Error('El estado seleccionado no es válido.');
        error.status = 400;
        throw error;
    }

    const validarFechaFiltro = valor => {
        const fecha = String(valor || '').trim();
        if (!fecha) return '';
        const parseada = new Date(`${fecha}T00:00:00Z`);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || Number.isNaN(parseada.getTime()) || parseada.toISOString().slice(0, 10) !== fecha) {
            const error = new Error('Una de las fechas del filtro no es válida.');
            error.status = 400;
            throw error;
        }
        return fecha;
    };
    const fechaDesde = validarFechaFiltro(filtrosSolicitados.fecha_desde);
    const fechaHasta = validarFechaFiltro(filtrosSolicitados.fecha_hasta);
    const busqueda = String(filtrosSolicitados.busqueda || '').trim().slice(0, 150);
    const condiciones = [condicion];
    const valoresFiltros = [];
    const agregarFiltro = (sql, valor) => {
        valoresFiltros.push(valor);
        condiciones.push(sql.replaceAll('?', `$${valoresFiltros.length}`));
    };

    if (busqueda) agregarFiltro(
        `(p.descripcion ILIKE ? OR lv.codigo ILIKE ? OR COALESCE(lv.correo_usuario_baja, '') ILIKE ? OR COALESCE(lv.motivo_baja, '') ILIKE ?)`,
        `%${busqueda}%`
    );
    if (fechaDesde) agregarFiltro('lv.fecha_vencimiento >= ?::date', fechaDesde);
    if (fechaHasta) agregarFiltro('lv.fecha_vencimiento <= ?::date', fechaHasta);

    const expresionEstado = `CASE
        WHEN lv.activo = FALSE THEN lv.estado_baja
        WHEN lv.cantidad <= 0 THEN 'AGOTADO'
        WHEN lv.fecha_vencimiento < CURRENT_DATE THEN 'VENCIDO'
        WHEN lv.fecha_vencimiento <= CURRENT_DATE + INTERVAL '5 days' THEN 'VENCIMIENTO CRÍTICO'
        WHEN lv.fecha_vencimiento <= CURRENT_DATE + INTERVAL '10 days' THEN 'VENCIMIENTO EN RIESGO'
        ELSE 'PRÓXIMO A VENCER'
    END`;
    if (estadoFiltro) agregarFiltro(`(${expresionEstado}) = ?`, estadoFiltro);
    const condicionCompleta = condiciones.join(' AND ');

    const [conteo, resumen] = await Promise.all([
        pool.query(
            `SELECT COUNT(*) AS total
             FROM base_datos.lotes_vencimiento lv
             INNER JOIN base_datos.productos p ON p.codigo = lv.codigo
             WHERE ${condicionCompleta}`,
            valoresFiltros
        ),
        pool.query(
            `SELECT
                COUNT(*) FILTER (WHERE lv.activo = TRUE AND lv.cantidad > 0 AND lv.fecha_vencimiento >= CURRENT_DATE) AS activos,
                COUNT(*) FILTER (WHERE lv.activo = FALSE OR lv.cantidad <= 0 OR lv.fecha_vencimiento < CURRENT_DATE) AS inactivos
             FROM base_datos.lotes_vencimiento lv`
        )
    ]);

    const total = Number(conteo.rows[0].total);
    const totalPaginas = Math.max(1, Math.ceil(total / limite));
    const pagina = Math.min(paginaPedida, totalPaginas);
    const offset = (pagina - 1) * limite;
    const sentidoOrden = ordenSolicitado.toUpperCase();
    const orden = `lv.fecha_vencimiento ${sentidoOrden}, lv.fecha_ingreso ${sentidoOrden}, lv.id_lote ${sentidoOrden}`;

    const resultado = await pool.query(
        `SELECT
            lv.id_lote,
            lv.codigo,
            p.descripcion AS producto,
            p.familia,
            lv.cantidad,
            lv.cantidad_original,
            COALESCE((
                SELECT SUM(mi.cantidad)
                FROM base_datos.mermas_inventario mi
                WHERE mi.id_lote = lv.id_lote
            ), 0) AS cantidad_afectada,
            lv.fecha_vencimiento,
            lv.fecha_ingreso,
            lv.activo,
            lv.estado_baja,
            lv.motivo_baja,
            lv.fecha_baja,
            lv.correo_usuario_baja,
            CASE
                WHEN lv.activo = FALSE THEN lv.estado_baja
                WHEN lv.cantidad <= 0 THEN 'AGOTADO'
                WHEN lv.fecha_vencimiento < CURRENT_DATE THEN 'VENCIDO'
                WHEN lv.fecha_vencimiento <= CURRENT_DATE + INTERVAL '5 days' THEN 'VENCIMIENTO CRÍTICO'
                WHEN lv.fecha_vencimiento <= CURRENT_DATE + INTERVAL '10 days' THEN 'VENCIMIENTO EN RIESGO'
                ELSE 'PRÓXIMO A VENCER'
            END AS estado
         FROM base_datos.lotes_vencimiento lv
         INNER JOIN base_datos.productos p ON p.codigo = lv.codigo
         WHERE ${condicionCompleta}
         ORDER BY ${orden}
        LIMIT $${valoresFiltros.length + 1} OFFSET $${valoresFiltros.length + 2}`,
        [...valoresFiltros, limite, offset]
    );

    return {
        lotes: resultado.rows,
        paginacion: {pagina_actual: pagina, total_paginas: totalPaginas, total_lotes: total, limite},
        resumen: {
            activos: Number(resumen.rows[0].activos),
            inactivos: Number(resumen.rows[0].inactivos)
        }
    };
};

const obtenerAlertasVencimiento = async () => {
    const resultado = await pool.query(
        `SELECT
            lv.id_lote,
            lv.codigo,
            p.descripcion AS producto,
            p.familia,
            lv.cantidad,
            lv.fecha_vencimiento,
            (lv.fecha_vencimiento - CURRENT_DATE) AS dias_restantes,
            CASE
                WHEN lv.fecha_vencimiento <= CURRENT_DATE + INTERVAL '5 days' THEN 'VENCIMIENTO CRÍTICO'
                ELSE 'VENCIMIENTO EN RIESGO'
            END AS estado,
            COUNT(*) OVER() AS total_alertas
         FROM base_datos.lotes_vencimiento lv
         INNER JOIN base_datos.productos p ON p.codigo = lv.codigo
         WHERE lv.activo = TRUE
           AND lv.cantidad > 0
           AND lv.fecha_vencimiento BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '10 days'
         ORDER BY lv.fecha_vencimiento ASC, p.descripcion ASC
         LIMIT 50`
    );
    return {
        alertas: resultado.rows,
        total: Number(resultado.rows[0]?.total_alertas || 0)
    };
};

module.exports = { obtenerLotesVencimiento, obtenerAlertasVencimiento, actualizarFechaVencimiento, darDeBajaLote };
