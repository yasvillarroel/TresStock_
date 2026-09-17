const { doubleCsrf } = require('csrf-csrf');

const {
    generateToken,
    doubleCsrfProtection
} = doubleCsrf({
    getSecret: () => process.env.CSRF_SECRET, // string secreto en tu .env
    cookieName: 'csrf-token',
    cookieOptions: {
        httpOnly: false, // el frontend necesita leerlo para mandarlo en el header
        sameSite: 'lax', // igual que cookie de sesion
        secure: true       // requiere https en dev
    },
    size: 64,
    getTokenFromRequest: (req) => req.headers['x-csrf-token']
});

module.exports = { generateToken, doubleCsrfProtection };