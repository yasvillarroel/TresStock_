// importa el pool de conexiones con PostgreSQL
const pool = require('../../configuracion/base_datos');
const bcrypt = require('bcrypt');
const {contrasenaCumplePolitica, MENSAJE_POLITICA_CONTRASENA} = require('../../utilidades/validacion_contrasena');

// TITULO 1 FUNCIONES AUXILIARES

function errorUsuario(mensaje, statusCode = 400) {
    const error = new Error(mensaje);
    error.statusCode = statusCode;
    return error;
}

const CAMPOS_USUARIO = `u.id_usuario, u.nombre, u.email, u.id_rol,
    r.nombre AS rol, u.activo, u.fecha_creacion`;

// evita cambios simultáneos que puedan dejar sin administradores al sistema
async function bloquearCambiosAdministradores(cliente) {
    await cliente.query('SELECT pg_advisory_xact_lock(6032026)');
}

async function comprobarUltimoAdministrador(cliente, usuario, nuevoRol, nuevoActivo) {
    const resultado = await cliente.query(
        `SELECT COUNT(*)::integer AS cantidad
         FROM base_datos.usuarios u
         JOIN base_datos.roles r ON r.id_rol = u.id_rol
         WHERE u.activo = TRUE AND LOWER(r.nombre) = 'administrador'`
    );
    const esAdministrador = String(usuario.rol || '').toLowerCase() === 'administrador';
    const continuaraAdministrador = String(nuevoRol || '').toLowerCase() === 'administrador';
    if (usuario.activo && esAdministrador && (!nuevoActivo || !continuaraAdministrador) &&
        resultado.rows[0].cantidad <= 1) {
        throw errorUsuario('No se puede desactivar ni quitar el rol al último administrador activo.', 409);
    }
}

function validarIdUsuario(id) {
    const numero = Number(id);
    if (!Number.isSafeInteger(numero) || numero <= 0) throw errorUsuario('Identificador de usuario no válido.');
    return numero;
}

async function consultarUsuarioParaCambio(cliente, id) {
    const resultado = await cliente.query(
        `SELECT ${CAMPOS_USUARIO} FROM base_datos.usuarios u
         JOIN base_datos.roles r ON r.id_rol = u.id_rol
         WHERE u.id_usuario = $1 FOR UPDATE OF u`,
        [validarIdUsuario(id)]
    );
    if (resultado.rowCount === 0) throw errorUsuario('El usuario no existe.', 404);
    return resultado.rows[0];
}

async function consultarRol(cliente, idRol) {
    const resultado = await cliente.query(
        'SELECT id_rol, nombre FROM base_datos.roles WHERE id_rol = $1', [idRol]
    );
    if (!resultado.rowCount) throw errorUsuario('El rol seleccionado no existe.');
    return resultado.rows[0];
}

// TITULO 2 CREAR Y CONSULTAR USUARIOS

const crearUsuario = async (nombre, email, password, id_rol) => {
    if (!contrasenaCumplePolitica(password)) throw errorUsuario(MENSAJE_POLITICA_CONTRASENA);
    email = String(email ?? '').trim().toLowerCase();
    const password_hash = await bcrypt.hash(password, 10);
    const resultado = await pool.query(
        `INSERT INTO base_datos.usuarios (nombre, email, password_hash, id_rol)
         VALUES ($1, $2, $3, $4)
         RETURNING id_usuario, nombre, email, id_rol, activo, fecha_creacion`,
        [nombre, email, password_hash, id_rol]
    );
    return resultado.rows[0];
};

const obtenerUsuarios = async () => {
    const resultado = await pool.query(
        `SELECT ${CAMPOS_USUARIO}
         FROM base_datos.usuarios u
         JOIN base_datos.roles r ON r.id_rol = u.id_rol
         ORDER BY u.id_usuario`
    );
    return resultado.rows;
};

const obtenerUsuario = async id => {
    const resultado = await pool.query(
        `SELECT ${CAMPOS_USUARIO}
         FROM base_datos.usuarios u
         JOIN base_datos.roles r ON r.id_rol = u.id_rol
         WHERE u.id_usuario = $1`,
        [validarIdUsuario(id)]
    );
    return resultado.rows[0] || null;
};

const obtenerIdRol = async nombre => {
    const resultado = await pool.query(
        `SELECT id_rol FROM base_datos.roles WHERE LOWER(nombre) = LOWER($1)`,
        [nombre]
    );
    return resultado.rows[0]?.id_rol;
};

// TITULO 3 EDITAR USUARIOS

