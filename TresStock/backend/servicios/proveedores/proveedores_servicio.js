// importa el pool de conexiones
const pool = require('../../configuracion/base_datos');


// FUNCION 1 CREAR PROVEEDOR
const crearProveedor = async (
    nombre_comercial,
    razon_social,
    rut,
    telefono,
    email,
    direccion
) => {

    const resultado = await pool.query(
        `INSERT INTO base_datos.proveedores
        (
            nombre_comercial,
            razon_social,
            rut,
            telefono,
            email,
            direccion
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING
            id_proveedor,
            nombre_comercial,
            razon_social,
            rut,
            telefono,
            email,
            direccion`,
        [
            nombre_comercial,
            razon_social || null,
            rut || null,
            telefono || null,
            email || null,
            direccion || null
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
            direccion
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
            direccion
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
    direccion
) => {

    const resultado = await pool.query(
        `UPDATE base_datos.proveedores
        SET
            nombre_comercial = $1,
            razon_social = $2,
            rut = $3,
            telefono = $4,
            email = $5,
            direccion = $6
        WHERE id_proveedor = $7
        RETURNING
            id_proveedor,
            nombre_comercial,
            razon_social,
            rut,
            telefono,
            email,
            direccion`,
        [
            nombre_comercial,
            razon_social || null,
            rut || null,
            telefono || null,
            email || null,
            direccion || null,
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
            direccion`,
        [id]
    );

    return resultado.rows[0];
};


// exporta las funciones
module.exports = {
    crearProveedor,
    obtenerProveedores,
    obtenerProveedor,
    actualizarProveedor,
    eliminarProveedor
};