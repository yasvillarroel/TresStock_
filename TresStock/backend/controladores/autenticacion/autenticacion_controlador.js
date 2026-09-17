// importa el servicio de autenticacion
const autenticacionServicio = require('../../servicios/autenticacion/autenticacion_servicio');

// importa la funcion para crear el jwt
const { firmarToken } = require('../../utilidades/jwt');

// importa las opciones de la cookie de sesion
const { OPCIONES_COOKIE_SESION } = require('../../utilidades/cookies');

// inicia sesion
const iniciarSesion = async (req, res) => {

    try {

        // obtiene los datos del formulario
        const { email, password } = req.body;

        // inicia sesion
        const usuario = await autenticacionServicio.iniciarSesion(
            email,
            password
        );

        // comprueba si los datos son incorrectos
        if (!usuario) {
            return res.status(401).json({
                mensaje: 'Correo o contrasena incorrectos'
            });
        }

        // crea el jwt con los datos necesarios del usuario
        const token = firmarToken({
            id: usuario.id_usuario,
            rol: usuario.id_rol
        });

        // guarda el jwt en una cookie segura
        res.cookie(
            'sesion',
            token,
            OPCIONES_COOKIE_SESION
        );

        // envia los datos del usuario
        res.json(usuario);

    } catch (error) {

        // muestra el error en la consola
        console.error('Error al iniciar sesion:', error);

        // envia el error
        res.status(500).json({
            mensaje: 'Error al iniciar sesion'
        });

    }
};

// controlador para verificar si la sesion sigue siendo valida
function verificarSesion(req, res) {

    // si llegamos aca, el middleware ya valido el token y dejo los datos en req.usuario
    res.status(200).json({
        usuario: req.usuario
    });
}

// exporta el controlador
module.exports = {
    iniciarSesion,
    verificarSesion
};