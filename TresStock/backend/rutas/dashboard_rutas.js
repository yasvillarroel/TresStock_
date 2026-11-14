const express = require('express');
const dashboardControlador = require('../controladores/dashboard_controlador');

const router = express.Router();

const { autorizar } = require('../middleware/autenticacion');
router.use(autorizar('dashboard', 'acceder'));

router.get('/resumen', dashboardControlador.obtenerResumen);
router.get('/productos-mas-vendidos', dashboardControlador.obtenerProductosMasVendidos);
router.get('/productos-excluidos', dashboardControlador.obtenerProductosExcluidosRanking);
router.post('/productos/:codigo/lista-negra', dashboardControlador.excluirProductoRanking);
router.delete('/productos/:codigo/lista-negra', dashboardControlador.restaurarProductoRanking);

module.exports = router;
