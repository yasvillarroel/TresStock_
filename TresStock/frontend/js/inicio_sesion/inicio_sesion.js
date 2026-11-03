// TITULO 1 BODY INICIO DE SESION

    // Sin funcion

// TITULO 2 CONTENEDOR INICIO SESION

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
                    `${URL_API}/api/autenticacion/login`,
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

// TITULO 3 IDENTIDAD TRESSTOCK

    // Sin funcion

// TITULO 4 ACCESO TRESSTOCK

    // Sin funcion

//  TITULO 5 ENCABEZADO FORMULARIO

    // Sin funcion

// TITULO 6 CORREO ELECTRONICO

    // Sin funcion

// TITULO 7 CONTRASEÑA

    // Sin funcion

// TITULO 8 MENSAJE Y RECUPERAR CONTRASEÑA

    // Sin funcion

// TITULO 9 BOTON INICIO SESION

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

// TITULO 10 BOTON DE REGISTRO

    // Sin funcion

// TITULO 11 MODAL DE REGISTRO

    const modalRegistro = document.getElementById('modal_registro');
    const botonRegistro = document.getElementById('boton_registro_inicio_sesion');
    const cerrarModalRegistro = document.getElementById('cerrar_modal_registro');
    const formularioRegistro = document.getElementById('formulario_registro');
    const mensajeRegistro = document.getElementById('mensaje_registro');

    function abrirModalRegistro() {
        modalRegistro.classList.add('activo');
        modalRegistro.setAttribute('aria-hidden', 'false');
        document.getElementById('registro_nombre').focus();
    }

    function cerrarRegistro() {
        modalRegistro.classList.remove('activo');
        modalRegistro.setAttribute('aria-hidden', 'true');
    }

    botonRegistro.addEventListener('click', abrirModalRegistro);
    cerrarModalRegistro.addEventListener('click', cerrarRegistro);

    modalRegistro.addEventListener('click', (evento) => {
        if (evento.target === modalRegistro) cerrarRegistro();
    });

    document.addEventListener('keydown', (evento) => {
        if (evento.key === 'Escape' && modalRegistro.classList.contains('activo')) {
            cerrarRegistro();
        }
    });

    document.querySelectorAll('.texto_campo_registro').forEach((texto) => {
        texto.addEventListener('click', () => {
            document.getElementById(texto.dataset.for)?.focus();
        });
    });

    formularioRegistro.addEventListener('submit', async (evento) => {
        evento.preventDefault();
        mensajeRegistro.textContent = '';

        const nombre = document.getElementById('registro_nombre').value.trim();
        const email = document.getElementById('registro_email').value.trim();
        const password = document.getElementById('registro_password').value;
        const confirmarPassword = document.getElementById('registro_confirmar_password').value;

        if (password !== confirmarPassword) {
            mensajeRegistro.textContent = 'Las contraseñas no coinciden.';
            return;
        }

        try {
            const respuesta = await fetch(`${URL_API}/api/autenticacion/registro`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombre,
                    email,
                    password,
                    confirmar_password: confirmarPassword
                })
            });

            const datos = await respuesta.json();

            if (!respuesta.ok) {
                mensajeRegistro.textContent = datos.mensaje || 'No se pudo crear la cuenta.';
                return;
            }

            formularioRegistro.reset();
            cerrarRegistro();
            document.getElementById('email').value = email;
            document.getElementById('mensaje_login').textContent = 'Cuenta creada. Ya puedes iniciar sesión.';
        } catch (error) {
            mensajeRegistro.textContent = 'No se pudo conectar con el servidor.';
        }
    });

// TITULO 12 PIE INICIO SESION

    // Sin funcion