// importa express
const express = require('express');


// importa el controlador de inventario
const escaneoControlador =
    require('../../controladores/escaneo/escaneo_controlador');

// crea el router de inventario
const router = express.Router();

router.get(
    '/producto/:codigo', 
    escaneoControlador.buscarProducto
);


// exporta el router
module.exports = router;