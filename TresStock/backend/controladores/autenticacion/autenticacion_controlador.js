// importa el servicio de autenticacion
const autenticacionServicio = require('../../servicios/autenticacion/autenticacion_servicio');

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

// exporta el controlador
module.exports = {
    iniciarSesion
};