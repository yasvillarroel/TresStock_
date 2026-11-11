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
                const respuesta = await fetchConCsrf(
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


// TITULO 3 NOTIFICACIONES DE INVENTARIO

    // carga alertas de stock y permite saltar al producto correspondiente
    function inicializarNotificacionesCabecera() {
        const contenedor = document.getElementById('contenedor_notificaciones_cabecera');
        const boton = document.getElementById('boton_notificaciones_cabecera');
        const panel = document.getElementById('panel_notificaciones_cabecera');
        const contador = document.getElementById('contador_notificaciones_cabecera');
        const lista = document.getElementById('lista_notificaciones_cabecera');
        const botonActualizar = document.getElementById('actualizar_notificaciones_cabecera');
        if (!contenedor || !boton || !panel || !lista || boton.dataset.inicializado === 'true') return;
        boton.dataset.inicializado = 'true';

        const cerrarPanel = () => {
            panel.hidden = true;
            boton.setAttribute('aria-expanded', 'false');
        };

        const formatearStock = (valor, esBalanza) => {
            const cantidad = Number(valor || 0).toLocaleString('es-CL', {maximumFractionDigits: 3});
            return esBalanza ? `${cantidad} (KG)` : cantidad;
        };

        const cargarAlertas = async () => {
            lista.replaceChildren();
            const cargando = document.createElement('div');
            cargando.className = 'estado_notificaciones_cabecera';
            cargando.textContent = 'Cargando alertas…';
            lista.appendChild(cargando);
            try {
                const respuesta = await fetchConCsrf(`${URL_API}/api/inventario`, {method: 'GET', credentials: 'include'});
                const productos = await respuesta.json();
                if (!respuesta.ok) throw new Error(productos.mensaje || 'No se pudieron cargar las alertas.');
                const alertas = (Array.isArray(productos) ? productos : []).filter(producto => ['STOCK NEGATIVO', 'SIN STOCK', 'STOCK BAJO'].includes(producto.estado));
                alertas.sort((a, b) => {
                    const prioridad = {'STOCK NEGATIVO': 0, 'SIN STOCK': 1, 'STOCK BAJO': 2};
                    return prioridad[a.estado] - prioridad[b.estado] || String(a.descripcion).localeCompare(String(b.descripcion), 'es');
                });
                contador.textContent = alertas.length > 99 ? '99+' : String(alertas.length);
                contador.hidden = alertas.length === 0;
                boton.setAttribute('aria-label', `Notificaciones de inventario: ${alertas.length} alertas activas`);
                lista.replaceChildren();
                if (!alertas.length) {
                    const vacio = document.createElement('div');
                    vacio.className = 'estado_notificaciones_cabecera';
                    vacio.textContent = 'No hay alertas de stock por ahora.';
                    lista.appendChild(vacio);
                    return;
                }
                alertas.forEach(producto => {
                    const item = document.createElement('button');
                    item.type = 'button';
                    item.className = `item_notificacion_cabecera notificacion_${producto.estado.toLowerCase().replaceAll(' ', '_')}`;
                    item.setAttribute('role', 'listitem');
                    const contenido = document.createElement('span');
                    contenido.className = 'contenido_item_notificacion_cabecera';
                    const titulo = document.createElement('span');
                    titulo.className = 'titulo_item_notificacion_cabecera';
                    titulo.textContent = producto.descripcion || producto.codigo || 'Producto';
                    const detalle = document.createElement('span');
                    detalle.className = 'detalle_item_notificacion_cabecera';
                    detalle.textContent = `${producto.estado === 'STOCK NEGATIVO' ? 'Stock negativo' : producto.estado === 'SIN STOCK' ? 'Sin stock' : 'Stock bajo'} · ${formatearStock(producto.stock_actual, producto.es_producto_balanza)}${producto.estado === 'STOCK BAJO' ? ` / mínimo ${formatearStock(producto.stock_minimo, producto.es_producto_balanza)}` : ''}`;
                    contenido.append(titulo, detalle);
                    const flecha = document.createElement('span');
                    flecha.className = 'flecha_item_notificacion_cabecera';
                    flecha.textContent = '›';
                    item.append(contenido, flecha);
                    item.addEventListener('click', async () => {
                        cerrarPanel();
                        if (typeof cargarVista !== 'function') return;
                        await cargarVista('inventario');
                        const busqueda = document.getElementById('input_busqueda_inventario');
                        if (busqueda) {
                            busqueda.value = producto.codigo || producto.descripcion || '';
                            busqueda.dispatchEvent(new Event('input', {bubbles: true}));
                        }
                    });
                    lista.appendChild(item);
                });
            } catch (error) {
                contador.hidden = true;
                lista.replaceChildren();
                const fallo = document.createElement('div');
                fallo.className = 'estado_notificaciones_cabecera error_notificaciones_cabecera';
                fallo.textContent = error.message || 'No se pudieron cargar las alertas.';
                lista.appendChild(fallo);
            }
        };

        boton.addEventListener('click', async () => {
            const abrir = panel.hidden;
            panel.hidden = !abrir;
            boton.setAttribute('aria-expanded', String(abrir));
            if (abrir) await cargarAlertas();
        });
        botonActualizar.addEventListener('click', cargarAlertas);
        document.addEventListener('click', evento => {
            if (!contenedor.contains(evento.target)) cerrarPanel();
        });
        document.addEventListener('keydown', evento => {
            if (evento.key === 'Escape' && !panel.hidden) {
                cerrarPanel();
                boton.focus();
            }
        });
        cargarAlertas();
        window.setInterval(cargarAlertas, 60000);
    }
