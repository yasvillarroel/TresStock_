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
const verificarSesion = async (req, res) => {

    try {

        // el middleware ya valido la cookie JWT y guardo sus datos en req.usuario
        const idUsuario = Number(req.usuario?.id);

        if (!Number.isSafeInteger(idUsuario) || idUsuario <= 0) {
            return res.status(401).json({
                mensaje: 'Sesion invalida'
            });
        }

        // obtiene el nombre y correo vigentes desde PostgreSQL
        const usuario = await autenticacionServicio.obtenerUsuarioPorId(idUsuario);

        // rechaza sesiones de usuarios eliminados o desactivados
        if (!usuario) {
            return res.status(401).json({
                mensaje: 'La sesion ya no es valida'
            });
        }

        return res.status(200).json({ usuario });

    } catch (error) {

        console.error('Error al verificar la sesion:', error);

        return res.status(500).json({
            mensaje: 'Error al verificar la sesion'
        });
    }
};

// TITULO 3 CERRAR SESION

// elimina la cookie JWT para finalizar la sesion en el navegador
const cerrarSesion = (req, res) => {

    // utiliza los mismos atributos de la cookie original, sin maxAge
    // path '/' corresponde a la ruta predeterminada de res.cookie
    res.clearCookie('sesion', {
        httpOnly: OPCIONES_COOKIE_SESION.httpOnly,
        secure: OPCIONES_COOKIE_SESION.secure,
        sameSite: OPCIONES_COOKIE_SESION.sameSite,
        path: '/'
    });

    return res.status(200).json({
        mensaje: 'Sesion cerrada correctamente'
    });
};

// exporta el controlador
module.exports = {
    iniciarSesion,
    verificarSesion,
    cerrarSesion
};