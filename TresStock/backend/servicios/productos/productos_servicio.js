// importa el pool de conexiones
const pool = require('../../configuracion/base_datos');


// FUNCION 1 CREAR PRODUCTO
const crearProducto = async (
    codigo,
    codigo_barra,
    descripcion,
    familia,
    precio_publico,
    imagen
) => {

    const resultado = await pool.query(
        `INSERT INTO base_datos.productos
        (codigo, cod_barra, descripcion, familia, precio_publico, imagen)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING
            codigo,
            cod_barra,
            descripcion,
            familia,
            precio_publico,
            imagen`,
        [
            codigo,
            codigo_barra,
            descripcion,
            familia,
            precio_publico,
            imagen
        ]
    );

    return resultado.rows[0];
};


// FUNCION 2 OBTENER TODOS LOS PRODUCTOS
const obtenerProductos = async () => {

    const resultado = await pool.query(
        `SELECT
            codigo,
            cod_barra,
            descripcion,
            familia,
            precio_publico,
            imagen
        FROM base_datos.productos
        ORDER BY codigo`
    );

    return resultado.rows;
};


// FUNCION 3 OBTENER PRODUCTO POR ID
const obtenerProducto = async (id) => {

    const resultado = await pool.query(
        `SELECT
            codigo,
            cod_barra,
            descripcion,
            familia,
            precio_publico,
            imagen
        FROM base_datos.productos
        WHERE codigo = $1`,
        [id]
    );

    return resultado.rows[0];
};


// FUNCION 4 ACTUALIZAR PRODUCTO
const actualizarProducto = async (
    id,
    codigo,
    codigo_barra,
    descripcion,
    familia,
    precio_publico,
    imagen
) => {

    const resultado = await pool.query(
        `UPDATE base_datos.productos
        SET
            codigo = $1,
            cod_barra = $2,
            descripcion = $3,
            familia = $4,
            precio_publico = $5,
            imagen = $6
        WHERE codigo = $7
        RETURNING
            codigo,
            cod_barra,
            descripcion,
            familia,
            precio_publico,
            imagen`,
        [
            codigo,
            codigo_barra,
            descripcion,
            familia,
            precio_publico,
            imagen,
            id
        ]
    );

    return resultado.rows[0];
};


// FUNCION 5 ELIMINAR PRODUCTO
const eliminarProducto = async (id) => {

    const resultado = await pool.query(
        `DELETE FROM base_datos.productos
        WHERE codigo = $1
        RETURNING
            codigo,
            cod_barra,
            descripcion,
            familia,
            precio_publico,
            imagen`,
        [id]
    );

    return resultado.rows[0];
};


// exporta las funciones
module.exports = {
    crearProducto,
    obtenerProductos,
    obtenerProducto,
    actualizarProducto,
    eliminarProducto
};