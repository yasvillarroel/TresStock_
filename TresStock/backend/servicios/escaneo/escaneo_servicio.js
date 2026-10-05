// importa el pool de conexiones
const pool = require('../../configuracion/base_datos');


// BUSCAR PRODUCTO POR CODIGO ESCANEADO
// busca en este orden: codigo del producto, codigo de barras y codigos asociados
const buscarProductoPorCodigo = async (codigo) => {

    const resultado = await pool.query(
        `
        WITH encontrado AS (
            SELECT codigo, factor
            FROM (
                SELECT
                    p.codigo AS codigo,
                    1::numeric AS factor,
                    1 AS prioridad
                FROM base_datos.productos p
                WHERE p.codigo = $1
                   OR p.cod_barra = $1

                UNION ALL

                SELECT
                    ca.codigo_producto AS codigo,
                    ca.cantidad_unidades AS factor,
                    2 AS prioridad
                FROM base_datos.codigos_asociados ca
                WHERE ca.codigo_barras = $1
            ) t
            ORDER BY prioridad
            LIMIT 1
        )
        SELECT
            p.codigo,
            p.cod_barra,
            p.descripcion,
            p.familia,
            p.precio_publico,
            p.imagen,
            e.factor,
            COALESCE(i.stock_actual, 0) AS stock_actual,
            COALESCE(i.stock_minimo, 0) AS stock_minimo
        FROM encontrado e
        JOIN base_datos.productos p
            ON p.codigo = e.codigo
        LEFT JOIN base_datos.inventario i
            ON i.codigo = p.codigo
        `,
        [codigo]
    );

    if (resultado.rows.length === 0) {
        return null;
    }

    return resultado.rows[0];

};


// exporta las funciones
module.exports = {
    buscarProductoPorCodigo
};
