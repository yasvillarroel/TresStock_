// Importa Express para crear y configurar rutas.
const express = require('express');
// Importa las funciones controladoras de autenticación.
const autenticacionControlador = require('../controladores/autenticacion_controlador');
// Importa el middleware que valida la sesión del usuario.
const { autenticacion: verificarSesionMiddleware } = require('../middleware/autenticacion');
// Importa la función para generar tokens CSRF y el middleware para validarlos.
const { generateCsrfToken, doubleCsrfProtection } = require('../utilidades/csrf');

// Crea un router para agrupar las rutas de autenticación.
const router = express.Router();

// Define una ruta GET pública para solicitar un token CSRF.
router.get('/csrf-token', (req, res) => {
    // Genera el token y configura la cookie CSRF en la respuesta.
    const csrfToken = generateCsrfToken(req, res);
    // Envía el token al frontend en formato JSON.
    return res.json({ csrfToken });
});

// Aplica la validación CSRF a las rutas registradas a continuación.
router.use(doubleCsrfProtection);

// Define la ruta POST para iniciar sesión y la conecta con su controlador.
router.post('/login', autenticacionControlador.iniciarSesion);
// Define la ruta GET para verificar la sesión y validar primero la autenticación.
router.get('/sesion', verificarSesionMiddleware, autenticacionControlador.verificarSesion);
// Define la ruta POST para cerrar sesión y la conecta con su controlador.
router.post('/logout', autenticacionControlador.cerrarSesion);
// Define la ruta POST para iniciar el registro y solicitar un código.
router.post('/registro/iniciar', autenticacionControlador.iniciarRegistro);
// Define la ruta POST para verificar el código y completar el registro.
router.post('/registro/verificar', autenticacionControlador.verificarCodigoRegistro);
// Define la ruta POST para iniciar la recuperación y solicitar un código.
router.post('/recuperar/iniciar', autenticacionControlador.solicitarRecuperacion);
// Define la ruta POST para verificar el código y cambiar la contraseña.
router.post('/recuperar/confirmar', autenticacionControlador.confirmarRecuperacion);

// Exporta el router para montarlo en la aplicación Express.
module.exports = router;