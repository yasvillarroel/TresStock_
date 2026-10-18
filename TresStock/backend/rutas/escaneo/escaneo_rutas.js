// importa express
const express = require('express');

// importa el controlador de inventario
const escaneoControlador =
    require('../../controladores/escaneo/escaneo_controlador');

// crea el router de inventario
const router = express.Router();


// busca un producto mediante su codigo escaneado
router.get(
    '/producto/:codigo',
    escaneoControlador.buscarProducto
);


// busca productos existentes para asociar un codigo
router.get(
    '/productos-asociar',
    escaneoControlador.buscarProductosParaAsociar
);


// asocia un codigo de barras a un producto existente
router.post(
    '/asociar-codigo',
    escaneoControlador.asociarCodigoProducto
);

// elimina un codigo asociado
router.delete(
    '/codigo-asociado/:codigoBarras',
    escaneoControlador.eliminarCodigoAsociado
);


// exporta el router
module.exports = router;