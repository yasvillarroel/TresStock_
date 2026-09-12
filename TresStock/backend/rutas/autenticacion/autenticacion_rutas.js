// importa express
const express = require('express');

// importa el controlador de autenticacion
const autenticacionControlador = require('../../controladores/autenticacion/autenticacion_controlador');

// crea el router de autenticacion
const router = express.Router();

// ruta para iniciar sesion
router.post('/login', autenticacionControlador.iniciarSesion);

// exporta el router
module.exports = router;