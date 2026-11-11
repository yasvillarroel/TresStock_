const pool = require('../../configuracion/base_datos');

const obtenerLotesVencimiento = async (estadoSolicitado, paginaSolicitada) => {
    const estado = estadoSolicitado === 'inactivos' ? 'inactivos' : 'activos';
    const paginaNumero = Number.parseInt(paginaSolicitada, 10);
    const paginaPedida = Number.isSafeInteger(paginaNumero) && paginaNumero > 0 ? paginaNumero : 1;
    const limite = 15;
    const condicion = estado === 'activos'
        ? 'cantidad > 0 AND fecha_vencimiento >= CURRENT_DATE'
        : '(cantidad <= 0 OR fecha_vencimiento < CURRENT_DATE)';

    const [conteo, resumen] = await Promise.all([
        pool.query(
            `SELECT COUNT(*) AS total
             FROM base_datos.lotes_vencimiento
             WHERE ${condicion}`
        ),
        pool.query(
            `SELECT
                COUNT(*) FILTER (WHERE cantidad > 0 AND fecha_vencimiento >= CURRENT_DATE) AS activos,
                COUNT(*) FILTER (WHERE cantidad <= 0 OR fecha_vencimiento < CURRENT_DATE) AS inactivos
             FROM base_datos.lotes_vencimiento`
        )
    ]);

    const total = Number(conteo.rows[0].total);
    const totalPaginas = Math.max(1, Math.ceil(total / limite));
    const pagina = Math.min(paginaPedida, totalPaginas);
    const offset = (pagina - 1) * limite;
    const orden = estado === 'activos'
        ? 'lv.fecha_vencimiento ASC, lv.fecha_ingreso ASC, lv.id_lote ASC'
        : 'lv.fecha_vencimiento DESC, lv.fecha_ingreso DESC, lv.id_lote DESC';

    const resultado = await pool.query(
        `SELECT
            lv.id_lote,
            lv.codigo,
            p.descripcion AS producto,
            p.familia,
            lv.cantidad,
            lv.fecha_vencimiento,
            lv.fecha_ingreso,
            CASE
                WHEN lv.cantidad <= 0 THEN 'AGOTADO'
                WHEN lv.fecha_vencimiento < CURRENT_DATE THEN 'VENCIDO'
                WHEN lv.fecha_vencimiento <= CURRENT_DATE + INTERVAL '10 days' THEN 'PRÓXIMO A VENCER'
                ELSE 'VIGENTE'
            END AS estado
         FROM base_datos.lotes_vencimiento lv
         INNER JOIN base_datos.productos p ON p.codigo = lv.codigo
         WHERE ${condicion}
         ORDER BY ${orden}
         LIMIT $1 OFFSET $2`,
        [limite, offset]
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

module.exports = { obtenerLotesVencimiento };
