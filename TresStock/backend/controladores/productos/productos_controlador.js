// importa el servicio de productos
const productosServicio = require('../../servicios/productos/productos_servicio');


// FUNCION 1 CREAR PRODUCTO
const crearProducto = async (req, res) => {

    try {

        // obtiene los datos del producto
        const {
            codigo,
            codigo_barra,
            descripcion,
            familia,
            precio_publico,
            imagen
        } = req.body;

        // crea el producto
        const producto = await productosServicio.crearProducto(
            codigo,
            codigo_barra,
            descripcion,
            familia,
            precio_publico,
            imagen
        );

        // envia el producto creado
        res.status(201).json(producto);

    } catch (error) {

        // muestra el error en la consola
        console.error('Error al crear producto:', error);

        // envia el error
        res.status(500).json({
            mensaje: 'Error al crear producto'
        });

    }

};


// FUNCION 2 OBTENER TODOS LOS PRODUCTOS
const obtenerProductos = async (req, res) => {

    try {

        // obtiene los productos
        const productos = await productosServicio.obtenerProductos();

        // envia los productos
        res.json(productos);

    } catch (error) {

        // muestra el error en la consola
        console.error('Error al obtener productos:', error);

        // envia el error
        res.status(500).json({
            mensaje: 'Error al obtener productos'
        });

    }

};


// FUNCION 3 OBTENER PRODUCTO POR ID
const obtenerProducto = async (req, res) => {

    try {

        // obtiene el id del producto
        const { id } = req.params;

        // obtiene el producto
        const producto = await productosServicio.obtenerProducto(id);

        // envia el producto
        res.json(producto);

    } catch (error) {

        // muestra el error en la consola
        console.error('Error al obtener producto:', error);

        // envia el error
        res.status(500).json({
            mensaje: 'Error al obtener producto'
        });

    }

};


// FUNCION 4 ACTUALIZAR PRODUCTO
const actualizarProducto = async (req, res) => {

    try {

        // obtiene el id del producto
        const { id } = req.params;

        // obtiene los datos del producto
        const {
            codigo,
            codigo_barra,
            descripcion,
            familia,
            precio_publico,
            imagen
        } = req.body;

        // actualiza el producto
        const producto = await productosServicio.actualizarProducto(
            id,
            codigo,
            codigo_barra,
            descripcion,
            familia,
            precio_publico,
            imagen
        );

        // envia el producto actualizado
        res.json(producto);

    } catch (error) {

        // muestra el error en la consola
        console.error('Error al actualizar producto:', error);

        // envia el error
        res.status(500).json({
            mensaje: 'Error al actualizar producto'
        });

    }

};


// FUNCION 5 ELIMINAR PRODUCTO
const eliminarProducto = async (req, res) => {

    try {

        // obtiene el id del producto
        const { id } = req.params;

        // elimina el producto
        const producto = await productosServicio.eliminarProducto(id);

        // envia el producto eliminado
        res.json(producto);

    } catch (error) {

        // muestra el error en la consola
        console.error('Error al eliminar producto:', error);

        // envia el error
        res.status(500).json({
            mensaje: 'Error al eliminar producto'
        });

    }

};


// exporta las funciones
module.exports = {
    crearProducto,
    obtenerProductos,
    obtenerProducto,
    actualizarProducto,
    eliminarProducto
};