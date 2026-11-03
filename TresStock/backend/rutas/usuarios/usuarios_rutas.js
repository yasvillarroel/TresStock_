// importa Express
const express = require('express');

// importa el controlador de usuarios
const usuariosControlador = require('../../controladores/usuarios/usuarios_controlador');

// importa la validacion de sesion y del rol administrador
const { autenticacion, soloAdministrador } = require('../../middleware/autenticacion');

// crea el router de usuarios
const router = express.Router();

// =============================================
// TITULO 1 PROTEGER TODAS LAS RUTAS DE USUARIOS
// =============================================

// si no hay sesion valida, responde 401
// si la cuenta no tiene rol Administrador, responde 403
router.use(autenticacion, soloAdministrador);

// =========================
// TITULO 2 RUTAS DE USUARIOS
// =========================

// ruta para crear un usuario
router.post('/', usuariosControlador.crearUsuario);

// ruta para obtener todos los usuarios
router.get('/', usuariosControlador.obtenerUsuarios);

// ruta para obtener un usuario por ID
router.get('/:id', usuariosControlador.obtenerUsuario);

// ruta para actualizar los datos de un usuario
router.put('/:id', usuariosControlador.actualizarUsuario);

// elimina usuarios solo a nivel de interfaz: el controlador responde 405
router.delete('/:id', usuariosControlador.eliminarUsuario);

// se conservan rutas de compatibilidad, todas protegidas
router.put('/:id/contrasena', usuariosControlador.cambiarContrasena);
router.put('/:id/estado', usuariosControlador.cambiarEstadoUsuario);
router.put('/:id/rol', usuariosControlador.cambiarRolUsuario);

module.exports = router;
