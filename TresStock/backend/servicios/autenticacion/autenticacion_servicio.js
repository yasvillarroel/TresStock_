// importa bcrypt
const bcrypt = require('bcrypt');

// importa el pool de conexiones
const pool = require('../../configuracion/base_datos');

// FUNCION 1 INICIAR SESION
const iniciarSesion = async (email, password) => {

    // busca el usuario por correo
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

    // obtiene el usuario encontrado
    const usuario = resultado.rows[0];

    // comprueba si existe
    if (!usuario) {
        return null;
    }

    // comprueba si el usuario esta activo
    if (!usuario.activo) {
        return null;
    }

    // compara la contrasena con el hash
    const contrasenaCorrecta = await bcrypt.compare(
        password,
        usuario.password_hash
    );

    // comprueba la contrasena
    if (!contrasenaCorrecta) {
        return null;
    }

    // elimina la contrasena antes de devolver los datos
    delete usuario.password_hash;

    // devuelve los datos del usuario
    return usuario;
};



// FUNCION 2 OBTENER USUARIO AUTENTICADO
// busca los datos publicos del usuario usando el ID del JWT ya validado
const obtenerUsuarioPorId = async (idUsuario) => {

    const resultado = await pool.query(
        `SELECT
            id_usuario,
            nombre,
            email,
            id_rol
         FROM base_datos.usuarios
         WHERE id_usuario = $1
           AND activo = TRUE`,
        [idUsuario]
    );

    const usuario = resultado.rows[0];

    // si ya no existe o fue desactivado, la sesion no debe continuar
    if (!usuario) {
        return null;
    }

    // devuelve solamente los datos necesarios para la cabecera
    return {
        id: usuario.id_usuario,
        rol: usuario.id_rol,
        nombre: usuario.nombre,
        email: usuario.email
    };
};

// exporta el servicio
module.exports = {
    iniciarSesion,
    obtenerUsuarioPorId
};