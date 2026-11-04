// TITULO 1 BODY INICIO DE SESION

    // Sin funcion

// TITULO 2 CONTENEDOR INICIO SESION

    // Busca el formulario de inicio de sesión en el HTML.
    const formularioInicioSesion = document.getElementById(
        // Usa el identificador del formulario.
        'formulario_inicio_sesion'
    );

    // Busca el elemento donde se muestran los mensajes del inicio de sesión.
    const mensajeInicioSesion = document.getElementById(
        // Usa el identificador del mensaje.
        'mensaje_login'
    );

    // Ejecuta esta función cuando se envía el formulario.
    formularioInicioSesion.addEventListener(
        // Escucha el evento de envío.
        'submit',
        // Define una función asíncrona para poder esperar la respuesta del servidor.
        async function (evento) {

            // Evita que el navegador recargue la página al enviar el formulario.
            evento.preventDefault();

            // Busca el campo de correo, obtiene su valor y elimina espacios al principio y al final.
            const email = document.getElementById(
                // Usa el identificador del campo de correo.
                'email'
            ).value.trim();

            // Busca el campo de contraseña y obtiene su valor.
            const password = document.getElementById(
                // Usa el identificador del campo de contraseña.
                'contrasena'
            ).value;


            // Comprueba si el campo de correo está vacío.
            if (email === '') {

                // Muestra un mensaje si no se ingresó el correo.
                mensajeInicioSesion.textContent =
                    // Define el texto que verá el usuario.
                    'Debes ingresar el correo electrónico.';

                // Detiene el envío del formulario.
                return;

            }

            // Comprueba si el campo de contraseña está vacío.
            if (password === '') {

                // Muestra un mensaje si no se ingresó la contraseña.
                mensajeInicioSesion.textContent =
                    // Define el texto que verá el usuario.
                    'Debes ingresar la contraseña.';

                // Detiene el envío del formulario.
                return;

            }

            // Borra cualquier mensaje de una validación anterior.
            mensajeInicioSesion.textContent = '';

            // Intenta enviar las credenciales al servidor.
            try {

                // Envía una solicitud al endpoint de inicio de sesión.
                const respuesta = await fetchConCsrf(
                    // Construye la dirección usando la URL base de la API.
                    `${URL_API}/api/autenticacion/login`,
                    // Define las opciones de la solicitud HTTP.
                    {
                        // Envía los datos mediante POST.
                        method: 'POST',

                        // Permite enviar y recibir cookies con la solicitud.
                        credentials: 'include',

                        // Indica que el contenido enviado está en formato JSON.
                        headers: {
                            // Especifica el tipo de contenido.
                            'Content-Type': 'application/json'
                        },

                        // Convierte el correo y la contraseña a JSON para enviarlos.
                        body: JSON.stringify({
                            // Agrega el correo a los datos de la solicitud.
                            email: email,
                            // Agrega la contraseña a los datos de la solicitud.
                            password: password
                        })
                    }
                );

                // Convierte la respuesta del servidor desde JSON a un objeto JavaScript.
                const datos = await respuesta.json();

                // Comprueba si el servidor respondió con un error.
                if (!respuesta.ok) {

                    // Muestra el mensaje recibido o un mensaje predeterminado.
                    mensajeInicioSesion.textContent =
                        // Usa el mensaje del servidor si está disponible.
                        datos.mensaje ||
                        // Usa este texto si el servidor no envió un mensaje.
                        'No fue posible iniciar sesión.';
                    // Detiene la ejecución después de mostrar el error.
                    return;

                }

                // Muestra en la consola los datos del usuario recibidos.
                console.log(
                    // Identifica el contenido que se muestra en la consola.
                    'Usuario:',
                    // Imprime los datos recibidos.
                    datos
                );

                // Muestra un saludo con el nombre del usuario.
                mensajeInicioSesion.textContent =
                    // Une el saludo con el nombre recibido del servidor.
                    'Bienvenido ' + datos.nombre;

                // Redirige al usuario a la página principal del sistema.
                window.location.href = '../../index.html';

            // Ejecuta este bloque si ocurre un error durante la solicitud.
            } catch (error) {

                // Muestra el error técnico en la consola.
                console.error(
                    // Identifica el error en la consola.
                    'Error al iniciar sesión:',
                    // Imprime los detalles del error.
                    error
                );

                // Muestra un mensaje si no se pudo conectar con el servidor.
                mensajeInicioSesion.textContent =
                    // Define el texto que verá el usuario.
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

    // Busca el botón que inicia el proceso de inicio de sesión.
    const botonInicioSesion = document.getElementById(
        // Usa el identificador del botón.
        'boton_inicio_sesion'
    );

    // Ejecuta esta función cuando se hace clic en el botón.
    botonInicioSesion.addEventListener('click', function () {

        // Busca el formulario de inicio de sesión.
        const formularioInicioSesion = document.getElementById(
            // Usa el identificador del formulario.
            'formulario_inicio_sesion'
        );

        // Envía el formulario y activa sus validaciones normales.
        formularioInicioSesion.requestSubmit();

    });

// TITULO 10 BOTON DE REGISTRO

    // Esta sección no contiene lógica JavaScript.
    // Sin funcion

// TITULO 11 MODAL DE REGISTRO

    // Busca el modal de registro.
    const modalRegistro = document.getElementById('modal_registro');
    // Busca el botón que abre el modal de registro.
    const botonRegistro = document.getElementById('boton_registro_inicio_sesion');
    // Busca el botón que cierra el modal de registro.
    const cerrarModalRegistro = document.getElementById('cerrar_modal_registro');
    // Busca el formulario de registro.
    const formularioRegistro = document.getElementById('formulario_registro');
    // Busca el elemento donde se muestran mensajes de registro.
    const mensajeRegistro = document.getElementById('mensaje_registro');
    // Busca el contenedor que muestra el campo del código de verificación.
    const campoCodigo = document.getElementById('contenedor_codigo_verificacion');
    // Busca el campo donde se ingresa el código de verificación.
    const inputCodigo = document.getElementById('registro_codigo');
    // Busca el botón que solicita reenviar el código.
    const botonReenviarCodigo = document.getElementById('boton_reenviar_codigo');
    // Busca el botón de envío del formulario dentro del formulario de registro.
    const botonEnviar = formularioRegistro.querySelector('button[type="submit"]');

    // Indica si ya se solicitó el código de verificación.
    let codigoEnviado = false;
    // Guarda el identificador del temporizador para poder cancelarlo.
    let temporizadorReenvio = null;

    // Define la función que abre el modal de registro.
    function abrirModalRegistro() {
        // Agrega la clase que muestra el modal.
        modalRegistro.classList.add('activo');
        // Actualiza el atributo de accesibilidad para indicar que el modal está visible.
        modalRegistro.setAttribute('aria-hidden', 'false');
        // Pone el cursor en el campo del nombre.
        document.getElementById('registro_nombre').focus();
    }

    // Define la función que cierra el modal de registro.
    function cerrarRegistro() {
        // Quita la clase que muestra el modal.
        modalRegistro.classList.remove('activo');
        // Actualiza el atributo de accesibilidad para indicar que el modal está oculto.
        modalRegistro.setAttribute('aria-hidden', 'true');
    }

    // Define la cuenta regresiva para volver a habilitar el reenvío del código.
    function iniciarCuentaAtrasReenvio() {
        // Inicia la cuenta regresiva en 60 segundos.
        let segundos = 60;
        // Deshabilita el botón mientras dura la cuenta regresiva.
        botonReenviarCodigo.disabled = true;
        // Muestra los segundos restantes en el botón.
        botonReenviarCodigo.textContent = `Reenviar código en ${segundos} s`;

        // Cancela cualquier cuenta regresiva anterior.
        clearInterval(temporizadorReenvio);

        // Ejecuta el contenido una vez por segundo.
        temporizadorReenvio = setInterval(() => {
            // Resta un segundo al contador.
            segundos--;
            // Actualiza el texto del botón con el tiempo restante.
            botonReenviarCodigo.textContent = `Reenviar código en ${segundos} s`;

            // Comprueba si la cuenta regresiva llegó a cero.
            if (segundos <= 0) {
                // Detiene la cuenta regresiva.
                clearInterval(temporizadorReenvio);
                // Limpia la referencia al temporizador.
                temporizadorReenvio = null;
                // Habilita el botón para solicitar otro código.
                botonReenviarCodigo.disabled = false;
                // Cambia el texto para indicar que ya se puede reenviar.
                botonReenviarCodigo.textContent = 'Reenviar código';
            }
        // Configura el intervalo para ejecutarse cada segundo.
        }, 1000);
    }

    // Abre el modal cuando se hace clic en el botón de registro.
    botonRegistro.addEventListener('click', abrirModalRegistro);
    // Cierra el modal cuando se hace clic en su botón de cierre.
    cerrarModalRegistro.addEventListener('click', cerrarRegistro);

    // Escucha las teclas que se presionan en el documento.
    document.addEventListener('keydown', (evento) => {
        // Comprueba que se presionó Escape y que el modal está abierto.
        if (evento.key === 'Escape' && modalRegistro.classList.contains('activo')) {
            // Cierra el modal de registro.
            cerrarRegistro();
        }
    });

    // Busca todos los textos asociados a los campos del registro.
    document.querySelectorAll('.texto_campo_registro').forEach((texto) => {
        // Permite hacer clic en cada texto para enfocar su campo asociado.
        texto.addEventListener('click', () => {
            // Busca el campo indicado en el atributo data-for y lo enfoca si existe.
            document.getElementById(texto.dataset.for)?.focus();
        });
    });

    // Ejecuta esta función cuando se envía el formulario de registro.
    formularioRegistro.addEventListener('submit', async (evento) => {
        // Evita que el navegador recargue la página.
        evento.preventDefault();
        // Borra los mensajes de operaciones anteriores.
        mensajeRegistro.textContent = '';

        // Obtiene el nombre ingresado y elimina espacios al principio y al final.
        const nombre = document.getElementById('registro_nombre').value.trim();
        // Obtiene el correo ingresado y elimina espacios al principio y al final.
        const email = document.getElementById('registro_email').value.trim();
        // Obtiene la contraseña ingresada.
        const password = document.getElementById('registro_password').value;
        // Obtiene la confirmación de la contraseña.
        const confirmarPassword = document.getElementById('registro_confirmar_password').value;
        // Obtiene el código ingresado y elimina espacios al principio y al final.
        const codigo = inputCodigo.value.trim();

        // Comprueba si la contraseña y su confirmación son diferentes.
        if (password !== confirmarPassword) {
            // Muestra un mensaje cuando las contraseñas no coinciden.
            mensajeRegistro.textContent = 'Las contraseñas no coinciden.';
            // Detiene el envío del formulario.
            return;
        }

        // Comprueba si ya se envió un código y si el formato ingresado es incorrecto.
        if (codigoEnviado && !/^\d{6}$/.test(codigo)) {
            // Pide al usuario ingresar un código de seis dígitos.
            mensajeRegistro.textContent = 'Ingresa el código de 6 dígitos.';
            // Detiene el envío del formulario.
            return;
        }

        // Elige la ruta de la API según si ya se envió un código.
        const ruta = codigoEnviado
            // Si ya se envió, verifica el código para completar el registro.
            ? '/api/autenticacion/registro/verificar'
            // Si todavía no se envió, inicia el proceso y solicita un código.
            : '/api/autenticacion/registro/iniciar';

        // Prepara los datos del formulario que se enviarán al servidor.
        const datosRegistro = { nombre, email, password, confirmar_password: confirmarPassword };
        // Agrega el código a la solicitud si ya fue enviado.
        if (codigoEnviado) datosRegistro.codigo = codigo;

        // Deshabilita el botón para evitar envíos repetidos.
        botonEnviar.disabled = true;

        // Intenta enviar los datos del registro al servidor.
        try {
            // Envía los datos del registro a la ruta seleccionada.
            const respuesta = await fetchConCsrf(`${URL_API}${ruta}`, {
                // Envía la solicitud mediante POST.
                method: 'POST',
                // Indica que los datos enviados están en formato JSON.
                headers: { 'Content-Type': 'application/json' },
                // Convierte los datos del registro a JSON.
                body: JSON.stringify(datosRegistro)
            });

            // Convierte la respuesta del servidor desde JSON a un objeto.
            const datos = await respuesta.json();

            // Comprueba si el servidor respondió con un error.
            if (!respuesta.ok) {
                // Muestra el mensaje del servidor o un mensaje predeterminado.
                mensajeRegistro.textContent = datos.mensaje || 'No se pudo procesar el registro.';
                // Termina la función si la solicitud falló.
                return;
            }

            // Comprueba si esta solicitud era para pedir el primer código.
            if (!codigoEnviado) {
                // Guarda que ya se solicitó un código.
                codigoEnviado = true;
                // Muestra el campo para ingresar el código.
                campoCodigo.hidden = false;
                // Hace que el código sea obligatorio.
                inputCodigo.required = true;
                // Cambia el texto del botón para indicar que verificará el código.
                botonEnviar.textContent = 'Verificar código';
                // Muestra el mensaje recibido o uno predeterminado.
                mensajeRegistro.textContent = datos.mensaje || 'Te enviamos un código a tu correo.';
                // Pone el cursor en el campo del código.
                inputCodigo.focus();
                // Inicia el tiempo de espera para reenviar el código.
                iniciarCuentaAtrasReenvio();
                // Detiene la función para no ejecutar la finalización del registro todavía.
                return;
            }

            // Limpia los campos del formulario después de completar el registro.
            formularioRegistro.reset();
            // Oculta el campo del código de verificación.
            campoCodigo.hidden = true;
            // Deja de exigir el código en el formulario.
            inputCodigo.required = false;
            // Restablece el estado para permitir un nuevo registro.
            codigoEnviado = false;
            // Devuelve el texto original al botón de envío.
            botonEnviar.textContent = 'Registrarme';
            // Detiene la cuenta regresiva de reenvío.
            clearInterval(temporizadorReenvio);
            // Limpia la referencia al temporizador.
            temporizadorReenvio = null;
            // Deshabilita el botón de reenvío después del registro.
            botonReenviarCodigo.disabled = true;
            // Restablece el texto del botón de reenvío.
            botonReenviarCodigo.textContent = 'Reenviar código';
            // Cierra el modal de registro.
            cerrarRegistro();

            // Copia el correo registrado al campo del inicio de sesión.
            document.getElementById('email').value = email;
            // Muestra una alerta superior indicando que la cuenta fue creada.
            mostrarAlertaSuperior('Cuenta creada correctamente. Ya puedes iniciar sesión.');
        // Ejecuta este bloque si ocurre un error durante la solicitud.
        } catch (error) {
            // Informa que no se pudo conectar con el servidor.
            mensajeRegistro.textContent = 'No se pudo conectar con el servidor.';
        // Ejecuta este bloque tanto si la solicitud tuvo éxito como si falló.
        } finally {
            // Vuelve a habilitar el botón de envío.
            botonEnviar.disabled = false;
        }
    });

    // Ejecuta esta función cuando se hace clic para reenviar el código.
    botonReenviarCodigo.addEventListener('click', async () => {
        // Detiene el evento si el proceso de registro aún no solicitó un código.
        if (!codigoEnviado) return;

        // Deshabilita el botón mientras se procesa el reenvío.
        botonReenviarCodigo.disabled = true;
        // Borra cualquier mensaje anterior.
        mensajeRegistro.textContent = '';

        // Prepara los datos necesarios para solicitar otro código.
        const datosRegistro = {
            // Obtiene el nombre ingresado.
            nombre: document.getElementById('registro_nombre').value.trim(),
            // Obtiene el correo ingresado.
            email: document.getElementById('registro_email').value.trim(),
            // Obtiene la contraseña ingresada.
            password: document.getElementById('registro_password').value,
            // Obtiene la confirmación de la contraseña.
            confirmar_password: document.getElementById('registro_confirmar_password').value
        };

        // Intenta volver a solicitar un código de verificación.
        try {
            // Envía los datos a la ruta que inicia el registro y solicita el código.
            const respuesta = await fetchConCsrf(`${URL_API}/api/autenticacion/registro/iniciar`, {
                // Envía la solicitud mediante POST.
                method: 'POST',
                // Indica que los datos enviados están en formato JSON.
                headers: { 'Content-Type': 'application/json' },
                // Convierte los datos del registro a JSON.
                body: JSON.stringify(datosRegistro)
            });

            // Convierte la respuesta del servidor desde JSON a un objeto.
            const datos = await respuesta.json();

            // Comprueba si el servidor respondió con un error.
            if (!respuesta.ok) {
                // Muestra el mensaje del servidor o uno predeterminado.
                mensajeRegistro.textContent = datos.mensaje || 'No se pudo reenviar el código.';

                // Comprueba si el servidor informó un bloqueo temporal.
                if (respuesta.status === 429) {
                    // Inicia la cuenta regresiva mientras dure el bloqueo.
                    iniciarCuentaAtrasReenvio();
                // Ejecuta este bloque si no hubo un bloqueo temporal.
                } else {
                    // Habilita otra vez el botón para permitir un nuevo intento.
                    botonReenviarCodigo.disabled = false;
                }

                // Termina la función después de manejar el error.
                return;
            }

            // Borra el código anterior para que se ingrese el nuevo.
            inputCodigo.value = '';
            // Muestra el mensaje enviado por el servidor o uno predeterminado.
            mensajeRegistro.textContent = datos.mensaje || 'Te enviamos otro código.';
            // Inicia la cuenta regresiva antes de permitir otro reenvío.
            iniciarCuentaAtrasReenvio();
        // Ejecuta este bloque si falla la conexión o la solicitud.
        } catch (error) {
            // Muestra un mensaje de error de conexión.
            mensajeRegistro.textContent = 'No se pudo conectar con el servidor.';
            // Habilita el botón para permitir otro intento.
            botonReenviarCodigo.disabled = false;
        }
    });

// TITULO 12 MODAL DE RECUPERACION

    // Busca el botón que abre la recuperación de contraseña.
    const botonAbrirRecuperacion = document.getElementById('recuperar_contrasena_inicio_sesion');
    // Busca el modal de recuperación.
    const modalRecuperacion = document.getElementById('modal_recuperacion');
    // Busca el botón que cierra el modal de recuperación.
    const botonCerrarRecuperacion = document.getElementById('cerrar_modal_recuperacion');
    // Busca el formulario de recuperación.
    const formularioRecuperacion = document.getElementById('formulario_recuperacion');
    // Busca el contenedor que muestra los campos del paso de código.
    const pasoCodigoRecuperacion = document.getElementById('paso_codigo_recuperacion');
    // Busca el campo donde se ingresa el correo para recuperar la contraseña.
    const emailRecuperacion = document.getElementById('recuperacion_email');
    // Busca el campo donde se ingresa el código de recuperación.
    const codigoRecuperacion = document.getElementById('recuperacion_codigo');
    // Busca el campo donde se ingresa la nueva contraseña.
    const passwordRecuperacion = document.getElementById('recuperacion_password');
    // Busca el campo donde se confirma la nueva contraseña.
    const confirmarPasswordRecuperacion = document.getElementById('recuperacion_confirmar_password');
    // Busca el elemento donde se muestran mensajes de recuperación.
    const mensajeRecuperacion = document.getElementById('mensaje_recuperacion');
    // Busca el botón que envía el código o confirma el cambio de contraseña.
    const botonEnviarRecuperacion = document.getElementById('boton_enviar_recuperacion');
    // Busca el botón que solicita reenviar el código de recuperación.
    const botonReenviarRecuperacion = document.getElementById('boton_reenviar_recuperacion');
    // Busca el botón que vuelve al paso donde se ingresa el correo.
    const botonVolverRecuperacion = document.getElementById('boton_volver_recuperacion');

    // Indica si el usuario ya avanzó al paso de ingresar el código y la contraseña.
    let pasoCodigoRecuperacionActivo = false;
    // Guarda el identificador del temporizador de reenvío.
    let temporizadorReenvioRecuperacion = null;

    // Define la función que abre el modal de recuperación.
    function abrirModalRecuperacion() {
        // Agrega la clase que muestra el modal.
        modalRecuperacion.classList.add('activo');
        // Actualiza el atributo de accesibilidad para indicar que está visible.
        modalRecuperacion.setAttribute('aria-hidden', 'false');
        // Pone el cursor en el campo del correo.
        emailRecuperacion.focus();
    }

    // Define la función que cierra el modal de recuperación.
    function cerrarModalRecuperacion() {
        // Quita la clase que muestra el modal.
        modalRecuperacion.classList.remove('activo');
        // Actualiza el atributo de accesibilidad para indicar que está oculto.
        modalRecuperacion.setAttribute('aria-hidden', 'true');
    }

    // Define la cuenta regresiva para habilitar el reenvío del código.
    function iniciarCuentaAtrasRecuperacion() {
        // Inicia el contador en 60 segundos.
        let segundos = 60;
        // Deshabilita el botón mientras corre la cuenta regresiva.
        botonReenviarRecuperacion.disabled = true;
        // Muestra en el botón los segundos restantes.
        botonReenviarRecuperacion.textContent = `Reenviar código en ${segundos} s`;

        // Cancela cualquier cuenta regresiva anterior.
        clearInterval(temporizadorReenvioRecuperacion);

        // Ejecuta este bloque una vez por segundo.
        temporizadorReenvioRecuperacion = setInterval(() => {
            // Resta un segundo al contador.
            segundos--;
            // Actualiza el texto del botón con los segundos restantes.
            botonReenviarRecuperacion.textContent = `Reenviar código en ${segundos} s`;

            // Comprueba si la cuenta regresiva llegó a cero.
            if (segundos <= 0) {
                // Detiene la cuenta regresiva.
                clearInterval(temporizadorReenvioRecuperacion);
                // Limpia la referencia al temporizador.
                temporizadorReenvioRecuperacion = null;
                // Habilita el botón para poder reenviar el código.
                botonReenviarRecuperacion.disabled = false;
                // Cambia el texto para indicar que se puede reenviar.
                botonReenviarRecuperacion.textContent = 'Reenviar código';
            }
        // Configura el intervalo para ejecutarse cada segundo.
        }, 1000);
    }

    // Define la función que muestra y habilita el paso de ingreso del código.
    function mostrarPasoCodigoRecuperacion() {
        // Indica que el proceso ya está en el paso del código.
        pasoCodigoRecuperacionActivo = true;
        // Muestra el contenedor con los campos de código y contraseña.
        pasoCodigoRecuperacion.hidden = false;
        // Habilita el campo del código.
        codigoRecuperacion.disabled = false;
        // Hace obligatorio ingresar el código.
        codigoRecuperacion.required = true;
        // Habilita el campo de la nueva contraseña.
        passwordRecuperacion.disabled = false;
        // Hace obligatoria la nueva contraseña.
        passwordRecuperacion.required = true;
        // Habilita el campo para confirmar la contraseña.
        confirmarPasswordRecuperacion.disabled = false;
        // Hace obligatoria la confirmación de la contraseña.
        confirmarPasswordRecuperacion.required = true;
        // Cambia el texto del botón para indicar que actualizará la contraseña.
        botonEnviarRecuperacion.textContent = 'Restablecer contraseña';
        // Inicia la espera antes de permitir reenviar el código.
        iniciarCuentaAtrasRecuperacion();
        // Pone el cursor en el campo para ingresar el código.
        codigoRecuperacion.focus();
    }

    // Abre el modal cuando se hace clic en el botón de recuperación.
    botonAbrirRecuperacion.addEventListener('click', abrirModalRecuperacion);
    // Cierra el modal cuando se hace clic en el botón de cierre.
    botonCerrarRecuperacion.addEventListener('click', cerrarModalRecuperacion);

    // Vuelve al paso de ingreso del correo cuando se hace clic en el botón correspondiente.
    botonVolverRecuperacion.addEventListener('click', () => {
        // Detiene la cuenta regresiva del reenvío.
        clearInterval(temporizadorReenvioRecuperacion);
        // Limpia la referencia al temporizador.
        temporizadorReenvioRecuperacion = null;
        // Indica que el proceso ya no está en el paso del código.
        pasoCodigoRecuperacionActivo = false;
        // Oculta el paso del código y las contraseñas.
        pasoCodigoRecuperacion.hidden = true;

        // Borra el código ingresado.
        codigoRecuperacion.value = '';
        // Deshabilita el campo del código.
        codigoRecuperacion.disabled = true;
        // Deja de exigir el código.
        codigoRecuperacion.required = false;
        // Borra la contraseña ingresada.
        passwordRecuperacion.value = '';
        // Deshabilita el campo de la nueva contraseña.
        passwordRecuperacion.disabled = true;
        // Deja de exigir la nueva contraseña.
        passwordRecuperacion.required = false;
        // Borra la confirmación de la contraseña.
        confirmarPasswordRecuperacion.value = '';
        // Deshabilita el campo de confirmación.
        confirmarPasswordRecuperacion.disabled = true;
        // Deja de exigir la confirmación de la contraseña.
        confirmarPasswordRecuperacion.required = false;

        // Restablece el texto del botón para solicitar un código.
        botonEnviarRecuperacion.textContent = 'Enviar código';
        // Deshabilita el reenvío hasta que se solicite otro código.
        botonReenviarRecuperacion.disabled = true;
        // Restablece el texto del botón de reenvío.
        botonReenviarRecuperacion.textContent = 'Reenviar código en 60 s';
        // Borra el mensaje que se estuviera mostrando.
        mensajeRecuperacion.textContent = '';
        // Devuelve el cursor al campo del correo.
        emailRecuperacion.focus();
    });

    // Escucha las teclas que se presionan en el documento.
    document.addEventListener('keydown', (evento) => {
        // Comprueba que se presionó Escape y que el modal está abierto.
        if (evento.key === 'Escape' && modalRecuperacion.classList.contains('activo')) {
            // Cierra el modal de recuperación.
            cerrarModalRecuperacion();
        }
    });

    // Busca todos los textos asociados a los campos de recuperación.
    document.querySelectorAll('.texto_campo_recuperacion').forEach((texto) => {
        // Permite hacer clic en cada texto para enfocar el campo relacionado.
        texto.addEventListener('click', () => {
            // Busca el campo indicado por data-for y lo enfoca si existe.
            document.getElementById(texto.dataset.for)?.focus();
        });
    });

    // Ejecuta esta función cuando se envía el formulario de recuperación.
    formularioRecuperacion.addEventListener('submit', async (evento) => {
        // Evita que el navegador recargue la página.
        evento.preventDefault();
        // Borra los mensajes anteriores.
        mensajeRecuperacion.textContent = '';

        // Obtiene el correo ingresado y elimina los espacios de los extremos.
        const email = emailRecuperacion.value.trim();

        // Comprueba si todavía se está en el paso de ingresar el correo.
        if (!pasoCodigoRecuperacionActivo) {
            // Deshabilita el botón mientras se solicita el código.
            botonEnviarRecuperacion.disabled = true;

            // Intenta solicitar un código de recuperación.
            try {
                // Envía el correo al endpoint que inicia la recuperación.
                const respuesta = await fetchConCsrf(`${URL_API}/api/autenticacion/recuperar/iniciar`, {
                    // Envía la solicitud mediante POST.
                    method: 'POST',
                    // Indica que los datos se envían en formato JSON.
                    headers: { 'Content-Type': 'application/json' },
                    // Envía el correo convertido a JSON.
                    body: JSON.stringify({ email })
                });

                // Convierte la respuesta del servidor desde JSON a un objeto.
                const datos = await respuesta.json();

                // Comprueba si el servidor respondió con un error.
                if (!respuesta.ok) {
                    // Muestra el mensaje recibido o uno predeterminado.
                    mensajeRecuperacion.textContent = datos.mensaje || 'No se pudo procesar la solicitud.';
                    // Detiene la función después de manejar el error.
                    return;
                }

                // Muestra el mensaje genérico para evitar revelar si el correo tiene una cuenta.
                mensajeRecuperacion.textContent = 'Si existe una cuenta con ese correo, enviaremos un código.';
                // Muestra los campos para ingresar el código y la contraseña nueva.
                mostrarPasoCodigoRecuperacion();
            // Ejecuta este bloque si falla la solicitud o la conexión.
            } catch (error) {
                // Informa que no se pudo conectar con el servidor.
                mensajeRecuperacion.textContent = 'No se pudo conectar con el servidor.';
            // Ejecuta este bloque tanto si la solicitud tuvo éxito como si falló.
            } finally {
                // Vuelve a habilitar el botón de envío.
                botonEnviarRecuperacion.disabled = false;
            }

            // Termina aquí porque todavía no corresponde confirmar una contraseña.
            return;
        }

        // Obtiene el código ingresado y elimina espacios de los extremos.
        const codigo = codigoRecuperacion.value.trim();
        // Obtiene la nueva contraseña ingresada.
        const password = passwordRecuperacion.value;
        // Obtiene la confirmación de la nueva contraseña.
        const confirmarPassword = confirmarPasswordRecuperacion.value;

        // Comprueba que el código tenga exactamente seis dígitos.
        if (!/^\d{6}$/.test(codigo)) {
            // Pide ingresar un código de seis dígitos.
            mensajeRecuperacion.textContent = 'Ingresa el código de 6 dígitos.';
            // Detiene el envío del formulario.
            return;
        }

        // Comprueba que la contraseña tenga al menos ocho caracteres.
        if (password.length < 8) {
            // Informa el largo mínimo requerido para la contraseña.
            mensajeRecuperacion.textContent = 'La contraseña debe tener al menos 8 caracteres.';
            // Detiene el envío del formulario.
            return;
        }

        // Comprueba que la contraseña y su confirmación coincidan.
        if (password !== confirmarPassword) {
            // Informa que las contraseñas no coinciden.
            mensajeRecuperacion.textContent = 'Las contraseñas no coinciden.';
            // Detiene el envío del formulario.
            return;
        }

        // Deshabilita el botón mientras se confirma el cambio.
        botonEnviarRecuperacion.disabled = true;

        // Intenta validar el código y actualizar la contraseña.
        try {
            // Envía los datos al endpoint que confirma la recuperación.
            const respuesta = await fetchConCsrf(`${URL_API}/api/autenticacion/recuperar/confirmar`, {
                // Envía la solicitud mediante POST.
                method: 'POST',
                // Indica que los datos se envían en formato JSON.
                headers: { 'Content-Type': 'application/json' },
                // Envía el correo, el código y las dos versiones de la contraseña.
                body: JSON.stringify({ email, codigo, password, confirmar_password: confirmarPassword })
            });

            // Convierte la respuesta del servidor desde JSON a un objeto.
            const datos = await respuesta.json();

            // Comprueba si el servidor respondió con un error.
            if (!respuesta.ok) {
                // Muestra el mensaje del servidor o uno predeterminado.
                mensajeRecuperacion.textContent = datos.mensaje || 'El código no es válido o venció.';
                // Detiene la función después de mostrar el error.
                return;
            }

            // Detiene la cuenta regresiva del reenvío.
            clearInterval(temporizadorReenvioRecuperacion);
            // Limpia los campos del formulario.
            formularioRecuperacion.reset();
            // Restablece el proceso al paso inicial.
            pasoCodigoRecuperacionActivo = false;
            // Oculta el paso del código y las contraseñas.
            pasoCodigoRecuperacion.hidden = true;
            // Deshabilita el campo del código.
            codigoRecuperacion.disabled = true;
            // Deja de exigir el código.
            codigoRecuperacion.required = false;
            // Deshabilita el campo de la contraseña nueva.
            passwordRecuperacion.disabled = true;
            // Deja de exigir la contraseña nueva.
            passwordRecuperacion.required = false;
            // Deshabilita el campo de confirmación.
            confirmarPasswordRecuperacion.disabled = true;
            // Deja de exigir la confirmación.
            confirmarPasswordRecuperacion.required = false;
            // Restablece el texto del botón para solicitar un código.
            botonEnviarRecuperacion.textContent = 'Enviar código';
            // Deshabilita el botón de reenvío después de completar el proceso.
            botonReenviarRecuperacion.disabled = true;
            // Restablece el texto del botón de reenvío.
            botonReenviarRecuperacion.textContent = 'Reenviar código en 60 s';
            // Borra el mensaje del modal.
            mensajeRecuperacion.textContent = '';

            // Cierra el modal de recuperación.
            cerrarModalRecuperacion();
            // Muestra una alerta que confirma que la contraseña fue actualizada.
            mostrarAlertaSuperior('Contraseña actualizada. Ya puedes iniciar sesión.');
            // Detiene la función después de completar el proceso.
            return;
        // Ejecuta este bloque si falla la solicitud o la conexión.
        } catch (error) {
            // Informa que no se pudo conectar con el servidor.
            mensajeRecuperacion.textContent = 'No se pudo conectar con el servidor.';
        // Ejecuta este bloque tanto si la solicitud tuvo éxito como si falló.
        } finally {
            // Vuelve a habilitar el botón de envío.
            botonEnviarRecuperacion.disabled = false;
        }
    });

    // Ejecuta esta función cuando se hace clic para reenviar el código.
    botonReenviarRecuperacion.addEventListener('click', async () => {
        // Deshabilita el botón mientras se procesa la solicitud.
        botonReenviarRecuperacion.disabled = true;
        // Borra cualquier mensaje anterior.
        mensajeRecuperacion.textContent = '';

        // Intenta solicitar otro código de recuperación.
        try {
            // Envía el correo al endpoint que inicia la recuperación.
            const respuesta = await fetchConCsrf(`${URL_API}/api/autenticacion/recuperar/iniciar`, {
                // Envía la solicitud mediante POST.
                method: 'POST',
                // Indica que los datos se envían en formato JSON.
                headers: { 'Content-Type': 'application/json' },
                // Envía el correo ingresado en el modal.
                body: JSON.stringify({ email: emailRecuperacion.value.trim() })
            });

            // Convierte la respuesta del servidor desde JSON a un objeto.
            const datos = await respuesta.json();

            // Comprueba si el servidor respondió con un error.
            if (!respuesta.ok) {
                // Muestra el mensaje recibido o uno predeterminado.
                mensajeRecuperacion.textContent = datos.mensaje || 'No se pudo procesar la solicitud.';
                // Habilita de nuevo el botón para permitir otro intento.
                botonReenviarRecuperacion.disabled = false;
                // Termina la función después de manejar el error.
                return;
            }

            // Borra el código anterior para que se ingrese el nuevo.
            codigoRecuperacion.value = '';
            // Muestra el mensaje genérico para no revelar si existe una cuenta.
            mensajeRecuperacion.textContent = 'Si existe una cuenta con ese correo, enviaremos un código.';
            // Inicia la cuenta regresiva antes de permitir otro reenvío.
            iniciarCuentaAtrasRecuperacion();
        // Ejecuta este bloque si falla la solicitud o la conexión.
        } catch (error) {
            // Informa que no se pudo conectar con el servidor.
            mensajeRecuperacion.textContent = 'No se pudo conectar con el servidor.';
            // Habilita de nuevo el botón para permitir otro intento.
            botonReenviarRecuperacion.disabled = false;
        }
    });

// TITULO 13 PIE INICIO SESION

    // Sin funcion

// TITULO 14 ALERTA NOTIFICAR EXITO

    // Sin funcion