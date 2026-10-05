// importa express
const express = require('express');

// importa el controlador de ventas
const ventasControlador = require(
    '../../controladores/ventas/ventas_controlador'
);

// importa multer
const multer = require('multer');


// configura la recepción del archivo
const cargarArchivo = multer(
    {
        storage:
            multer.memoryStorage(),

        limits: {
            fileSize:
                200 *
                1024 *
                1024
        }
    }
);


// crea el router
const router =
    express.Router();


// ruta para obtener ventas
router.get(
    '/',
    ventasControlador.obtenerVentas
);


// ruta para obtener resumen
router.get(
    '/resumen',
    ventasControlador.obtenerResumenVentas
);


// ruta para importar ventas
router.post(
    '/importar',
    cargarArchivo.single(
        'archivo'
    ),
    ventasControlador.importarVentas
);


// ruta para obtener detalle
router.get(
    '/:id/detalle',
    ventasControlador.obtenerDetalleVenta
);


// exporta el router
module.exports = router;