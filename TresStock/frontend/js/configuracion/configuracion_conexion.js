// Configuración de conexión del frontend con el backend.

// Si utilizamos Live Server (puerto 5500),
// nos conectamos al backend local (puerto 3000).

// Si utilizamos Cloudflare o Express,
// usamos la misma dirección desde donde se abrió TresStock.

const URL_API = window.location.port === '5500' ? `http://${window.location.hostname}:3000` : window.location.origin;