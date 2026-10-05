// importa express
const express = require('express');


// importa el controlador de inventario
const inventarioControlador =
    require('../../controladores/inventario/inventario_controlador');


// crea el router de inventario
const router = express.Router();


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

// ruta para recalcular automaticamente el stock minimo
router.put(
    '/recalcular-stock-minimo',
    inventarioControlador.recalcularStockMinimo
);

// ruta para actualizar el stock minimo
router.put(
    '/:codigo/stock-minimo',
    inventarioControlador.actualizarStockMinimo
);


// exporta el router
module.exports = router;