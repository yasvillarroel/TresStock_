// importa el pool de conexiones con PostgreSQL
const pool = require('../../configuracion/base_datos');

// importa bcrypt para encriptar contraseñas
const bcrypt = require('bcrypt');

// =======================
// FUNCIONES DE USUARIO =
// =======================

    // FUNCION 1 CREAR USUARIO
    const crearUsuario = async (nombre, email, password, id_rol) => {

        // encripta la contraseña
        const password_hash = await bcrypt.hash(password, 10);

        // ejecuta la consulta para crear el usuario
        const resultado = await pool.query(
            `INSERT INTO base_datos.usuarios
            (nombre, email, password_hash, id_rol)
            VALUES ($1, $2, $3, $4)
            RETURNING id_usuario, nombre, email, id_rol, activo, fecha_creacion`,
            [nombre, email, password_hash, id_rol]
        );

        // devuelve el usuario creado
        return resultado.rows[0];
    };

    //FUNCION 2 OBTENER TODOS LOS USUARIOS
    const obtenerUsuarios = async () => {

        // ejecuta la consulta para obtener los usuarios
        const resultado = await pool.query(
            `SELECT
                id_usuario,
                nombre,
                email,
                id_rol,
                activo,
                fecha_creacion
            FROM base_datos.usuarios
            ORDER BY id_usuario`
        );

        // devuelve los usuarios encontrados
        return resultado.rows;
    };

    //FUNCION 3 OBTENER USUARIO POR ID
    const obtenerUsuario = async (id) => {

        // ejecuta la consulta para obtener el usuario
        const resultado = await pool.query(
            `SELECT
                id_usuario,
                nombre,
                email,
                id_rol,
                activo,
                fecha_creacion
            FROM base_datos.usuarios
            WHERE id_usuario = $1`,
            [id]
        );

        // devuelve el usuario encontrado
        return resultado.rows[0];
    };

    // FUNCION 4 ACTUALIZAR USUARIO
    const actualizarUsuario = async (
        id,
        nombre,
        email,
        password,
        id_rol,
        activo
    ) => {

        // revisa si se envio una nueva contraseña
        if (password) {

            // encripta la nueva contraseña
            const password_hash = await bcrypt.hash(password, 10);

            // actualiza todos los datos incluyendo la contraseña
            const resultado = await pool.query(
                `UPDATE base_datos.usuarios
                SET
                    nombre = $1,
                    email = $2,
                    password_hash = $3,
                    id_rol = $4,
                    activo = $5
                WHERE id_usuario = $6
                RETURNING id_usuario, nombre, email, id_rol, activo, fecha_creacion`,
                [nombre, email, password_hash, id_rol, activo, id]
            );

            // devuelve el usuario actualizado
            return resultado.rows[0];
        }

        // actualiza los datos sin modificar la contraseña
        const resultado = await pool.query(
            `UPDATE base_datos.usuarios
            SET
                nombre = $1,
                email = $2,
                id_rol = $3,
                activo = $4
            WHERE id_usuario = $5
            RETURNING id_usuario, nombre, email, id_rol, activo, fecha_creacion`,
            [nombre, email, id_rol, activo, id]
        );

        // devuelve el usuario actualizado
        return resultado.rows[0];
    };

    //FUNCION 5 ELIMINAR USUARIO POR ID
    const eliminarUsuario = async (id) => {

        // elimina el usuario de la base de datos
        const resultado = await pool.query(
            `DELETE FROM base_datos.usuarios
            WHERE id_usuario = $1
            RETURNING id_usuario, nombre, email, id_rol, activo`,
            [id]
        );

        // devuelve el usuario eliminado
        return resultado.rows[0];
    };

    // FUNCION 6 CAMBIAR CONTRASENA
    const cambiarContrasena = async (id, password) => {

        // encripta la nueva contrasena
        const password_hash = await bcrypt.hash(password, 10);

        // actualiza la contrasena del usuario
        const resultado = await pool.query(
            `UPDATE base_datos.usuarios
            SET password_hash = $1
            WHERE id_usuario = $2
            RETURNING id_usuario, nombre, email, id_rol, activo`,
            [password_hash, id]
        );

        // devuelve el usuario actualizado
        return resultado.rows[0];
    };

    // FUNCION 7 CAMBIAR ESTADO DEL USUARIO
    const cambiarEstadoUsuario = async (id, activo) => {

        // actualiza el estado del usuario
        const resultado = await pool.query(
            `UPDATE base_datos.usuarios
            SET activo = $1
            WHERE id_usuario = $2
            RETURNING id_usuario, nombre, email, id_rol, activo`,
            [activo, id]
        );

        // devuelve el usuario actualizado
        return resultado.rows[0];
    };

    // FUNCION 8 CAMBIAR ROL DEL USUARIO
    const cambiarRolUsuario = async (id, id_rol) => {

        // actualiza el rol del usuario
        const resultado = await pool.query(
            `UPDATE base_datos.usuarios
            SET id_rol = $1
            WHERE id_usuario = $2
            RETURNING id_usuario, nombre, email, id_rol, activo`,
            [id_rol, id]
        );

        // devuelve el usuario actualizado
        return resultado.rows[0];
    };

// EXPORTAR FUNCIONES
module.exports = {
    crearUsuario,
    obtenerUsuarios,
    obtenerUsuario,
    actualizarUsuario,
    eliminarUsuario,
    cambiarContrasena,
    cambiarEstadoUsuario,
    cambiarRolUsuario
};