// TITULO 1 USUARIO AUTENTICADO EN LA CABECERA

    // muestra el nombre y correo del usuario que inicio sesion
    function mostrarUsuarioCabecera(usuario) {

        if (!usuario || typeof usuario !== 'object') {
            return;
        }

        // obtiene los campos existentes en cabecera.html
        const nombreUsuarioCabecera = document.getElementById(
            'nombre_usuario_cabecera'
        );

        const emailUsuarioCabecera = document.getElementById(
            'email_usuario_cabecera'
        );

        // construye el nombre con los campos recibidos desde la sesion
        const nombres = usuario.nombre || usuario.nombres || '';
        const apellidos = usuario.apellido || usuario.apellidos || '';

        const nombreCompleto = usuario.nombre_completo ||
            usuario.nombreCompleto ||
            [nombres, apellidos].filter(Boolean).join(' ') ||
            usuario.nombre_usuario ||
            usuario.username ||
            'Usuario';

        // obtiene el correo sin incluir datos inventados
        const correo = usuario.correo ||
            usuario.email ||
            usuario.correo_electronico ||
            '';

        // actualiza los textos de la cabecera
        if (nombreUsuarioCabecera) {
            nombreUsuarioCabecera.textContent = nombreCompleto;
        }

        if (emailUsuarioCabecera) {
            emailUsuarioCabecera.textContent = correo;
        }
    }


// TITULO 2 MENU DESPLEGABLE Y CIERRE DE SESION

    // configura los eventos despues de cargar cabecera.html
    function inicializarMenuUsuarioCabecera() {

        const contenedorPerfil = document.getElementById('contenedor_perfil_usuario_cabecera');
        const botonPerfil = document.getElementById('boton_perfil_usuario_cabecera');
        const menuUsuario = document.getElementById('menu_desplegable_usuario_cabecera');
        const botonCerrarSesion = document.getElementById('boton_cerrar_sesion_cabecera');

        if (!contenedorPerfil || !botonPerfil || !menuUsuario || !botonCerrarSesion) {
            return;
        }

        // evita instalar los eventos dos veces sobre la misma cabecera
        if (botonPerfil.dataset.menuInicializado === 'true') {
            return;
        }
        botonPerfil.dataset.menuInicializado = 'true';

        // muestra u oculta el menu y actualiza el estado accesible
        function establecerMenuAbierto(abierto) {
            menuUsuario.hidden = !abierto;
            botonPerfil.setAttribute('aria-expanded', String(abierto));
        }

        botonPerfil.addEventListener('click', function () {
            establecerMenuAbierto(menuUsuario.hidden);
        });

        // cierra al hacer clic fuera del perfil
        document.addEventListener('click', function (evento) {
            if (!contenedorPerfil.contains(evento.target)) {
                establecerMenuAbierto(false);
            }
        });

        // cierra al presionar Escape
        document.addEventListener('keydown', function (evento) {
            if (evento.key === 'Escape' && !menuUsuario.hidden) {
                establecerMenuAbierto(false);
                botonPerfil.focus();
            }
        });

        // ejecuta cierre de sesion desde el backend
        botonCerrarSesion.addEventListener('click', async function () {

            if (botonCerrarSesion.disabled) {
                return;
            }

            botonCerrarSesion.disabled = true;
            botonCerrarSesion.textContent = 'Cerrando sesión...';

            try {
                const respuesta = await fetch(
                    `${URL_API}/api/autenticacion/logout`,
                    {
                        method: 'POST',
                        credentials: 'include'
                    }
                );

                if (!respuesta.ok) {
                    throw new Error('No se pudo cerrar la sesión. Inténtalo nuevamente.');
                }

                // elimina solo la ultima vista guardada de TresStock
                sessionStorage.removeItem('vista_actual');

                // impide volver a la pagina privada con el boton Atras
                window.location.replace('./html/inicio_sesion/inicio_sesion.html');

            } catch (error) {
                console.error('Error al cerrar sesión:', error);
                alert(error.message || 'No se pudo cerrar la sesión.');
                botonCerrarSesion.disabled = false;
                botonCerrarSesion.textContent = 'Cerrar sesión';
            }
        });
    }
