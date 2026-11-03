// ==============================
// TITULO 1 COOKIE DE SESION JWT
// ==============================

const OPCIONES_COOKIE_SESION = {
    // evita que JavaScript del navegador lea la cookie
    httpOnly: true,

    // en local permite HTTP; en produccion requiere HTTPS
    // configurar NODE_ENV=production cuando se publique TresStock
    secure: process.env.NODE_ENV === 'production',

    // protege parcialmente contra CSRF sin romper el frontend actual
    sameSite: 'lax',

    // dura 8 horas, igual que el JWT
    maxAge: 8 * 60 * 60 * 1000
};

module.exports = { OPCIONES_COOKIE_SESION };
