// importa el servicio de productos
const productosServicio = require('../../servicios/productos/productos_servicio');
const fs = require('fs/promises');
const path = require('path');
const { randomUUID } = require('crypto');
const sharp = require('sharp');

// guarda fotografias propias comprimidas en WebP (no se guarda el binario en PostgreSQL)
const carpetaImagenesProductos = path.join(__dirname, '../../imagenes/productos');

const guardarImagenManualProducto = async (archivo) => {
    if (!archivo) return null;

    let procesada;
    try {
        const entrada = sharp(archivo.buffer, { limitInputPixels: 20000000, failOn: 'error' });
        const informacion = await entrada.metadata();
        if (!['jpeg', 'png', 'webp'].includes(informacion.format)) {
            throw new Error('Formato no válido');
        }
        procesada = await entrada
            .rotate()
            .resize({ width: 640, height: 640, fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 80 })
            .toBuffer();
    } catch (error) {
        const fallo = new Error('La fotografía no es válida o está dañada. Usa JPG, PNG o WebP.');
        fallo.statusCode = 400;
        throw fallo;
    }

    await fs.mkdir(carpetaImagenesProductos, { recursive: true });
    const nombre = randomUUID() + '.webp';
    const archivoGuardado = path.join(carpetaImagenesProductos, nombre);
    await fs.writeFile(archivoGuardado, procesada, { flag: 'wx' });
    return {
        archivoGuardado,
        rutaPublica: '/api/productos/imagenes/' + nombre
    };
};

const limpiarArchivoFallido = async (archivoGuardado) => {
    if (!archivoGuardado) return;
    try {
        await fs.unlink(archivoGuardado);
    } catch (error) {
        console.error('No se pudo limpiar la fotografía fallida:', error);
    }
};


// FUNCION 1 CREAR PRODUCTO
const crearProducto = async (req, res) => {

    let fotografiaSubida = null;

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

        // una fotografia nueva tiene prioridad sobre una URL existente
        fotografiaSubida = await guardarImagenManualProducto(req.file);
        const imagenFinal = fotografiaSubida ? fotografiaSubida.rutaPublica : (imagen || null);

        // crea el producto
        const producto = await productosServicio.crearProducto(
            codigo,
            codigo_barra,
            descripcion,
            familia,
            precio_publico,
            imagenFinal,
            proveedor
        );

        // envia el producto creado
        res.status(201).json(producto);

    } catch (error) {

        await limpiarArchivoFallido(fotografiaSubida?.archivoGuardado);
        // muestra el error en la consola
        console.error('Error al crear producto:', error);

        res.status(error.code === '23505' ? 409 : (error.statusCode || 400)).json({
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

    let fotografiaSubida = null;

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

        // si se adjunto un archivo, usar su ruta en lugar de la URL anterior
        fotografiaSubida = await guardarImagenManualProducto(req.file);
        const imagenFinal = fotografiaSubida ? fotografiaSubida.rutaPublica : (imagen || null);

        // actualiza el producto
        const producto = await productosServicio.actualizarProducto(
            id,
            codigo,
            codigo_barra,
            descripcion,
            familia,
            precio_publico,
            imagenFinal,
            proveedor
        );

        // envia el producto actualizado
        res.json(producto);

    } catch (error) {

        await limpiarArchivoFallido(fotografiaSubida?.archivoGuardado);
        // muestra el error en la consola
        console.error('Error al actualizar producto:', error);

        // envia el error
        res.status(error.statusCode || 400).json({
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

        // el Excel reemplaza los saldos incluso si el producto ya existe
        // se requiere confirmacion explicita en cada importacion
        if (req.body.confirmar_reemplazo_stock !== 'SI') {
            return res.status(400).json({
                mensaje: 'Confirma el reemplazo del STOCK ACTUAL para continuar.'
            });
        }

        const resultado = await productosServicio.importarProductos(
            req.file,
            true
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



// FUNCION 8 BUSCAR IMAGEN DE PRODUCTO
const buscarImagenProducto = async (req, res) => {

    try {
        const { codigoBarra } = req.params;

        const resultado = await productosServicio.buscarImagenProducto(
            codigoBarra
        );

        res.json(resultado);

    } catch (error) {
        console.error('Error al buscar imagen del producto:', error);

        res.status(error.statusCode || 500).json({
            mensaje: error.message || 'Error al buscar la imagen del producto.'
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
    obtenerFamilias,
    buscarImagenProducto
};