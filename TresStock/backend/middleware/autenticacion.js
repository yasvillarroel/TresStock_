// importa la utilidad para verificar el token JWT
const { verificarToken } = require('../utilidades/jwt');

// importa el servicio que consulta la cuenta vigente en PostgreSQL
const autenticacionServicio = require('../servicios/autenticacion/autenticacion_servicio');

// ==============================
// TITULO 1 VERIFICAR AUTENTICACION
// ==============================

// comprueba la cookie, valida el JWT y confirma que el usuario siga activo
async function autenticacion(req, res, next) {

    const token = req.cookies?.sesion;

    if (!token) {
        return res.status(401).json({ mensaje: 'No hay sesión activa' });
    }

    let datosToken;

    // valida la firma y la fecha de expiracion del JWT
    try {
        datosToken = verificarToken(token);
    } catch (error) {
        return res.status(401).json({ mensaje: 'Sesión inválida o expirada' });
    }

    const idUsuario = Number(datosToken?.id);

    if (!Number.isSafeInteger(idUsuario) || idUsuario <= 0) {
        return res.status(401).json({ mensaje: 'Sesión inválida' });
    }

    try {

        // consulta el estado y rol vigentes; no confia en el rol guardado en el JWT
        const usuario = await autenticacionServicio.obtenerUsuarioPorId(idUsuario);

        if (!usuario) {
            return res.status(401).json({ mensaje: 'La cuenta está desactivada o ya no existe' });
        }

        // entrega identidad y permisos actualizados a los controladores
        req.usuario = usuario;
        return next();

    } catch (error) {
        console.error('Error al verificar la sesión en PostgreSQL:', error);
        return res.status(500).json({ mensaje: 'No fue posible verificar la sesión' });
    }
}

// ===================================
// TITULO 2 AUTORIZAR ADMINISTRADORES
// ===================================

// impide que usuarios sin rol Administrador utilicen Gestión de usuarios
function soloAdministrador(req, res, next) {

    const nombreRol = String(req.usuario?.nombre_rol || '').trim().toLowerCase();

    if (nombreRol !== 'administrador') {
        return res.status(403).json({ mensaje: 'No tienes permisos para administrar usuarios' });
    }

    return next();
}

module.exports = { autenticacion, soloAdministrador };
