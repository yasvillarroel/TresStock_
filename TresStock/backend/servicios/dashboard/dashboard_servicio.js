const pool = require('../../configuracion/base_datos');

const obtenerResumenDashboard = async () => {
    const resultado = await pool.query(
        `SELECT
            (SELECT COUNT(*) FROM base_datos.productos) AS cantidad_productos,
            COUNT(*) FILTER (
                WHERE COALESCE(i.stock_actual, 0) > 0
                    AND COALESCE(i.stock_minimo, 0) > 0
                    AND i.stock_actual <= i.stock_minimo
            ) AS productos_stock_bajo,
            COUNT(*) FILTER (
                WHERE COALESCE(i.stock_actual, 0) = 0
            ) AS productos_agotados,
            COALESCE((
                SELECT SUM(v.total)
                FROM base_datos.ventas v
                WHERE v.fecha_hora >= DATE_TRUNC('month', CURRENT_DATE)
                    AND v.fecha_hora < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
            ), 0) AS ventas_mes_actual
         FROM base_datos.productos p
         LEFT JOIN base_datos.inventario i ON i.codigo = p.codigo`
    );

    return resultado.rows[0];
};

const obtenerProductosMasVendidos = async (periodo = 'todo') => {
    const filtrosFecha = {
        mes: `AND v.fecha_hora >= DATE_TRUNC('month', CURRENT_DATE)
              AND v.fecha_hora < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'`,
        tres_meses: `AND v.fecha_hora >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '2 months'
                     AND v.fecha_hora < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'`
    };
    const condicionFecha = filtrosFecha[periodo] || '';

    const resultado = await pool.query(
        `SELECT
            p.codigo,
            p.descripcion,
            SUM(dv.cantidad) AS cantidad_vendida
         FROM base_datos.detalle_venta dv
         INNER JOIN base_datos.ventas v ON v.id_venta = dv.id_venta
         INNER JOIN base_datos.productos p ON p.codigo = dv.codigo
         WHERE 1 = 1
            ${condicionFecha}
            AND NOT EXISTS (
                SELECT 1
                FROM base_datos.productos_excluidos_ranking e
                WHERE e.codigo = p.codigo
            )
         GROUP BY p.codigo, p.descripcion
         HAVING SUM(dv.cantidad) > 0
         ORDER BY cantidad_vendida DESC, p.descripcion ASC
         LIMIT 50`
    );

    return resultado.rows;
};

const obtenerProductosExcluidosRanking = async () => {
    const resultado = await pool.query(
        `SELECT
            e.codigo,
            p.descripcion,
            e.fecha_hora,
            e.correo_usuario
         FROM base_datos.productos_excluidos_ranking e
         INNER JOIN base_datos.productos p ON p.codigo = e.codigo
         ORDER BY e.fecha_hora DESC, p.descripcion ASC`
    );

    return resultado.rows;
};

const excluirProductoRanking = async (codigo, correoUsuario) => {
    const resultado = await pool.query(
        `INSERT INTO base_datos.productos_excluidos_ranking
            (codigo, fecha_hora, correo_usuario)
         SELECT p.codigo, CURRENT_TIMESTAMP, $2
         FROM base_datos.productos p
         WHERE p.codigo = $1
         ON CONFLICT (codigo) DO UPDATE SET
            fecha_hora = CURRENT_TIMESTAMP,
            correo_usuario = EXCLUDED.correo_usuario
         RETURNING codigo`,
        [codigo, correoUsuario || null]
    );

    return resultado.rowCount > 0;
};

const restaurarProductoRanking = async (codigo) => {
    const resultado = await pool.query(
        `DELETE FROM base_datos.productos_excluidos_ranking
         WHERE codigo = $1
         RETURNING codigo`,
        [codigo]
    );

    return resultado.rowCount > 0;
};

module.exports = {
    obtenerResumenDashboard,
    obtenerProductosMasVendidos,
    obtenerProductosExcluidosRanking,
    excluirProductoRanking,
    restaurarProductoRanking
};
