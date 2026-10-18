// importa express
const express = require('express');
const path = require('path');

// importa el controlador de productos
const productosControlador = require('../../controladores/productos/productos_controlador');

// importar multer 
const multer = require('multer');

//configurar receptor del archivo
const cargarArchivo = multer({
    storage: multer.memoryStorage()
});

// permite subir solamente fotografias PNG, JPG o WebP de hasta 5 MB
const cargarImagen = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, archivo, callback) => {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(archivo.mimetype)) {
            return callback(new Error('Solo se permiten imágenes JPG, PNG o WebP.'));
        }
        callback(null, true);
    }
}).single('imagen_archivo');

// entrega errores de Multer como JSON, sin bloquear otras rutas
const recibirImagenProducto = (req, res, next) => {
    cargarImagen(req, res, (error) => {
        if (error) {
            return res.status(400).json({
                mensaje: error.code === 'LIMIT_FILE_SIZE'
                    ? 'La fotografía no puede superar 5 MB.'
                    : error.message
            });
        }
        next();
    });
};

// crea el router de productos
const router = express.Router();

// sirve los archivos guardados sin exponer otras carpetas del servidor
const carpetaImagenes = path.join(__dirname, '../../imagenes/productos');
router.use('/imagenes', express.static(carpetaImagenes, {
    fallthrough: false,
    maxAge: '7d',
    setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff')
}));

// ruta para crear un producto, con fotografia opcional
router.post('/', recibirImagenProducto, productosControlador.crearProducto);

// ruta para obtener todos los productos
router.get('/', productosControlador.obtenerProductos);

// ruta para obtener familias
router.get('/familias', productosControlador.obtenerFamilias);

// ruta para importar
router.post('/importar', cargarArchivo.single('archivo'), productosControlador.importarProductos);

// ruta para buscar una imagen por codigo de barras en Open Food Facts
// debe ir ANTES de /:id para no confundir la ruta
router.get('/buscar-imagen/:codigoBarra', productosControlador.buscarImagenProducto);

// ruta para obtener un producto por codigo
router.get('/:id', productosControlador.obtenerProducto);

// ruta para actualizar un producto
router.put('/:id', recibirImagenProducto, productosControlador.actualizarProducto);

// ruta para eliminar un producto
router.delete('/:id', productosControlador.eliminarProducto);



// exporta el router
module.exports = router;