const { createHmac, timingSafeEqual } = require('node:crypto');

// Vincula cada sesión a la contraseña vigente sin incluir su hash en el JWT.
function crearVersionSesion(passwordHash) {
    const secreto = process.env.JWT_SECRETO;
    if (!secreto) throw new Error('Falta configurar JWT_SECRETO.');
    return createHmac('sha256', secreto).update(passwordHash).digest('hex');
}

// Cambiar la contraseña invalida los JWT anteriores, incluso dentro del mismo segundo.
function versionSesionValida(passwordHash, version) {
    if (typeof version !== 'string' || !/^[a-f0-9]{64}$/.test(version)) return false;
    return timingSafeEqual(Buffer.from(crearVersionSesion(passwordHash), 'hex'), Buffer.from(version, 'hex'));
}

module.exports = { crearVersionSesion, versionSesionValida };
