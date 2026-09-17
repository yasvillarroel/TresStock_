const { verificarToken } = require('../utilidades/jwt');

function autenticacion(req, res, next) {

    const token = req.cookies.sesion;

    if (!token) {
        return res.status(401).json({
            mensaje: 'No hay sesión activa'
        });
    }

    try {

        // deja los datos del usuario disponibles para el resto de la cadena
        req.usuario = verificarToken(token);

        next();

    } catch (error) {

        return res.status(401).json({
            mensaje: 'Sesión inválida o expirada'
        });

    }
}

module.exports = { autenticacion };