const bcrypt = require('bcrypt');
const pool = require('../../configuracion/base_datos');
const nodemailer = require('nodemailer');
const { randomInt, createHmac, timingSafeEqual } = require('node:crypto');

const iniciarSesion = async (email, password) => {
    const resultado = await pool.query(
        `SELECT id_usuario, nombre, email, password_hash, id_rol, activo, fecha_creacion
         FROM base_datos.usuarios
         WHERE email = $1`,
        [email]
    );

    const usuario = resultado.rows[0];

    if (!usuario || !usuario.activo) return null;

    const contrasenaCorrecta = await bcrypt.compare(password, usuario.password_hash);
    if (!contrasenaCorrecta) return null;

    delete usuario.password_hash;
    return usuario;
};

const obtenerUsuarioPorId = async (idUsuario) => {
    const resultado = await pool.query(
        `SELECT u.id_usuario, u.nombre, u.email, u.id_rol, r.nombre AS nombre_rol
         FROM base_datos.usuarios u
         JOIN base_datos.roles r ON r.id_rol = u.id_rol
         WHERE u.id_usuario = $1 AND u.activo = TRUE`,
        [idUsuario]
    );

    const usuario = resultado.rows[0];
    if (!usuario) return null;

    return {
        id: usuario.id_usuario,
        rol: usuario.id_rol,
        nombre_rol: usuario.nombre_rol,
        nombre: usuario.nombre,
        email: usuario.email
    };
};

const crearErrorRegistro = (mensaje, statusCode) => {
    const error = new Error(mensaje);
    error.statusCode = statusCode;
    return error;
};

const minutosRestantes = (hasta) =>
    Math.max(1, Math.ceil((new Date(hasta).getTime() - Date.now()) / 60000));

const mensajeBloqueo = (motivo, hasta) => {
    const minutos = minutosRestantes(hasta);
    const unidad = minutos === 1 ? 'minuto' : 'minutos';
    return `${motivo} Intenta nuevamente en ${minutos} ${unidad}.`;
};

const hashearCodigoRegistro = (codigo) => {
    const secreto = process.env.REGISTRO_CODE_SECRET;

    if (!secreto || secreto.startsWith('pon-aqui')) {
        throw crearErrorRegistro('Configura REGISTRO_CODE_SECRET en el archivo .env.', 500);
    }

    return createHmac('sha256', secreto).update(codigo).digest();
};

const solicitarCodigoRegistro = async (nombre, email, password, ip) => {
    await comprobarBloqueoIp(ip);
    await comprobarBloqueoReenvioIp(ip);

    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.SMTP_FROM) {
        throw crearErrorRegistro('Falta configurar el envío SMTP en el archivo .env.', 503);
    }

    const cuenta = await pool.query(
        'SELECT 1 FROM base_datos.usuarios WHERE LOWER(email) = LOWER($1)',
        [email]
    );

    if (cuenta.rowCount) {
        throw crearErrorRegistro('Ya existe una cuenta con ese correo electrónico.', 409);
    }

    const pendienteActual = await pool.query(
        'SELECT creado_en FROM base_datos.registros_pendientes WHERE email = $1',
        [email]
    );

    if (pendienteActual.rowCount) {
        const transcurrido = Date.now() - new Date(pendienteActual.rows[0].creado_en).getTime();

        if (transcurrido < 60000) {
            throw crearErrorRegistro('Espera un minuto antes de reenviar el código.', 429);
        }

        await registrarReenvioIp(ip);
    }

    const codigo = String(randomInt(100000, 1000000));
    const passwordHash = await bcrypt.hash(password, 10);
    const codigoHash = hashearCodigoRegistro(codigo).toString('hex');

    const guardado = await pool.query(
        `INSERT INTO base_datos.registros_pendientes
            (email, nombre, password_hash, codigo_hash, vence_en, creado_en, intentos)
         VALUES ($1, $2, $3, $4, NOW() + INTERVAL '10 minutes', NOW(), 0)
         ON CONFLICT (email) DO UPDATE SET
            nombre = EXCLUDED.nombre,
            password_hash = EXCLUDED.password_hash,
            codigo_hash = EXCLUDED.codigo_hash,
            vence_en = EXCLUDED.vence_en,
            creado_en = NOW(),
            intentos = 0
         WHERE base_datos.registros_pendientes.creado_en < NOW() - INTERVAL '60 seconds'
         RETURNING email`,
        [email, nombre, passwordHash, codigoHash]
    );

    if (!guardado.rowCount) {
        throw crearErrorRegistro('Espera un minuto antes de solicitar otro código.', 429);
    }

    const transporte = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });

    try {
        await transporte.sendMail({
            from: process.env.SMTP_FROM,
            to: email,
            subject: 'Código para crear tu cuenta en TresStock',
            text: `Tu código de registro es ${codigo}. Vence en 10 minutos.`
        });
    } catch (error) {
        await pool.query('DELETE FROM base_datos.registros_pendientes WHERE email = $1', [email]);
        throw error;
    }
};

