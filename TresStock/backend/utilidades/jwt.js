const jwt = require('jsonwebtoken');

// firma un token con los datos del usuario (id y rol, nunca la contraseña)
function firmarToken(payload) {

    return jwt.sign(payload, process.env.JWT_SECRETO, { expiresIn: '8h' });

}

// verifica el token; lanza error si es inválido o expiró
function verificarToken(token) {

    return jwt.verify(token, process.env.JWT_SECRETO);

}

module.exports = { firmarToken, verificarToken };