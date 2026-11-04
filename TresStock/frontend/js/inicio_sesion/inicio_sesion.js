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
    const campoCodigo = document.getElementById('contenedor_codigo_verificacion');
    const inputCodigo = document.getElementById('registro_codigo');
    const botonReenviarCodigo = document.getElementById('boton_reenviar_codigo');
    const botonEnviar = formularioRegistro.querySelector('button[type="submit"]');

    let codigoEnviado = false;
    let temporizadorReenvio = null;

    function abrirModalRegistro() {
        modalRegistro.classList.add('activo');
        modalRegistro.setAttribute('aria-hidden', 'false');
        document.getElementById('registro_nombre').focus();
    }

    function cerrarRegistro() {
        modalRegistro.classList.remove('activo');
        modalRegistro.setAttribute('aria-hidden', 'true');
    }

    function iniciarCuentaAtrasReenvio() {
        let segundos = 60;
        botonReenviarCodigo.disabled = true;
        botonReenviarCodigo.textContent = `Reenviar código en ${segundos} s`;

        clearInterval(temporizadorReenvio);

        temporizadorReenvio = setInterval(() => {
            segundos--;
            botonReenviarCodigo.textContent = `Reenviar código en ${segundos} s`;

            if (segundos <= 0) {
                clearInterval(temporizadorReenvio);
                temporizadorReenvio = null;
                botonReenviarCodigo.disabled = false;
                botonReenviarCodigo.textContent = 'Reenviar código';
            }
        }, 1000);
    }

    botonRegistro.addEventListener('click', abrirModalRegistro);
    cerrarModalRegistro.addEventListener('click', cerrarRegistro);

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
        const codigo = inputCodigo.value.trim();

        if (password !== confirmarPassword) {
            mensajeRegistro.textContent = 'Las contraseñas no coinciden.';
            return;
        }

        if (codigoEnviado && !/^\d{6}$/.test(codigo)) {
            mensajeRegistro.textContent = 'Ingresa el código de 6 dígitos.';
            return;
        }

        const ruta = codigoEnviado
            ? '/api/autenticacion/registro/verificar'
            : '/api/autenticacion/registro/iniciar';

        const datosRegistro = { nombre, email, password, confirmar_password: confirmarPassword };
        if (codigoEnviado) datosRegistro.codigo = codigo;

        botonEnviar.disabled = true;

        try {
            const respuesta = await fetch(`${URL_API}${ruta}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datosRegistro)
            });

            const datos = await respuesta.json();

            if (!respuesta.ok) {
                mensajeRegistro.textContent = datos.mensaje || 'No se pudo procesar el registro.';
                return;
            }

            if (!codigoEnviado) {
                codigoEnviado = true;
                campoCodigo.hidden = false;
                inputCodigo.required = true;
                botonEnviar.textContent = 'Verificar código';
                mensajeRegistro.textContent = datos.mensaje || 'Te enviamos un código a tu correo.';
                inputCodigo.focus();
                iniciarCuentaAtrasReenvio();
                return;
            }

            formularioRegistro.reset();
            campoCodigo.hidden = true;
            inputCodigo.required = false;
            codigoEnviado = false;
            botonEnviar.textContent = 'Registrarme';
            clearInterval(temporizadorReenvio);
            temporizadorReenvio = null;
            botonReenviarCodigo.disabled = true;
            botonReenviarCodigo.textContent = 'Reenviar código';
            cerrarRegistro();

            document.getElementById('email').value = email;
            mostrarAlertaSuperior('Cuenta creada correctamente. Ya puedes iniciar sesión.');
        } catch (error) {
            mensajeRegistro.textContent = 'No se pudo conectar con el servidor.';
        } finally {
            botonEnviar.disabled = false;
        }
    });

    botonReenviarCodigo.addEventListener('click', async () => {
        if (!codigoEnviado) return;

        botonReenviarCodigo.disabled = true;
        mensajeRegistro.textContent = '';

        const datosRegistro = {
            nombre: document.getElementById('registro_nombre').value.trim(),
            email: document.getElementById('registro_email').value.trim(),
            password: document.getElementById('registro_password').value,
            confirmar_password: document.getElementById('registro_confirmar_password').value
        };

        try {
            const respuesta = await fetch(`${URL_API}/api/autenticacion/registro/iniciar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datosRegistro)
            });

            const datos = await respuesta.json();

            if (!respuesta.ok) {
                mensajeRegistro.textContent = datos.mensaje || 'No se pudo reenviar el código.';

                if (respuesta.status === 429) {
                    iniciarCuentaAtrasReenvio();
                } else {
                    botonReenviarCodigo.disabled = false;
                }

                return;
            }

            inputCodigo.value = '';
            mensajeRegistro.textContent = datos.mensaje || 'Te enviamos otro código.';
            iniciarCuentaAtrasReenvio();
        } catch (error) {
            mensajeRegistro.textContent = 'No se pudo conectar con el servidor.';
            botonReenviarCodigo.disabled = false;
        }
    });

