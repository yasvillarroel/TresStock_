const { doubleCsrf } = require('csrf-csrf');

const {
    generateCsrfToken,
    doubleCsrfProtection
} = doubleCsrf({
    getSecret: () => {
        const secreto = process.env.CSRF_SECRET;

        if (!secreto) {
            throw new Error('Falta configurar CSRF_SECRET en el archivo .env');
        }

        return secreto;
    },
    getSessionIdentifier: (req) => req.csrfSessionIdentifier || req.cookies?.sesion || 'sesion-anonima',
    cookieName: 'csrf-token',
    cookieOptions: {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/'
    },
    size: 64,
    ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
    getCsrfTokenFromRequest: (req) => req.headers['x-csrf-token']
});

module.exports = {
    generateCsrfToken, 
    doubleCsrfProtection
};