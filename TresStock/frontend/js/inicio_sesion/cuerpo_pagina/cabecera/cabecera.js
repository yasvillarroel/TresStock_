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

                const datos = await respuesta.json();
                if (datos.csrfToken && typeof actualizarTokenCsrf === 'function') {
                    actualizarTokenCsrf(datos.csrfToken);
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

    // carga alertas de inventario y vencimientos desde la campanita
    function inicializarNotificacionesCabecera() {
        const contenedor = document.getElementById('contenedor_notificaciones_cabecera');
        const boton = document.getElementById('boton_notificaciones_cabecera');
        const panel = document.getElementById('panel_notificaciones_cabecera');
        const contador = document.getElementById('contador_notificaciones_cabecera');
        const lista = document.getElementById('lista_notificaciones_cabecera');
        const botonActualizar = document.getElementById('actualizar_notificaciones_cabecera');
        const tituloPanel = document.getElementById('titulo_notificaciones_cabecera');
        const pestanaInventario = document.getElementById('pestana_notificaciones_inventario');
        const pestanaVencimientos = document.getElementById('pestana_notificaciones_vencimientos');
        if (!contenedor || !boton || !panel || !lista || boton.dataset.inicializado === 'true') return;
        boton.dataset.inicializado = 'true';

        let tipoActual = 'inventario';
        let alertasInventario = [];
        let alertasVencimiento = [];
        let totalVencimientos = 0;

        const cerrarPanel = () => {
            panel.hidden = true;
            boton.setAttribute('aria-expanded', 'false');
        };

        const formatearStock = (valor, esBalanza) => {
            const cantidad = Number(valor || 0).toLocaleString('es-CL', {maximumFractionDigits: 3});
            return esBalanza ? `${cantidad} (KG)` : cantidad;
        };

        const actualizarContador = () => {
            const total = alertasInventario.length + totalVencimientos;
            contador.textContent = total > 99 ? '99+' : String(total);
            contador.hidden = total === 0;
            boton.setAttribute('aria-label', `Notificaciones: ${alertasInventario.length} de inventario y ${totalVencimientos} de vencimiento`);
        };

        const mostrarEstado = texto => {
            lista.replaceChildren();
            const estado = document.createElement('div');
            estado.className = 'estado_notificaciones_cabecera';
            estado.textContent = texto;
            lista.appendChild(estado);
        };

        const seleccionarTipo = tipo => {
            tipoActual = tipo;
            const inventarioSeleccionado = tipo === 'inventario';
            pestanaInventario.classList.toggle('pestana_notificaciones_activa', inventarioSeleccionado);
            pestanaVencimientos.classList.toggle('pestana_notificaciones_activa', !inventarioSeleccionado);
            pestanaInventario.setAttribute('aria-selected', String(inventarioSeleccionado));
            pestanaVencimientos.setAttribute('aria-selected', String(!inventarioSeleccionado));
            pestanaInventario.tabIndex = inventarioSeleccionado ? 0 : -1;
            pestanaVencimientos.tabIndex = inventarioSeleccionado ? -1 : 0;
            tituloPanel.textContent = inventarioSeleccionado ? 'Alertas de inventario' : 'Alertas de vencimiento';
            renderizarAlertas();
        };

        const renderizarAlertas = () => {
            const esInventario = tipoActual === 'inventario';
            const alertas = esInventario ? alertasInventario : alertasVencimiento;
            const total = esInventario ? alertasInventario.length : totalVencimientos;
            lista.replaceChildren();
            if (!alertas.length) {
                mostrarEstado(esInventario ? 'No hay alertas de inventario por ahora.' : 'No hay vencimientos críticos o en riesgo durante los próximos 10 días.');
                return;
            }
            alertas.forEach(alerta => {
                const esVencimiento = !esInventario;
                const item = document.createElement('button');
                item.type = 'button';
                item.className = esVencimiento
                    ? `item_notificacion_cabecera ${alerta.estado === 'VENCIMIENTO CRÍTICO' ? 'notificacion_vencimiento_critico' : 'notificacion_vencimiento_riesgo'}`
                    : `item_notificacion_cabecera notificacion_${alerta.estado.toLowerCase().replaceAll(' ', '_')}`;
                item.setAttribute('role', 'listitem');
                const contenido = document.createElement('span');
                contenido.className = 'contenido_item_notificacion_cabecera';
                const titulo = document.createElement('span');
                titulo.className = 'titulo_item_notificacion_cabecera';
                titulo.textContent = alerta.descripcion || alerta.producto || alerta.codigo || 'Producto';
                const detalle = document.createElement('span');
                detalle.className = 'detalle_item_notificacion_cabecera';
                if (esVencimiento) {
                    const dias = Number(alerta.dias_restantes);
                    const fecha = new Date(`${String(alerta.fecha_vencimiento).slice(0, 10)}T00:00:00`).toLocaleDateString('es-CL');
                    const cantidad = formatearStock(alerta.cantidad, String(alerta.familia || '').toLowerCase() === 'balanza');
                    detalle.textContent = `${alerta.estado} · ${dias === 0 ? 'vence hoy' : `vence en ${dias} días`} · ${fecha} · ${cantidad}`;
                } else {
                    detalle.textContent = `${alerta.estado === 'STOCK NEGATIVO' ? 'Stock negativo' : alerta.estado === 'SIN STOCK' ? 'Sin stock' : 'Stock bajo'} · ${formatearStock(alerta.stock_actual, alerta.es_producto_balanza)}${alerta.estado === 'STOCK BAJO' ? ` / mínimo ${formatearStock(alerta.stock_minimo, alerta.es_producto_balanza)}` : ''}`;
                }
                contenido.append(titulo, detalle);
                const flecha = document.createElement('span');
                flecha.className = 'flecha_item_notificacion_cabecera';
                flecha.textContent = '›';
                item.append(contenido, flecha);
                item.addEventListener('click', async () => {
                    cerrarPanel();
                    if (typeof cargarVista !== 'function') return;
                    await cargarVista(esVencimiento ? 'alertas' : 'inventario');
                    if (!esVencimiento) {
                        const busqueda = document.getElementById('input_busqueda_inventario');
                        if (busqueda) {
                            busqueda.value = alerta.codigo || alerta.descripcion || '';
                            busqueda.dispatchEvent(new Event('input', {bubbles: true}));
                        }
                    }
                });
                lista.appendChild(item);
            });
            if (total > alertas.length) {
                const nota = document.createElement('div');
                nota.className = 'estado_notificaciones_cabecera';
                nota.textContent = `Mostrando ${alertas.length} de ${total} alertas.`;
                lista.appendChild(nota);
            }
        };

        const cargarAlertas = async () => {
            mostrarEstado('Cargando alertas…');
            try {
                const [respuestaInventario, respuestaVencimiento] = await Promise.all([
                    fetchConCsrf(`${URL_API}/api/inventario`, {method: 'GET', credentials: 'include'}),
                    fetchConCsrf(`${URL_API}/api/alertas/vencimientos/notificaciones`, {method: 'GET', credentials: 'include'})
                ]);
                const [productos, datosVencimiento] = await Promise.all([respuestaInventario.json(), respuestaVencimiento.json()]);
                if (!respuestaInventario.ok) throw new Error(productos.mensaje || 'No se pudieron cargar las alertas de inventario.');
                if (!respuestaVencimiento.ok) throw new Error(datosVencimiento.mensaje || 'No se pudieron cargar las alertas de vencimiento.');
                alertasInventario = (Array.isArray(productos) ? productos : []).filter(producto => ['STOCK NEGATIVO', 'SIN STOCK', 'STOCK BAJO'].includes(producto.estado));
                alertasInventario.sort((a, b) => {
                    const prioridad = {'STOCK NEGATIVO': 0, 'SIN STOCK': 1, 'STOCK BAJO': 2};
                    return prioridad[a.estado] - prioridad[b.estado] || String(a.descripcion).localeCompare(String(b.descripcion), 'es');
                });
                alertasVencimiento = Array.isArray(datosVencimiento.alertas) ? datosVencimiento.alertas : [];
                totalVencimientos = Number(datosVencimiento.total || 0);
                actualizarContador();
                renderizarAlertas();
            } catch (error) {
                contador.hidden = true;
                mostrarEstado(error.message || 'No se pudieron cargar las alertas.');
                lista.firstElementChild?.classList.add('error_notificaciones_cabecera');
            }
        };

        boton.addEventListener('click', async () => {
            const abrir = panel.hidden;
            panel.hidden = !abrir;
            boton.setAttribute('aria-expanded', String(abrir));
            if (abrir) await cargarAlertas();
        });
        botonActualizar.addEventListener('click', cargarAlertas);
        pestanaInventario.addEventListener('click', () => seleccionarTipo('inventario'));
        pestanaVencimientos.addEventListener('click', () => seleccionarTipo('vencimientos'));
        document.addEventListener('click', evento => {
            if (!contenedor.contains(evento.target)) cerrarPanel();
        });
        document.addEventListener('keydown', evento => {
            if (evento.key === 'Escape' && !panel.hidden) {
                cerrarPanel();
                boton.focus();
            }
        });
        seleccionarTipo('inventario');
        cargarAlertas();
        window.setInterval(cargarAlertas, 60000);
    }
