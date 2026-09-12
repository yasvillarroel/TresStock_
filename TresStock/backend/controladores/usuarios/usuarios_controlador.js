// importa el servicio de usuarios
const usuariosServicio = require('../../servicios/usuarios/usuarios_servicio');

// =======================
// FUNCIONES DE USUARIO =
// =======================

    //FUNCION 1 CREAR USUARIO
    const crearUsuario = async (req, res) => {

        try {

            // obtiene los datos enviados desde la peticion
            const { nombre, email, password, id_rol } = req.body;

            // muestra los datos recibidos
            console.log('datos para crear usuario:', {
                nombre,
                email,
                id_rol
            });

            // crea el usuario mediante el servicio
            const usuario = await usuariosServicio.crearUsuario(
                nombre,
                email,
                password,
                id_rol
            );

            // envia el usuario creado
            res.status(201).json(usuario);

        } catch (error) {

            // muestra el error en la consola
            console.error('Error al crear usuario:', error);

            // envia una respuesta de error
            res.status(500).json({
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



    // EXPORTAR FUNCIONES 
    module.exports = {
        crearUsuario,
        obtenerUsuarios,
        obtenerUsuario,
        actualizarUsuario,
        eliminarUsuario,
        cambiarContrasena,
        cambiarEstadoUsuario
    };