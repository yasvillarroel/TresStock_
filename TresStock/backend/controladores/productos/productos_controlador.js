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
            imagen,
            proveedor
        } = req.body;

        // crea el producto
        const producto = await productosServicio.crearProducto(
            codigo,
            codigo_barra,
            descripcion,
            familia,
            precio_publico,
            imagen,
            proveedor
        );

        // envia el producto creado
        res.status(201).json(producto);

    } catch (error) {

        // muestra el error en la consola
        console.error('Error al crear producto:', error);

        res.status(error.code === '23505' ? 409 : 400).json({
            mensaje: error.code === '23505'
                ? 'Ya existe un producto con ese código.'
                : (error.message || 'Error al crear producto')
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
            imagen,
            proveedor
        } = req.body;

        // actualiza el producto
        const producto = await productosServicio.actualizarProducto(
            id,
            codigo,
            codigo_barra,
            descripcion,
            familia,
            precio_publico,
            imagen,
            proveedor
        );

        // envia el producto actualizado
        res.json(producto);

    } catch (error) {

        // muestra el error en la consola
        console.error('Error al actualizar producto:', error);

        // envia el error
        res.status(400).json({
            mensaje: error.message || 'Error al actualizar producto'
        });

    }

};



// FUNCION 5 ELIMINAR PRODUCTO
const eliminarProducto = async (req, res) => {

    try {

        const { id } = req.params;

        const producto = await productosServicio.eliminarProducto(id);

        // verifica si el producto puede eliminarse
        if (!producto) {

            return res.status(409).json({
                mensaje:
                    'No se puede eliminar el producto porque ' +
                    'tiene stock, ventas, movimientos registrados ' +
                    'o no existe.'
            });
        }

        res.json({
            mensaje: 'Producto eliminado correctamente',
            producto
        });

    } catch (error) {

        console.error('Error al eliminar producto:', error);

        if (error.code === '23503') {

            return res.status(409).json({
                mensaje:
                    'No se puede eliminar porque el producto ' +
                    'tiene registros relacionados.'
            });
        }

        res.status(500).json({
            mensaje: 'Error al eliminar producto'
        });
    }
};


// FUNCION 6 IMPORTAR PRODUCTOS
const importarProductos = async (req, res) => {
    try {

        if (!req.file) {
            return res.status(400).json({
                mensaje: 'No se ha seleccionado ningún archivo'
            });
        }

        const resultado = await productosServicio.importarProductos(
            req.file
        );

        res.json(resultado);

    } catch (error) {

        console.error('Error al importar productos:', error);

        res.status(400).json({
            mensaje: error.message
        });

    }
};

// FUNCION 7 OBTENER FAMILIAS
const obtenerFamilias = async (req, res) => {

    try {

        const familias = await productosServicio.obtenerFamilias();

        res.json(familias);

    } catch (error) {

        console.error(
            'Error al obtener familias:',
            error
        );

        res.status(500).json({
            mensaje: 'No se pudieron obtener las familias'
        });

    }

};

// exporta las funciones
module.exports = {
    crearProducto,
    obtenerProductos,
    obtenerProducto,
    actualizarProducto,
    eliminarProducto,
    importarProductos,
    obtenerFamilias
};