// el estado activo no se edita aquí; se cambia exclusivamente mediante /estado
const actualizarUsuario = async (id, nombre, email, password, idRol, idSesion = null) => {
    if (password && !contrasenaCumplePolitica(password)) throw errorUsuario(MENSAJE_POLITICA_CONTRASENA);
    email = String(email ?? '').trim().toLowerCase();
    const cliente = await pool.connect();
    try {
        await cliente.query('BEGIN');
        await bloquearCambiosAdministradores(cliente);
        const usuario = await consultarUsuarioParaCambio(cliente, id);
        const rol = await consultarRol(cliente, idRol);
        if (idSesion !== null && Number(idSesion) === Number(id) &&
            String(usuario.rol).toLowerCase() === 'administrador' &&
            String(rol.nombre).toLowerCase() !== 'administrador') {
            throw errorUsuario('No puedes quitarte el rol de administrador a ti mismo.', 409);
        }
        await comprobarUltimoAdministrador(cliente, usuario, rol.nombre, usuario.activo);
        let resultado;
        if (password) {
            const hash = await bcrypt.hash(password, 10);
            resultado = await cliente.query(
                `UPDATE base_datos.usuarios SET nombre = $1, email = $2, password_hash = $3, id_rol = $4
                 WHERE id_usuario = $5
                 RETURNING id_usuario, nombre, email, id_rol, activo, fecha_creacion`,
                [nombre, email, hash, idRol, id]
            );
        } else {
            resultado = await cliente.query(
                `UPDATE base_datos.usuarios SET nombre = $1, email = $2, id_rol = $3
                 WHERE id_usuario = $4
                 RETURNING id_usuario, nombre, email, id_rol, activo, fecha_creacion`,
                [nombre, email, idRol, id]
            );
        }
        await cliente.query('COMMIT');
        return resultado.rows[0];
    } catch (error) {
        await cliente.query('ROLLBACK');
        throw error;
    } finally {
        cliente.release();
    }
};

// TITULO 4 CAMBIAR ESTADO DEL USUARIO

const cambiarEstadoUsuario = async (id, activo, idSesion = null) => {
    if (typeof activo !== 'boolean') throw errorUsuario('El estado debe ser verdadero o falso.');
    const cliente = await pool.connect();
    try {
        await cliente.query('BEGIN');
        await bloquearCambiosAdministradores(cliente);
        const usuario = await consultarUsuarioParaCambio(cliente, id);
        if (!activo && idSesion !== null && Number(idSesion) === Number(id)) {
            throw errorUsuario('No puedes desactivar tu propia cuenta.', 409);
        }
        await comprobarUltimoAdministrador(cliente, usuario, usuario.rol, activo);
        const resultado = await cliente.query(
            `UPDATE base_datos.usuarios SET activo = $1 WHERE id_usuario = $2
             RETURNING id_usuario, nombre, email, id_rol, activo, fecha_creacion`,
            [activo, id]
        );
        await cliente.query('COMMIT');
        return resultado.rows[0];
    } catch (error) {
        await cliente.query('ROLLBACK');
        throw error;
    } finally {
        cliente.release();
    }
};

// TITULO 5 CAMBIO DIRECTO DE CONTRASEÑA Y ROL (COMPATIBILIDAD)

const cambiarContrasena = async (id, password) => {
    if (!contrasenaCumplePolitica(password)) throw errorUsuario(MENSAJE_POLITICA_CONTRASENA);
    const hash = await bcrypt.hash(password, 10);
    const resultado = await pool.query(
        `UPDATE base_datos.usuarios SET password_hash = $1 WHERE id_usuario = $2
         RETURNING id_usuario, nombre, email, id_rol, activo`,
        [hash, validarIdUsuario(id)]
    );
    return resultado.rows[0] || null;
};

const cambiarRolUsuario = async (id, idRol, idSesion = null) => {
    const cliente = await pool.connect();
    try {
        await cliente.query('BEGIN');
        await bloquearCambiosAdministradores(cliente);
        const usuario = await consultarUsuarioParaCambio(cliente, id);
        const rol = await consultarRol(cliente, idRol);
        if (idSesion !== null && Number(idSesion) === Number(id) &&
            String(usuario.rol).toLowerCase() === 'administrador' &&
            String(rol.nombre).toLowerCase() !== 'administrador') {
            throw errorUsuario('No puedes quitarte el rol de administrador a ti mismo.', 409);
        }
        await comprobarUltimoAdministrador(cliente, usuario, rol.nombre, usuario.activo);
        const resultado = await cliente.query(
            `UPDATE base_datos.usuarios SET id_rol = $1 WHERE id_usuario = $2
             RETURNING id_usuario, nombre, email, id_rol, activo`, [idRol, id]
        );
        await cliente.query('COMMIT');
        return resultado.rows[0];
    } catch (error) {
        await cliente.query('ROLLBACK');
        throw error;
    } finally {
        cliente.release();
    }
};

module.exports = {
    crearUsuario, obtenerUsuarios, obtenerUsuario, obtenerIdRol,
    actualizarUsuario, cambiarEstadoUsuario, cambiarContrasena, cambiarRolUsuario
};
