const express = require('express');
const alertasControlador = require('../../controladores/alertas/alertas_controlador');

const router = express.Router();

router.get('/vencimientos', alertasControlador.obtenerLotesVencimiento);

module.exports = router;
