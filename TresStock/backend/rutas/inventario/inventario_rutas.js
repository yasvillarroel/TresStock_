// importa express
const express = require('express');


// importa el controlador de inventario
const inventarioControlador =
    require('../../controladores/inventario/inventario_controlador');


// protege los cambios manuales con una sesión válida
const { autenticacion, autorizar } = require('../../middleware/autenticacion');

// crea el router de inventario
const router = express.Router();
router.use(autorizar('inventario', 'acceder'));


// ruta para obtener el inventario
router.get(
    '/',
    inventarioControlador.obtenerInventario
);


// ruta para obtener los indicadores
router.get(
    '/resumen',
    inventarioControlador.obtenerResumenInventario
);


// ruta para obtener las familias
router.get(
    '/familias',
    inventarioControlador.obtenerFamilias
);

// ruta para consultar entradas, salidas, ajustes y movimientos
router.get(
    '/movimientos',
    inventarioControlador.obtenerMovimientosInventario
);

// ruta para recalcular automaticamente el stock minimo
router.put(
    '/recalcular-stock-minimo',
    inventarioControlador.recalcularStockMinimo
);

// ruta para ajustar el inventario
router.post(
    '/ajustar',
    autenticacion,
    inventarioControlador.ajustarInventario
);


// exporta el router
module.exports = router;
