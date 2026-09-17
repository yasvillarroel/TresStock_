// importa express
const express = require('express');

// importa el controlador de autenticacion
const autenticacionControlador = require('../../controladores/autenticacion/autenticacion_controlador');

// importa el middleware de autenticacion (verifica la cookie/JWT)
const { autenticacion: verificarSesionMiddleware } = require('../../middleware/autenticacion');




// crea el router de autenticacion
const router = express.Router();

// ruta para iniciar sesion
router.post('/login', autenticacionControlador.iniciarSesion);

// ruta para verificar si la sesion actual sigue siendo valida
// pasa primero por el middleware: si la cookie es invalida, el middleware responde 401
// y ni siquiera llega a ejecutarse el controlador
router.get('/sesion', verificarSesionMiddleware, autenticacionControlador.verificarSesion);

// exporta el router
module.exports = router;