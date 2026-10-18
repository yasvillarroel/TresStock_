// importa el servicio de usuarios
const usuariosServicio = require('../../servicios/usuarios/usuarios_servicio');


// largo minimo permitido para la contraseña
const LARGO_MINIMO_PASSWORD = 8;

// formato basico de correo electronico
const EXPRESION_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


// =======================
// FUNCIONES DE USUARIO =
// =======================

    // funcion 1 crear usuario
    const crearUsuario = async (peticion, respuesta) => {

        try {

            // limpia los datos enviados desde el formulario
            const nombre = String(peticion.body.nombre || '').trim();
            const email = String(peticion.body.email || '').trim().toLowerCase();
            const password = String(peticion.body.password || '');
            const confirmar_password = String(peticion.body.confirmar_password || '');
            const rol = String(peticion.body.rol || '').trim();

            // valida el nombre
            if (nombre.length < 2 || nombre.length > 100) {
                return respuesta.status(400).json({
                    mensaje: 'El nombre debe tener entre 2 y 100 caracteres'
                });
            }

            // valida el correo
            if (email.length > 150 || !EXPRESION_EMAIL.test(email)) {
                return respuesta.status(400).json({
                    mensaje: 'El correo electrónico no es válido'
                });
            }

            // valida el largo de la contraseña
            if (password.length < LARGO_MINIMO_PASSWORD) {
                return respuesta.status(400).json({
                    mensaje: `La contraseña debe tener al menos ${LARGO_MINIMO_PASSWORD} caracteres`
                });
            }

            // valida que ambas contraseñas coincidan
            if (password !== confirmar_password) {
                return respuesta.status(400).json({
                    mensaje: 'Las contraseñas no coinciden'
                });
            }

            // traduce el nombre del rol a su id
            const id_rol = await usuariosServicio.obtenerIdRol(rol);

            if (!id_rol) {
                return respuesta.status(400).json({
                    mensaje: 'El rol seleccionado no es válido'
                });
            }

            // crea el usuario mediante el servicio
            const usuario = await usuariosServicio.crearUsuario(
                nombre,
                email,
                password,
                id_rol
            );

            // envia el usuario creado
            respuesta.status(201).json(usuario);

        } catch (fallo) {

            // 23505 es violacion de unicidad en postgres
            if (fallo.code === '23505') {
                return respuesta.status(409).json({
                    mensaje: 'Ya existe un usuario con ese correo electrónico'
                });
            }

            // muestra el error en la consola
            console.error('Error al crear usuario:', fallo);

            // envia una respuesta de error
            respuesta.status(500).json({
                mensaje: 'Error al crear usuario'
            });
        }
    };

    //FUNCION 2 OBTENER TODOS LOS USUARIOS
    const obtenerUsuarios = async (req, res) => {

        try {

            // obtiene los usuarios mediante el servicio
            const usuarios = await usuariosServicio.obtenerUsuarios();

            // envia los usuarios encontrados
            res.json(usuarios);

        } catch (error) {

            // muestra el error en la consola
            console.error('Error al obtener usuarios:', error);

            // envia una respuesta de error
            res.status(500).json({
                mensaje: 'Error al obtener usuarios'
            });
        }
    };

    //FUNCION 3 OBTENER USUARIO POR ID
    const obtenerUsuario = async (req, res) => {

        try {

            // obtiene el id desde la url
            const { id } = req.params;

            // obtiene el usuario mediante el servicio
            const usuario = await usuariosServicio.obtenerUsuario(id);

            // envia el usuario encontrado
            res.json(usuario);

        } catch (error) {

            // muestra el error en la consola
            console.error('Error al obtener usuario:', error);

            // envia una respuesta de error
            res.status(500).json({
                mensaje: 'Error al obtener usuario'
            });
        }
    };


    //FUNCION 4 ACTUALIZAR USUARIO
    const actualizarUsuario = async (req, res) => {

        try {

        const { id } = req.params;
        const { nombre, email, password, id_rol, activo } = req.body;

        const usuario = await usuariosServicio.actualizarUsuario(
            id,
            nombre,
            email,
            password,
            id_rol,
            activo
        );
            // envia el usuario actualizado
            res.json(usuario);

        } catch (error) {

            // muestra el error en la consola
            console.error('Error al actualizar usuario:', error);

            // envia una respuesta de error
            res.status(500).json({
                mensaje: 'Error al actualizar usuario'
            });
        }
    };


    //FUNCION 5 ELIMINAR USUARIO POR ID
    const eliminarUsuario = async (req, res) => {

        try {

            // obtiene el id desde la url
            const { id } = req.params;

            // elimina el usuario mediante el servicio
            const usuario = await usuariosServicio.eliminarUsuario(id);

            // envia el usuario eliminado
            res.json(usuario);

        } catch (error) {

            // muestra el error en la consola
            console.error('Error al eliminar usuario:', error);

            // envia una respuesta de error
            res.status(500).json({
                mensaje: 'Error al eliminar usuario'
            });
        }
    };

    // FUNCION 6 CAMBIAR CONTRASENA
    const cambiarContrasena = async (req, res) => {

        try {

            // obtiene el id del usuario
            const { id } = req.params;

            // obtiene la nueva contrasena
            const { password } = req.body;

            // cambia la contrasena
            const usuario = await usuariosServicio.cambiarContrasena(
                id,
                password
            );

            // envia el usuario actualizado
            res.json(usuario);

        } catch (error) {

            // muestra el error en la consola
            console.error('Error al cambiar contrasena:', error);

            // envia el error
            res.status(500).json({
                mensaje: 'Error al cambiar contrasena'
            });
        }
    };

    // FUNCION 7 CAMBIAR ESTADO DEL USUARIO
    const cambiarEstadoUsuario = async (req, res) => {

        try {

            // obtiene el id del usuario
            const { id } = req.params;

            // obtiene el estado
            const { activo } = req.body;

            // cambia el estado del usuario
            const usuario = await usuariosServicio.cambiarEstadoUsuario(
                id,
                activo
            );

            // envia el usuario actualizado
            res.json(usuario);

        } catch (error) {

            // muestra el error en la consola
            console.error('Error al cambiar estado del usuario:', error);

            // envia el error
            res.status(500).json({
                mensaje: 'Error al cambiar estado del usuario'
            });
        }
    };

    // FUNCION 8 CAMBIAR ROL DEL USUARIO
    const cambiarRolUsuario = async (req, res) => {

        try {

            // obtiene el id del usuario
            const { id } = req.params;

            // obtiene el nuevo rol
            const { id_rol } = req.body;

            // cambia el rol del usuario
            const usuario = await usuariosServicio.cambiarRolUsuario(
                id,
                id_rol
            );

            // envia el usuario actualizado
            res.json(usuario);

        } catch (error) {

            // muestra el error en la consola
            console.error('Error al cambiar rol del usuario:', error);

            // envia el error
            res.status(500).json({
                mensaje: 'Error al cambiar rol del usuario'
            });
        }
    };

    // EXPORTAR FUNCIONES 
    module.exports = {
        crearUsuario,
        obtenerUsuarios,
        obtenerUsuario,
        actualizarUsuario,
        eliminarUsuario,
        cambiarContrasena,
        cambiarEstadoUsuario,
        cambiarRolUsuario
    };