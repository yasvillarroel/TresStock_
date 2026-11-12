// importa express
const express = require('express');

// importa el controlador de ventas
const ventasControlador = require(
    '../../controladores/ventas/ventas_controlador'
);

// importa multer
const multer = require('multer');

// protege importaciones y configuración con una sesión válida
const { autenticacion } = require('../../middleware/autenticacion');


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


// ruta para consultar el inicio del control de inventario
router.get('/configuracion-inventario', autenticacion,
    ventasControlador.obtenerConfiguracionInventario);

// establece una sola vez la fecha desde la que se descuentan ventas
router.post('/configuracion-inventario', autenticacion,
    ventasControlador.configurarInicioInventario);

// ruta para importar ventas con sesion validada
router.post(
    '/importar',
    autenticacion,
    cargarArchivo.single('archivo'),
    ventasControlador.importarVentas
);

// ruta para obtener detalle
router.get(
    '/:id/detalle',
    ventasControlador.obtenerDetalleVenta
);


// exporta el router
module.exports = router;