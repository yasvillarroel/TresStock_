// importa express
const express = require('express');

// importa el controlador de productos
const productosControlador = require('../../controladores/productos/productos_controlador');

// importar multer 
const multer = require('multer');

//configurar receptor del archivo
const cargarArchivo = multer({
    storage: multer.memoryStorage()
});

// crea el router de productos
const router = express.Router();

// ruta para crear un producto
router.post('/', productosControlador.crearProducto);

// ruta para obtener todos los productos
router.get('/', productosControlador.obtenerProductos);

// ruta para obtener familias
router.get('/familias', productosControlador.obtenerFamilias);

// ruta para importar
router.post('/importar', cargarArchivo.single('archivo'), productosControlador.importarProductos);

// ruta para obtener un producto por codigo
router.get('/:id', productosControlador.obtenerProducto);

// ruta para actualizar un producto
router.put('/:id', productosControlador.actualizarProducto);

// ruta para eliminar un producto
router.delete('/:id', productosControlador.eliminarProducto);



// exporta el router
module.exports = router;