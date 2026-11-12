const express = require('express');
const alertasControlador = require('../../controladores/alertas/alertas_controlador');

const router = express.Router();

const { autorizar } = require('../../middleware/autenticacion');
router.use(autorizar('alertas', 'acceder'));

router.get('/vencimientos', alertasControlador.obtenerLotesVencimiento);
router.get('/vencimientos/notificaciones', alertasControlador.obtenerAlertasVencimiento);
router.patch('/vencimientos/:id/fecha', alertasControlador.actualizarFechaVencimiento);
router.patch('/vencimientos/:id/baja', alertasControlador.darDeBajaLote);

module.exports = router;
