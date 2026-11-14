// importa express
const express = require('express');
const path = require('path');
const os = require('os');

// importa el controlador de productos
const productosControlador = require('../controladores/productos_controlador');

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

const { autorizar } = require('../middleware/autenticacion');
router.use(autorizar('productos', 'acceder'));

// sirve las fotos nuevas desde una carpeta fuera del proyecto para evitar recargas de Live Server
// permite definir la misma carpeta de almacenamiento en produccion con TRESSTOCK_IMAGENES_DIR
const carpetaImagenes = path.resolve(
    process.env.TRESSTOCK_IMAGENES_DIR ||
    path.join(os.homedir(), 'TresStock_datos', 'imagenes', 'productos')
);

// conserva el acceso a las fotografias anteriores almacenadas dentro del backend
const carpetaImagenesAnteriores = path.join(__dirname, '../imagenes/productos');

// mantiene la URL publica original: /api/productos/imagenes/nombre.webp
// primero busca la foto nueva y despues la antigua; no expone otras carpetas
const opcionesImagenes = {
    maxAge: '7d',
    setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff')
};

router.use('/imagenes',
    express.static(carpetaImagenes, {
        ...opcionesImagenes,
        fallthrough: true
    }),
    express.static(carpetaImagenesAnteriores, {
        ...opcionesImagenes,
        fallthrough: false
    })
);

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

// cambia el estado del producto sin eliminar registros de PostgreSQL
router.patch('/:id/estado', productosControlador.cambiarEstadoProducto);



// exporta el router
module.exports = router;
