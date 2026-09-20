// TITULO 1 COMPORTAMIENTO BOTON INICIO SESION

    // obtiene la opción utilizada para iniciar sesión
    const botonInicioSesion = document.getElementById(
        'boton_inicio_sesion'
    );

    // detecta el clic sobre la opción de inicio de sesión
    botonInicioSesion.addEventListener('click', function () {

        const formularioInicioSesion = document.getElementById(
            'formulario_inicio_sesion'
        );

        formularioInicioSesion.requestSubmit();

    });

    
// TITULO 2 FUNCION INICIAR SESION

    // obtiene el formulario de inicio de sesión
    const formularioInicioSesion = document.getElementById(
        'formulario_inicio_sesion'
    );

    // obtiene el espacio utilizado para mostrar mensajes
    const mensajeInicioSesion = document.getElementById(
        'mensaje_login'
    );

    // detecta el envío del formulario
    formularioInicioSesion.addEventListener(
        'submit',
        async function (evento) {

            // evita que la página se recargue al enviar el formulario
            evento.preventDefault();

            // obtiene el correo ingresado
            const email = document.getElementById(
                'email'
            ).value.trim();

            // obtiene la contraseña ingresada
            const password = document.getElementById(
                'contrasena'
            ).value;


            // comprueba que el correo haya sido ingresado
            if (email === '') {

                mensajeInicioSesion.textContent =
                    'Debes ingresar el correo electrónico.';

                return;

            }

            // comprueba que la contraseña haya sido ingresada
            if (password === '') {

                mensajeInicioSesion.textContent =
                    'Debes ingresar la contraseña.';

                return;

            }

            // limpia mensajes anteriores
            mensajeInicioSesion.textContent = '';

            try {

                // envía las credenciales al backend para realizar la autenticación
                const respuesta = await fetch(
                    'http://127.0.0.1:3000/api/autenticacion/login',
                    {
                        method: 'POST',

                        credentials: 'include',

                        headers: {
                            'Content-Type': 'application/json'
                        },

                        body: JSON.stringify({
                            email: email,
                            password: password
                        })
                    }
                );

                // convierte la respuesta del backend a JSON
                const datos = await respuesta.json();

                // comprueba si el inicio de sesión fue rechazado
                if (!respuesta.ok) {

                    mensajeInicioSesion.textContent =
                        datos.mensaje ||
                        'No fue posible iniciar sesión.';
                    return;

                }

                // muestra en consola la respuesta recibida desde el backend
                console.log(
                    'Usuario:',
                    datos
                );

                // muestra temporalmente un mensaje de acceso correcto
                mensajeInicioSesion.textContent =
                    'Bienvenido ' + datos.nombre;

                // redirecciona al usuario hacia el sistema
                window.location.href = '../../index.html';

            } catch (error) {

                // muestra el error en consola
                console.error(
                    'Error al iniciar sesión:',
                    error
                );

                // informa cuando no existe conexión con el servidor
                mensajeInicioSesion.textContent =
                    'No se pudo conectar con el servidor.';

            }

        }
    );