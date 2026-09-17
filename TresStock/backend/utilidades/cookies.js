const OPCIONES_COOKIE_SESION = {
    httpOnly: true,             // JS del navegador no puede leerla (mitiga XSS)
    secure: false, // solo HTTPS en producción
    sameSite: 'lax',         // mitiga CSRF en la mayoría de los casos  //deberia ser 'strict'
    maxAge: 8 * 60 * 60 * 1000  // 8 horas, igual que expiresIn del JWT
};

module.exports = { OPCIONES_COOKIE_SESION };