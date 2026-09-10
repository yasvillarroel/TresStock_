// backend/probar_conexion.js (temporal, para verificar)
const pool = require('./configuracion/base_datos');

pool.query('SELECT NOW()')
  .then((res) => {
    console.log('Conexión OK:', res.rows[0]);
    pool.end();
  })
  .catch((err) => {
    console.error('Error de conexión:', err);
    pool.end();
  });