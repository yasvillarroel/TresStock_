// importa el pool de conexiones
const pool = require('../../configuracion/base_datos');


// FUNCION 1 CREAR PROVEEDOR
const crearProveedor = async (
    nombre_comercial,
    razon_social,
    rut,
    telefono,
    email,
    direccion,
    tiempo_entrega_dias
) => {

    const resultado = await pool.query(
        `INSERT INTO base_datos.proveedores
        (
            nombre_comercial,
            razon_social,
            rut,
            telefono,
            email,
            direccion,
            tiempo_entrega_dias
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING
            id_proveedor,
            nombre_comercial,
            razon_social,
            rut,
            telefono,
            email,
            direccion,
            tiempo_entrega_dias`,
        [
            nombre_comercial,
            razon_social || null,
            rut || null,
            telefono || null,
            email || null,
            direccion || null,
            tiempo_entrega_dias
        ]
    );

    return resultado.rows[0];
};


// FUNCION 2 OBTENER TODOS LOS PROVEEDORES
const obtenerProveedores = async () => {

    const resultado = await pool.query(
        `SELECT
            id_proveedor,
            nombre_comercial,
            razon_social,
            rut,
            telefono,
            email,
            direccion,
            tiempo_entrega_dias
        FROM base_datos.proveedores
        ORDER BY nombre_comercial`
    );

    return resultado.rows;
};


// FUNCION 3 OBTENER PROVEEDOR POR ID
const obtenerProveedor = async (id) => {

    const resultado = await pool.query(
        `SELECT
            id_proveedor,
            nombre_comercial,
            razon_social,
            rut,
            telefono,
            email,
            direccion,
            tiempo_entrega_dias
        FROM base_datos.proveedores
        WHERE id_proveedor = $1`,
        [id]
    );

    return resultado.rows[0];
};


// FUNCION 4 ACTUALIZAR PROVEEDOR
const actualizarProveedor = async (
    id,
    nombre_comercial,
    razon_social,
    rut,
    telefono,
    email,
    direccion,
    tiempo_entrega_dias
) => {

    const resultado = await pool.query(
        `UPDATE base_datos.proveedores
        SET
            nombre_comercial = $1,
            razon_social = $2,
            rut = $3,
            telefono = $4,
            email = $5,
            direccion = $6,
            tiempo_entrega_dias = COALESCE($7, tiempo_entrega_dias)
        WHERE id_proveedor = $8
        RETURNING
            id_proveedor,
            nombre_comercial,
            razon_social,
            rut,
            telefono,
            email,
            direccion,
            tiempo_entrega_dias`,
        [
            nombre_comercial,
            razon_social || null,
            rut || null,
            telefono || null,
            email || null,
            direccion || null,
            tiempo_entrega_dias,
            id
        ]
    );

    return resultado.rows[0];
};


// FUNCION 5 ELIMINAR PROVEEDOR
const eliminarProveedor = async (id) => {

    const resultado = await pool.query(
        `DELETE FROM base_datos.proveedores
        WHERE id_proveedor = $1
        RETURNING
            id_proveedor,
            nombre_comercial,
            razon_social,
            rut,
            telefono,
            email,
            direccion,
            tiempo_entrega_dias`,
        [id]
    );

    return resultado.rows[0];
};


// FUNCION 6 OBTENER INDICADORES DE PROVEEDORES
const obtenerResumenProveedores = async () => {

    const resultado = await pool.query(
        `WITH asociaciones AS
        (
            SELECT
                pp.id_proveedor,
                COUNT(DISTINCT pp.codigo) AS productos_asociados,
                COUNT(DISTINCT pp.codigo) FILTER (
                    WHERE COALESCE(i.stock_actual, 0) = 0
                ) AS productos_sin_stock

            FROM base_datos.producto_proveedor pp

            LEFT JOIN base_datos.inventario i
                ON i.codigo = pp.codigo

            GROUP BY pp.id_proveedor
        ),

        proveedor_mayor AS
        (
            SELECT
                p.nombre_comercial,
                a.productos_asociados

            FROM asociaciones a

            INNER JOIN base_datos.proveedores p
                ON p.id_proveedor = a.id_proveedor

            ORDER BY
                a.productos_asociados DESC,
                p.nombre_comercial ASC

            LIMIT 1
        )

        SELECT
            (
                SELECT COUNT(*)
                FROM base_datos.proveedores
            ) AS total_proveedores,

            (
                SELECT nombre_comercial
                FROM proveedor_mayor
            ) AS nombre_proveedor_mas_productos,

            COALESCE(
                (
                    SELECT productos_asociados
                    FROM proveedor_mayor
                ),
                0
            ) AS cantidad_productos_proveedor,

            (
                SELECT COUNT(*)
                FROM base_datos.proveedores p
                WHERE
                    COALESCE(BTRIM(p.rut), '') = ''
                    OR COALESCE(BTRIM(p.direccion), '') = ''
                    OR (
                        COALESCE(BTRIM(p.telefono), '') = ''
                        AND COALESCE(BTRIM(p.email), '') = ''
                    )
            ) AS proveedores_info_incompleta,

            (
                SELECT COUNT(*)
                FROM asociaciones a
                WHERE a.productos_sin_stock > 0
            ) AS proveedores_con_productos_sin_stock`
    );

    return resultado.rows[0];
};


// exporta las funciones
module.exports = {
    crearProveedor,
    obtenerProveedores,
    obtenerProveedor,
    actualizarProveedor,
    eliminarProveedor,
    obtenerResumenProveedores
};