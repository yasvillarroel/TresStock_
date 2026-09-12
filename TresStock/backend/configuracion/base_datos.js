// carga las variables del archivo .env
require('dotenv').config();

// importa la herramienta para crear un grupo de conexiones
const { Pool } = require('pg');


// muestra si la contraseña fue cargada
console.log('password:', process.env.DB_PASSWORD ? 'cargada' : 'no cargada');

// crea el grupo de conexiones con PostgreSQL
const pool = new Pool({

    // define el servidor donde esta PostgreSQL
    host: process.env.DB_HOST,

    // define el puerto de PostgreSQL
    port: process.env.DB_PORT,

    // define el usuario de PostgreSQL
    user: process.env.DB_USER,

    // define la contraseña de PostgreSQL
    password: process.env.DB_PASSWORD,

    // define la base de datos que se utilizara
    database: process.env.DB_NAME,

    // establece el esquema que utilizara PostgreSQL
    options: '-c search_path=base_datos',

});

// detecta errores inesperados en las conexiones
pool.on('error', (err) => {

    // muestra el error en la consola
    console.error('Error inesperado en el pool de PostgreSQL:', err);

});

// permite utilizar el pool desde otros archivos
module.exports = pool;