// TITULO 12 MODAL DE RECUPERACION

    const botonAbrirRecuperacion = document.getElementById('recuperar_contrasena_inicio_sesion');
    const modalRecuperacion = document.getElementById('modal_recuperacion');
    const botonCerrarRecuperacion = document.getElementById('cerrar_modal_recuperacion');
    const formularioRecuperacion = document.getElementById('formulario_recuperacion');
    const pasoCodigoRecuperacion = document.getElementById('paso_codigo_recuperacion');
    const emailRecuperacion = document.getElementById('recuperacion_email');
    const codigoRecuperacion = document.getElementById('recuperacion_codigo');
    const passwordRecuperacion = document.getElementById('recuperacion_password');
    const confirmarPasswordRecuperacion = document.getElementById('recuperacion_confirmar_password');
    const mensajeRecuperacion = document.getElementById('mensaje_recuperacion');
    const botonEnviarRecuperacion = document.getElementById('boton_enviar_recuperacion');
    const botonReenviarRecuperacion = document.getElementById('boton_reenviar_recuperacion');
    const botonVolverRecuperacion = document.getElementById('boton_volver_recuperacion');

    let pasoCodigoRecuperacionActivo = false;
    let temporizadorReenvioRecuperacion = null;

    function abrirModalRecuperacion() {
        modalRecuperacion.classList.add('activo');
        modalRecuperacion.setAttribute('aria-hidden', 'false');
        emailRecuperacion.focus();
    }

    function cerrarModalRecuperacion() {
        modalRecuperacion.classList.remove('activo');
        modalRecuperacion.setAttribute('aria-hidden', 'true');
    }

    function iniciarCuentaAtrasRecuperacion() {
        let segundos = 60;
        botonReenviarRecuperacion.disabled = true;
        botonReenviarRecuperacion.textContent = `Reenviar código en ${segundos} s`;

        clearInterval(temporizadorReenvioRecuperacion);

        temporizadorReenvioRecuperacion = setInterval(() => {
            segundos--;
            botonReenviarRecuperacion.textContent = `Reenviar código en ${segundos} s`;

            if (segundos <= 0) {
                clearInterval(temporizadorReenvioRecuperacion);
                temporizadorReenvioRecuperacion = null;
                botonReenviarRecuperacion.disabled = false;
                botonReenviarRecuperacion.textContent = 'Reenviar código';
            }
        }, 1000);
    }

    function mostrarPasoCodigoRecuperacion() {
        pasoCodigoRecuperacionActivo = true;
        pasoCodigoRecuperacion.hidden = false;
        codigoRecuperacion.disabled = false;
        codigoRecuperacion.required = true;
        passwordRecuperacion.disabled = false;
        passwordRecuperacion.required = true;
        confirmarPasswordRecuperacion.disabled = false;
        confirmarPasswordRecuperacion.required = true;
        botonEnviarRecuperacion.textContent = 'Restablecer contraseña';
        iniciarCuentaAtrasRecuperacion();
        codigoRecuperacion.focus();
    }

    botonAbrirRecuperacion.addEventListener('click', abrirModalRecuperacion);
    botonCerrarRecuperacion.addEventListener('click', cerrarModalRecuperacion);

    botonVolverRecuperacion.addEventListener('click', () => {
        clearInterval(temporizadorReenvioRecuperacion);
        temporizadorReenvioRecuperacion = null;
        pasoCodigoRecuperacionActivo = false;
        pasoCodigoRecuperacion.hidden = true;

        codigoRecuperacion.value = '';
        codigoRecuperacion.disabled = true;
        codigoRecuperacion.required = false;
        passwordRecuperacion.value = '';
        passwordRecuperacion.disabled = true;
        passwordRecuperacion.required = false;
        confirmarPasswordRecuperacion.value = '';
        confirmarPasswordRecuperacion.disabled = true;
        confirmarPasswordRecuperacion.required = false;

        botonEnviarRecuperacion.textContent = 'Enviar código';
        botonReenviarRecuperacion.disabled = true;
        botonReenviarRecuperacion.textContent = 'Reenviar código en 60 s';
        mensajeRecuperacion.textContent = '';
        emailRecuperacion.focus();
    });

    document.addEventListener('keydown', (evento) => {
        if (evento.key === 'Escape' && modalRecuperacion.classList.contains('activo')) {
            cerrarModalRecuperacion();
        }
    });

    document.querySelectorAll('.texto_campo_recuperacion').forEach((texto) => {
        texto.addEventListener('click', () => {
            document.getElementById(texto.dataset.for)?.focus();
        });
    });

    formularioRecuperacion.addEventListener('submit', async (evento) => {
        evento.preventDefault();
        mensajeRecuperacion.textContent = '';

        const email = emailRecuperacion.value.trim();

        if (!pasoCodigoRecuperacionActivo) {
            botonEnviarRecuperacion.disabled = true;

            try {
                const respuesta = await fetch(`${URL_API}/api/autenticacion/recuperar/iniciar`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });

                const datos = await respuesta.json();

                if (!respuesta.ok) {
                    mensajeRecuperacion.textContent = datos.mensaje || 'No se pudo procesar la solicitud.';
                    return;
                }

                mensajeRecuperacion.textContent = 'Si existe una cuenta con ese correo, enviaremos un código.';
                mostrarPasoCodigoRecuperacion();
            } catch (error) {
                mensajeRecuperacion.textContent = 'No se pudo conectar con el servidor.';
            } finally {
                botonEnviarRecuperacion.disabled = false;
            }

            return;
        }

        const codigo = codigoRecuperacion.value.trim();
        const password = passwordRecuperacion.value;
        const confirmarPassword = confirmarPasswordRecuperacion.value;

        if (!/^\d{6}$/.test(codigo)) {
            mensajeRecuperacion.textContent = 'Ingresa el código de 6 dígitos.';
            return;
        }

        if (password.length < 8) {
            mensajeRecuperacion.textContent = 'La contraseña debe tener al menos 8 caracteres.';
            return;
        }

        if (password !== confirmarPassword) {
            mensajeRecuperacion.textContent = 'Las contraseñas no coinciden.';
            return;
        }

        botonEnviarRecuperacion.disabled = true;

        try {
            const respuesta = await fetch(`${URL_API}/api/autenticacion/recuperar/confirmar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, codigo, password, confirmar_password: confirmarPassword })
            });

            const datos = await respuesta.json();

            if (!respuesta.ok) {
                mensajeRecuperacion.textContent = datos.mensaje || 'El código no es válido o venció.';
                return;
            }

            clearInterval(temporizadorReenvioRecuperacion);
            formularioRecuperacion.reset();
            pasoCodigoRecuperacionActivo = false;
            pasoCodigoRecuperacion.hidden = true;
            codigoRecuperacion.disabled = true;
            codigoRecuperacion.required = false;
            passwordRecuperacion.disabled = true;
            passwordRecuperacion.required = false;
            confirmarPasswordRecuperacion.disabled = true;
            confirmarPasswordRecuperacion.required = false;
            botonEnviarRecuperacion.textContent = 'Enviar código';
            botonReenviarRecuperacion.disabled = true;
            botonReenviarRecuperacion.textContent = 'Reenviar código en 60 s';
            mensajeRecuperacion.textContent = '';

            cerrarModalRecuperacion();
            mostrarAlertaSuperior('Contraseña actualizada. Ya puedes iniciar sesión.');
            return;
        } catch (error) {
            mensajeRecuperacion.textContent = 'No se pudo conectar con el servidor.';
        } finally {
            botonEnviarRecuperacion.disabled = false;
        }
    });

    botonReenviarRecuperacion.addEventListener('click', async () => {
        botonReenviarRecuperacion.disabled = true;
        mensajeRecuperacion.textContent = '';

        try {
            const respuesta = await fetch(`${URL_API}/api/autenticacion/recuperar/iniciar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: emailRecuperacion.value.trim() })
            });

            const datos = await respuesta.json();

            if (!respuesta.ok) {
                mensajeRecuperacion.textContent = datos.mensaje || 'No se pudo procesar la solicitud.';
                botonReenviarRecuperacion.disabled = false;
                return;
            }

            codigoRecuperacion.value = '';
            mensajeRecuperacion.textContent = 'Si existe una cuenta con ese correo, enviaremos un código.';
            iniciarCuentaAtrasRecuperacion();
        } catch (error) {
            mensajeRecuperacion.textContent = 'No se pudo conectar con el servidor.';
            botonReenviarRecuperacion.disabled = false;
        }
    });

// TITULO 12 PIE INICIO SESION

    // Sin funcion

// TITULO 13 ALERTA NOTIFICAR EXITO

    let temporizadorAlerta;

    function mostrarAlertaSuperior(mensaje) {
        const alerta = document.getElementById('alerta_superior');
        alerta.textContent = mensaje;
        alerta.classList.add('visible');

        clearTimeout(temporizadorAlerta);
        temporizadorAlerta = setTimeout(() => alerta.classList.remove('visible'), 3500);
    }