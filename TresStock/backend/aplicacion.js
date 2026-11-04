// importa express
const express = require('express');

// importa cookie-parser para leer cookies
const cookieParser = require('cookie-parser');

// importa cors para permitir peticiones del frontend
const cors = require('cors');

// importa la conexion con PostgreSQL
const pool = require('./configuracion/base_datos');

// importa la validacion de sesion para las rutas privadas
const { autenticacion } = require('./middleware/autenticacion');

// crea la aplicacion de Express
const app = express();

// ====================================
// TITULO 1 CONFIGURACION DE MIDDLEWARES
// ====================================

// conserva los origenes de desarrollo que ya utilizaba TresStock
app.use(cors({
    origin: [
        'http://127.0.0.1:5500',
        'http://localhost:5500',
        /^http:\/\/192\.168\.\d+\.\d+:5500$/
    ],
    credentials: true
}));

const { doubleCsrfProtection } = require('./utilidades/csrf');

app.use(express.json());
app.use(cookieParser());
app.use('/api', doubleCsrfProtection);

// =======================================
// TITULO 2 ESTADO DE CONEXION (RUTA PUBLICA)
// =======================================

app.get('/api/estado_conexion', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        return res.json({
            estado: 'ok',
            mensaje: 'Conexion con PostgreSQL funcionando'
        });
    } catch (error) {
        console.error('Error de conexion con PostgreSQL:', error);
        return res.status(500).json({
            estado: 'error',
            mensaje: 'No se pudo conectar con PostgreSQL'
        });
    }
});

// ===================================
// TITULO 3 RUTAS DE INICIO Y CIERRE DE SESION
// ===================================

// el login debe ser publico; /sesion ya exige autenticacion en su router
app.use('/api/autenticacion', require('./rutas/autenticacion/autenticacion_rutas'));

// ===========================================
// TITULO 4 RUTAS DE MODULOS PRIVADOS DE TRESSTOCK
// ===========================================

// cada modulo requiere JWT valido y una cuenta activa en PostgreSQL
// el router de usuarios ademas exige rol Administrador en todas sus rutas
app.use('/api/usuarios', require('./rutas/usuarios/usuarios_rutas'));
app.use('/api/productos', autenticacion, require('./rutas/productos/productos_rutas'));
app.use('/api/proveedores', autenticacion, require('./rutas/proveedores/proveedores_rutas'));
app.use('/api/inventario', autenticacion, require('./rutas/inventario/inventario_rutas'));
app.use('/api/ventas', autenticacion, require('./rutas/ventas/ventas_rutas'));
app.use('/api/escaneo', autenticacion, require('./rutas/escaneo/escaneo_rutas'));

// se retiro /api/prueba-cookie: establecia una cookie de sesion no autenticada

// exporta la aplicacion
module.exports = app;
