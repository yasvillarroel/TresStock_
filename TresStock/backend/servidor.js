// carga las variables del archivo .env
require('dotenv').config();

// importa la aplicacion de Express
const app = require('./aplicacion');

// define el puerto del servidor
const PUERTO = process.env.PORT || 3000;

// inicia el servidor
app.listen(PUERTO, () => {

    // muestra en consola la direccion del servidor
    console.log(`TresStock API escuchando en http://localhost:${PUERTO}`);

});