// Guarda el token CSRF para reutilizarlo en las solicitudes.
let tokenCsrf = '';

// Obtiene un token CSRF del backend cuando todavía no hay uno guardado.
async function obtenerTokenCsrf() {
    const respuesta = await fetch(`${URL_API}/api/autenticacion/csrf-token`, {
        credentials: 'include'
    });

    if (!respuesta.ok) throw new Error('No se pudo obtener el token CSRF.');

    const datos = await respuesta.json();
    tokenCsrf = datos.csrfToken;
    return tokenCsrf;
}

// Envía solicitudes e incorpora el token en las que modifican datos.
async function fetchConCsrf(url, opciones = {}) {
    const metodo = (opciones.method || 'GET').toUpperCase();
    const requiereToken = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(metodo);

    if (requiereToken && !tokenCsrf) {
        await obtenerTokenCsrf();
    }

    const headers = new Headers(opciones.headers || {});

    if (requiereToken) {
        headers.set('x-csrf-token', tokenCsrf);
    }

    return fetch(url, {
        ...opciones,
        headers,
        credentials: opciones.credentials || 'include'
    });
}

// Actualiza el token después de que el backend lo rote al iniciar sesión.
function actualizarTokenCsrf(nuevoToken) {
    tokenCsrf = nuevoToken;
}