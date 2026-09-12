// importa express
const express = require('express');

// importa el controlador de usuarios
const usuariosControlador = require('../../controladores/usuarios/usuarios_controlador');

// crea el router de usuarios
const router = express.Router();


// =======================
// RUTAS DE USUARIO ======
// =======================

// ruta para crear un usuario
router.post('/', usuariosControlador.crearUsuario);

// ruta para obtener todos los usuarios
router.get('/', usuariosControlador.obtenerUsuarios);

// ruta para obtener un usuario por id
router.get('/:id', usuariosControlador.obtenerUsuario);

// ruta para actualizar un usuario
router.put('/:id', usuariosControlador.actualizarUsuario);

// ruta para eliminar un usuario por id
router.delete('/:id', usuariosControlador.eliminarUsuario);

// ruta para cambiar la contrasena
router.put('/:id/contrasena', usuariosControlador.cambiarContrasena);

// ruta para cambiar el estado del usuario
router.put('/:id/estado', usuariosControlador.cambiarEstadoUsuario);


// exporta las rutas
module.exports = router;