const verificarCodigoRegistro = async (email, codigo, ip) => {
    await comprobarBloqueoIp(ip);

    const cliente = await pool.connect();
    let transaccionAbierta = false;

    try {
        await cliente.query('BEGIN');
        transaccionAbierta = true;

        const resultado = await cliente.query(
            `SELECT nombre, password_hash, codigo_hash, vence_en, intentos
             FROM base_datos.registros_pendientes
             WHERE email = $1
             FOR UPDATE`,
            [email]
        );

        const pendiente = resultado.rows[0];

        if (!pendiente) {
            throw crearErrorRegistro('No hay un registro pendiente para ese correo.', 400);
        }

        if (new Date(pendiente.vence_en) <= new Date() || pendiente.intentos >= 5) {
            await cliente.query(
                'DELETE FROM base_datos.registros_pendientes WHERE email = $1',
                [email]
            );
            await cliente.query('COMMIT');
            transaccionAbierta = false;
            throw crearErrorRegistro('El código venció o se agotaron los intentos. Solicita uno nuevo.', 400);
        }

        const recibido = hashearCodigoRegistro(codigo);
        const guardado = Buffer.from(pendiente.codigo_hash.trim(), 'hex');
        const coincide = recibido.length === guardado.length && timingSafeEqual(recibido, guardado);

        if (!coincide) {
            await cliente.query(
                'UPDATE base_datos.registros_pendientes SET intentos = intentos + 1 WHERE email = $1',
                [email]
            );

            const falloIp = await registrarFalloIp(cliente, ip);

            await cliente.query('COMMIT');
            transaccionAbierta = false;

            if (falloIp.bloqueado_hasta) {
                throw crearErrorRegistro(
                    mensajeBloqueo('Demasiados intentos.', falloIp.bloqueado_hasta),
                    429
                );
            }

            throw crearErrorRegistro('El código ingresado no es correcto.', 400);
        }

        const rol = await cliente.query(
            `SELECT id_rol FROM base_datos.roles WHERE nombre = 'Usuario'`
        );

        if (!rol.rowCount) {
            throw new Error('No se encontró el rol Usuario.');
        }

        const creado = await cliente.query(
            `INSERT INTO base_datos.usuarios (nombre, email, password_hash, id_rol)
             VALUES ($1, $2, $3, $4)
             RETURNING id_usuario, nombre, email, id_rol, activo, fecha_creacion`,
            [pendiente.nombre, email, pendiente.password_hash, rol.rows[0].id_rol]
        );

        await cliente.query(
            'DELETE FROM base_datos.registros_pendientes WHERE email = $1',
            [email]
        );
        await cliente.query(
            'DELETE FROM base_datos.bloqueos_registro_ip WHERE ip = $1',
            [ip]
        );
        await cliente.query(
            'DELETE FROM base_datos.reenvios_registro_ip WHERE ip = $1',
            [ip]
        );

        await cliente.query('COMMIT');
        transaccionAbierta = false;

        return creado.rows[0];
    } catch (error) {
        if (transaccionAbierta) await cliente.query('ROLLBACK');
        throw error;
    } finally {
        cliente.release();
    }
};

