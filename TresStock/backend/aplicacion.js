// importa express
const express = require('express');

// importa cors para permitir peticiones desde otros origenes
const cors = require('cors');

// importa el pool de conexiones con PostgreSQL
const pool = require('./configuracion/base_datos');

// crea la aplicacion de Express
const app = express();

// configura los middlewares globales

// permite peticiones desde otros origenes
app.use(cors());

// permite recibir datos en formato JSON
app.use(express.json());

// aqui se iran agregando las rutas de cada modulo
// registra las rutas de usuarios
app.use('/api/usuarios', require('./rutas/usuarios/usuarios_rutas'));

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

// aqui se iran agregando las rutas de cada modulo

// registra las rutas de productos
// app.use('/api/productos', require('./rutas/productos_rutas'));

// exporta la aplicacion para utilizarla desde otros archivos
module.exports = app;