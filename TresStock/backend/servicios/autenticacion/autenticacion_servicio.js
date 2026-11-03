// importa bcrypt
const bcrypt = require('bcrypt');

// importa el pool de conexiones
const pool = require('../../configuracion/base_datos');

const usuariosServicio = require('../usuarios/usuarios_servicio');

// =====================
// TITULO 1 INICIAR SESION
// =====================

const iniciarSesion = async (email, password) => {

    // busca la cuenta por correo
    const resultado = await pool.query(
        `SELECT
            id_usuario,
            nombre,
            email,
            password_hash,
            id_rol,
            activo,
            fecha_creacion
        FROM base_datos.usuarios
        WHERE email = $1`,
        [email]
    );

    const usuario = resultado.rows[0];

    // rechaza las cuentas inexistentes e inactivas
    if (!usuario || !usuario.activo) {
        return null;
    }

    const contrasenaCorrecta = await bcrypt.compare(password, usuario.password_hash);

    if (!contrasenaCorrecta) {
        return null;
    }

    // nunca devuelve el hash de contrasena al navegador
    delete usuario.password_hash;

    return usuario;
};

// ===================================
// TITULO 2 CONSULTAR USUARIO DE SESION
// ===================================

// obtiene la cuenta y su rol actual directamente desde PostgreSQL
// solo devuelve cuentas activas; el JWT antiguo no conserva permisos anteriores
const obtenerUsuarioPorId = async (idUsuario) => {

    const resultado = await pool.query(
        `SELECT
            u.id_usuario,
            u.nombre,
            u.email,
            u.id_rol,
            r.nombre AS nombre_rol
        FROM base_datos.usuarios u
        JOIN base_datos.roles r ON r.id_rol = u.id_rol
        WHERE u.id_usuario = $1
          AND u.activo = TRUE`,
        [idUsuario]
    );

    const usuario = resultado.rows[0];

    if (!usuario) {
        return null;
    }

    return {
        id: usuario.id_usuario,
        rol: usuario.id_rol,
        nombre_rol: usuario.nombre_rol,
        nombre: usuario.nombre,
        email: usuario.email
    };
};

const registrarCuenta = async (nombre, email, password) => {
    const idRolUsuario = await usuariosServicio.obtenerIdRol('Usuario');

    if (!idRolUsuario) {
        throw new Error('No se encontró el rol Usuario.');
    }

    return usuariosServicio.crearUsuario(nombre, email, password, idRolUsuario);
};

module.exports = { 
    iniciarSesion,
    obtenerUsuarioPorId,
    registrarCuenta
};
