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


const registrarCuenta = async (req, res) => {
    try {
        const nombre = String(req.body.nombre ?? '').trim();
        const email = String(req.body.email ?? '').trim().toLowerCase();
        const password = String(req.body.password ?? '');
        const confirmarPassword = String(req.body.confirmar_password ?? '');

        if (nombre.length < 2 || nombre.length > 100) {
            return res.status(400).json({ mensaje: 'El nombre debe tener entre 2 y 100 caracteres.' });
        }

        if (email.length > 150 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ mensaje: 'El correo electrónico no es válido.' });
        }

        if (password.length < 8) {
            return res.status(400).json({ mensaje: 'La contraseña debe tener al menos 8 caracteres.' });
        }

        if (password !== confirmarPassword) {
            return res.status(400).json({ mensaje: 'Las contraseñas no coinciden.' });
        }

        const usuario = await autenticacionServicio.registrarCuenta(nombre, email, password);
        return res.status(201).json({ mensaje: 'Cuenta creada correctamente.', usuario });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ mensaje: 'Ya existe una cuenta con ese correo electrónico.' });
        }

        console.error('Error al registrar cuenta:', error);
        return res.status(500).json({ mensaje: 'No se pudo crear la cuenta.' });
    }
};

// exporta el controlador
module.exports = {
    iniciarSesion,
    verificarSesion,
    cerrarSesion,
    registrarCuenta
};