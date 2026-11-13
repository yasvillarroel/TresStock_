const MENSAJE_POLITICA_CONTRASENA = 'La contraseña debe tener entre 8 y 40 caracteres, una letra mayúscula y un número.';

const contrasenaCumplePolitica = password =>
    typeof password === 'string' &&
    password.length >= 8 &&
    password.length <= 40 &&
    /\p{Lu}/u.test(password) &&
    /\d/.test(password);

module.exports = {contrasenaCumplePolitica, MENSAJE_POLITICA_CONTRASENA};
