// importa express
const express = require('express');

// importar cookie-parser
const cookieParser = require('cookie-parser');

// importa cors para permitir peticiones desde otros origenes
const cors = require('cors');

// importa el pool de conexiones con PostgreSQL
const pool = require('./configuracion/base_datos');

// crea la aplicacion de Express
const app = express();

// configura los middlewares globales

// permite peticiones desde otros origenes
// app.use(cors());
// configura cors para permitir el frontend
app.use(cors({
    origin: 'http://127.0.0.1:5500', //esto podria variar :P
    credentials: true
}));

// permite recibir datos en formato JSON
app.use(express.json());

// permite leer y manejar las cookies que llegan https
app.use(cookieParser());

// crea una ruta para verificar la conexion con PostgreSQL
app.get('/api/estado_conexion', async (req, res) => {

    // intenta ejecutar la consulta
    try {

        // realiza una consulta de prueba a PostgreSQL
        await pool.query('SELECT 1');

        // envia una respuesta si la conexion funciona
        res.json({

            // indica que la conexion funciona
            estado: 'ok',

            // muestra el mensaje de confirmacion
            mensaje: 'Conexion con PostgreSQL funcionando'

        });

    } catch (error) {

        // muestra el error en la consola
        console.error('Error de conexion con PostgreSQL:', error);

        // envia una respuesta si la conexion falla
        res.status(500).json({

            // indica que ocurrio un error
            estado: 'error',

            // muestra el mensaje de error
            mensaje: 'No se pudo conectar con PostgreSQL'

        });

    }

});
// ruta de prueba para probar cookies
app.get('/api/prueba-cookie', (req, res) => {

    res.cookie('sesion', '123', {
        httpOnly: false,
        secure: false,
        sameSite: 'lax',
        path: '/'
    });

    res.json({
        cookies: req.cookies
    });
});

// aqui se iran agregando las rutas de cada modulo

// registra las rutas de usuarios
app.use('/api/usuarios', require('./rutas/usuarios/usuarios_rutas'));

// registra las rutas de autenticacion
app.use('/api/autenticacion', require('./rutas/autenticacion/autenticacion_rutas'));

// registra las rutas de productos
app.use('/api/productos', require('./rutas/productos/productos_rutas'));

// registra las rutas de proveedores
app.use('/api/proveedores', require('./rutas/proveedores/proveedores_rutas'));

// exporta la aplicacion para utilizarla desde otros archivos
module.exports = app;