// importa el pool de conexiones
const pool = require('../../configuracion/base_datos');


// FUNCION 1 OBTENER INVENTARIO
const obtenerInventario = async () => {

    const resultado = await pool.query(
        `SELECT
            p.codigo,
            p.cod_barra,
            p.descripcion,
            p.familia,

            COALESCE(
                i.stock_actual,
                0
            ) AS stock_actual,

            COALESCE(
                i.stock_minimo,
                0
            ) AS stock_minimo,

            CASE

                WHEN COALESCE(i.stock_actual, 0) = 0
                    THEN 'SIN STOCK'

                WHEN COALESCE(i.stock_actual, 0)
                     <= COALESCE(i.stock_minimo, 0)
                     AND COALESCE(i.stock_minimo, 0) > 0
                    THEN 'STOCK BAJO'

                ELSE 'OPTIMO'

            END AS estado

        FROM base_datos.productos p

        LEFT JOIN base_datos.inventario i
            ON p.codigo = i.codigo

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


// FUNCION 4 ACTUALIZAR STOCK MINIMO
const actualizarStockMinimo = async (
    codigo,
    stockMinimo
) => {

    const resultado = await pool.query(
        `INSERT INTO base_datos.inventario
        (
            codigo,
            stock_actual,
            stock_minimo
        )

        VALUES ($1, 0, $2)

        ON CONFLICT (codigo)

        DO UPDATE SET
            stock_minimo = EXCLUDED.stock_minimo

        RETURNING
            codigo,
            stock_actual,
            stock_minimo`,
        [
            codigo,
            stockMinimo
        ]
    );


    return resultado.rows[0];
};

// FUNCION RECALCULAR STOCK MINIMO

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
            cs.stock_minimo

        FROM calculo_stock cs

        WHERE
            i.codigo =
            cs.codigo

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


// exporta las funciones
module.exports = {
    obtenerInventario,
    obtenerResumenInventario,
    obtenerFamilias,
    actualizarStockMinimo,
    recalcularStockMinimo
};