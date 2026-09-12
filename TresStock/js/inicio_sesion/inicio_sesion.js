    
//TITULO 1 FUNCION COMPORTAMIENTO DE BOTON
    //comportamiento de boton
    const boton = document.getElementById('boton_inicio_sesion');

    boton.addEventListener('click', function () {

        document.getElementById('formulario_inicio_sesion').requestSubmit();

    });

// TITULO 2 FUNCION INICIAR SESION

    // obtiene el formulario
    const formulario = document.getElementById('formulario_inicio_sesion');

    // obtiene el mensaje
    const mensaje = document.getElementById('mensaje_login');

    // detecta el envio del formulario
    formulario.addEventListener('submit', async function (evento) {

        // evita recargar la pagina
        evento.preventDefault();

        // obtiene el correo
        const email = document.getElementById('email').value;

        // obtiene la contrasena
        const password = document.getElementById('contrasena').value;

        try {

            // envia los datos al backend
            const respuesta = await fetch(
                'http://localhost:3000/api/autenticacion/login',
                {
                    method: 'POST',

                    headers: {
                        'Content-Type': 'application/json'
                    },

                    body: JSON.stringify({
                        email: email,
                        password: password
                    })
                }
            );

            // convierte la respuesta a JSON
            const datos = await respuesta.json();

            // comprueba si el inicio de sesion fue correcto
            if (!respuesta.ok) {

                mensaje.textContent = datos.mensaje;

                return;
            }

            // muestra los datos del usuario
            console.log('usuario:', datos);

            mensaje.textContent =
                'Bienvenido ' + datos.nombre;

        } catch (error) {

            // muestra el error
            console.error('Error al iniciar sesion:', error);

            mensaje.textContent =
                'No se pudo conectar con el servidor';

        }

    });