const comprobarBloqueoIp = async (ip, cliente = pool) => {
    const resultado = await cliente.query(
        'SELECT bloqueado_hasta FROM base_datos.bloqueos_registro_ip WHERE ip = $1',
        [ip]
    );

    const hasta = resultado.rows[0]?.bloqueado_hasta;

    if (hasta && new Date(hasta) > new Date()) {
        throw crearErrorRegistro(
            mensajeBloqueo('Demasiados intentos.', hasta),
            429
        );
    }
};

const registrarFalloIp = async (cliente, ip) => {
    const resultado = await cliente.query(
        `INSERT INTO base_datos.bloqueos_registro_ip AS b
            (ip, intentos, actualizado_en)
         VALUES ($1, 1, NOW())
         ON CONFLICT (ip) DO UPDATE SET
            intentos = CASE
                WHEN b.bloqueado_hasta IS NOT NULL AND b.bloqueado_hasta <= NOW() THEN 1
                ELSE b.intentos + 1
            END,
            bloqueado_hasta = CASE
                WHEN (
                    CASE
                        WHEN b.bloqueado_hasta IS NOT NULL AND b.bloqueado_hasta <= NOW() THEN 1
                        ELSE b.intentos + 1
                    END
                ) >= 2 THEN NOW() + INTERVAL '15 minutes'
                ELSE NULL
            END,
            actualizado_en = NOW()
         RETURNING intentos, bloqueado_hasta`,
        [ip]
    );

    return resultado.rows[0];
};

const comprobarBloqueoReenvioIp = async (ip) => {
    const resultado = await pool.query(
        'SELECT bloqueado_hasta FROM base_datos.reenvios_registro_ip WHERE ip = $1',
        [ip]
    );

    const hasta = resultado.rows[0]?.bloqueado_hasta;

    if (hasta && new Date(hasta) > new Date()) {
        throw crearErrorRegistro(
            mensajeBloqueo('Demasiados reenvíos.', hasta),
            429
        );
    }
};

const registrarReenvioIp = async (ip) => {
    const resultado = await pool.query(
        `INSERT INTO base_datos.reenvios_registro_ip AS r
            (ip, intentos, ventana_inicio, actualizado_en)
         VALUES ($1, 1, NOW(), NOW())
         ON CONFLICT (ip) DO UPDATE SET
            intentos = CASE
                WHEN r.ventana_inicio <= NOW() - INTERVAL '15 minutes' THEN 1
                ELSE r.intentos + 1
            END,
            ventana_inicio = CASE
                WHEN r.ventana_inicio <= NOW() - INTERVAL '15 minutes' THEN NOW()
                ELSE r.ventana_inicio
            END,
            bloqueado_hasta = CASE
                WHEN (
                    CASE
                        WHEN r.ventana_inicio <= NOW() - INTERVAL '15 minutes' THEN 1
                        ELSE r.intentos + 1
                    END
                ) > 3 THEN NOW() + INTERVAL '15 minutes'
                ELSE NULL
            END,
            actualizado_en = NOW()
         RETURNING intentos, bloqueado_hasta`,
        [ip]
    );

    if (resultado.rows[0].bloqueado_hasta) {
        throw crearErrorRegistro(
            mensajeBloqueo('Superaste los 3 reenvíos.', resultado.rows[0].bloqueado_hasta),
            429
        );
    }
};

module.exports = {
    iniciarSesion,
    obtenerUsuarioPorId,
    solicitarCodigoRegistro,
    verificarCodigoRegistro
};