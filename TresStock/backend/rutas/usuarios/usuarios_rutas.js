// importa express
const express = require('express');
const usuariosControlador = require('../../controladores/usuarios/usuarios_controlador');
const router = express.Router();

// TITULO 1 RUTAS DE USUARIOS

// IMPORTANTE: antes de usar en producción, aplicar el middleware de autenticación y
// autorización de Administrador del proyecto a todas estas rutas.
// La integración definitiva necesita conocer el archivo de inicio de sesión.
router.post('/', usuariosControlador.crearUsuario);
router.get('/', usuariosControlador.obtenerUsuarios);
router.get('/:id', usuariosControlador.obtenerUsuario);
router.put('/:id', usuariosControlador.actualizarUsuario);

// no se permite borrar usuarios permanentemente
router.delete('/:id', usuariosControlador.eliminarUsuario);

// se conservan rutas previas de compatibilidad
router.put('/:id/contrasena', usuariosControlador.cambiarContrasena);
router.put('/:id/estado', usuariosControlador.cambiarEstadoUsuario);
router.put('/:id/rol', usuariosControlador.cambiarRolUsuario);

module.exports = router;
