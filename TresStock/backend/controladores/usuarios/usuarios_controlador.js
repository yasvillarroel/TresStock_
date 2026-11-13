// importa el servicio de usuarios
const usuariosServicio = require('../../servicios/usuarios/usuarios_servicio');
const {contrasenaCumplePolitica, MENSAJE_POLITICA_CONTRASENA} = require('../../utilidades/validacion_contrasena');
const EXPRESION_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// TITULO 1 VALIDACIONES Y RESPUESTAS

function errorSolicitud(mensaje, codigo = 400) {
    const error = new Error(mensaje);
    error.statusCode = codigo;
    return error;
}

function devolverError(res, error, contexto) {
    console.error(contexto + ':', error);
    if (error.code === '23505') {
        return res.status(409).json({ mensaje: 'Ya existe un usuario con ese correo electrónico.' });
    }
    return res.status(error.statusCode || 500).json({
        mensaje: error.statusCode ? error.message : 'Ocurrió un error al procesar el usuario.'
    });
}

function validarCamposUsuario(body, nuevo = false) {
    const nombre = String(body.nombre ?? '').trim();
    const email = String(body.email ?? '').trim().toLowerCase();
    const password = body.password === undefined ? '' : String(body.password);
    const confirmar = body.confirmar_password === undefined ? '' : String(body.confirmar_password);
    const rol = typeof body.rol === 'string' ? body.rol.trim() : null;
    const id_rol = body.id_rol;
    if (nombre.length < 2 || nombre.length > 50) throw errorSolicitud('El nombre debe tener entre 2 y 50 caracteres.');
    if (email.length > 90 || !EXPRESION_EMAIL.test(email)) throw errorSolicitud('El correo electrónico no es válido.');
    if (nuevo || password || confirmar) {
        if (!contrasenaCumplePolitica(password)) {
            throw errorSolicitud(MENSAJE_POLITICA_CONTRASENA);
        }
        if (body.confirmar_password !== undefined && password !== confirmar) {
            throw errorSolicitud('Las contraseñas no coinciden.');
        }
    }
    if (rol === null && id_rol === undefined) throw errorSolicitud('Selecciona un rol válido.');
    return { nombre, email, password, rol, id_rol };
}

async function resolverIdRol(datos) {
    if (datos.rol !== null) {
        if (!['Administrador', 'Usuario'].includes(datos.rol)) {
            throw errorSolicitud('El rol seleccionado no es válido.');
        }
        const id = await usuariosServicio.obtenerIdRol(datos.rol);
        if (!id) throw errorSolicitud('El rol seleccionado no existe.');
        return id;
    }
    const numero = Number(datos.id_rol);
    if (!Number.isSafeInteger(numero) || numero <= 0) throw errorSolicitud('El rol no es válido.');
    // solo permite los roles de TresStock y no confía ciegamente en el número
    const roles = await Promise.all([
        usuariosServicio.obtenerIdRol('Administrador'),
        usuariosServicio.obtenerIdRol('Usuario')
    ]);
    if (!roles.includes(numero)) throw errorSolicitud('El rol seleccionado no es válido.');
    return numero;
}

// identifica la cuenta conectada usando req.usuario.id del middleware.
// se conservan otras formas para compatibilidad con futuros cambios.
function obtenerIdUsuarioSesion(req) {
    const candidato = req.usuario?.id ?? req.usuario?.id_usuario ??
        req.user?.id_usuario ?? req.session?.usuario?.id_usuario ?? req.session?.id_usuario;
    const id = Number(candidato);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
}

// TITULO 2 CREAR USUARIO

const crearUsuario = async (req, res) => {
    try {
        const datos = validarCamposUsuario(req.body, true);
        const idRol = await resolverIdRol(datos);
        const usuario = await usuariosServicio.crearUsuario(
            datos.nombre, datos.email, datos.password, idRol
        );
        res.status(201).json(usuario);
    } catch (error) {
        devolverError(res, error, 'Error al crear usuario');
    }
};

// TITULO 3 CONSULTAR USUARIOS

const obtenerUsuarios = async (req, res) => {
    try { res.json(await usuariosServicio.obtenerUsuarios()); }
    catch (error) { devolverError(res, error, 'Error al obtener usuarios'); }
};

const obtenerUsuario = async (req, res) => {
    try {
        const usuario = await usuariosServicio.obtenerUsuario(req.params.id);
        if (!usuario) return res.status(404).json({ mensaje: 'El usuario no existe.' });
        res.json(usuario);
    } catch (error) { devolverError(res, error, 'Error al obtener usuario'); }
};

// TITULO 4 ACTUALIZAR USUARIO

const actualizarUsuario = async (req, res) => {
    try {
        const datos = validarCamposUsuario(req.body);
        const idRol = await resolverIdRol(datos);
        const usuario = await usuariosServicio.actualizarUsuario(
            req.params.id, datos.nombre, datos.email, datos.password, idRol,
            obtenerIdUsuarioSesion(req)
        );
        res.json(usuario);
    } catch (error) { devolverError(res, error, 'Error al actualizar usuario'); }
};

// TITULO 5 ACTIVAR O DESACTIVAR USUARIO

const cambiarEstadoUsuario = async (req, res) => {
    try {
        if (typeof req.body.activo !== 'boolean') {
            throw errorSolicitud('El estado debe ser verdadero o falso.');
        }
        const usuario = await usuariosServicio.cambiarEstadoUsuario(
            req.params.id, req.body.activo, obtenerIdUsuarioSesion(req)
        );
        res.json(usuario);
    } catch (error) { devolverError(res, error, 'Error al cambiar estado'); }
};

// TITULO 6 FUNCIONES EXISTENTES DE COMPATIBILIDAD

const cambiarContrasena = async (req, res) => {
    try {
        const password = String(req.body.password ?? '');
        if (!contrasenaCumplePolitica(password)) throw errorSolicitud(MENSAJE_POLITICA_CONTRASENA);
        const usuario = await usuariosServicio.cambiarContrasena(req.params.id, password);
        if (!usuario) return res.status(404).json({ mensaje: 'El usuario no existe.' });
        res.json(usuario);
    } catch (error) { devolverError(res, error, 'Error al cambiar contraseña'); }
};

const cambiarRolUsuario = async (req, res) => {
    try {
        const idRol = await resolverIdRol({ rol: null, id_rol: req.body.id_rol });
        const usuario = await usuariosServicio.cambiarRolUsuario(
            req.params.id, idRol, obtenerIdUsuarioSesion(req)
        );
        res.json(usuario);
    } catch (error) { devolverError(res, error, 'Error al cambiar rol'); }
};

// TITULO 7 ELIMINACION FISICA DESHABILITADA

const eliminarUsuario = (req, res) => {
    res.status(405).json({ mensaje: 'Los usuarios no se eliminan. Utiliza activar o desactivar.' });
};

module.exports = {
    crearUsuario, obtenerUsuarios, obtenerUsuario, actualizarUsuario,
    eliminarUsuario, cambiarContrasena, cambiarEstadoUsuario, cambiarRolUsuario
};
