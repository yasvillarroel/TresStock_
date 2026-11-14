// Inicializa las alertas de inventario y el listado paginado de vencimientos.
async function inicializarAlertasVencimientos() {
    const filasStock = document.getElementById('filas_alertas_inventario');
    const informacionStock = document.getElementById('informacion_alertas_inventario');
    const numerosStock = document.getElementById('numeros_alertas_inventario');
    const anteriorStock = document.getElementById('anterior_alertas_inventario');
    const siguienteStock = document.getElementById('siguiente_alertas_inventario');
    const busquedaStock = document.getElementById('busqueda_alertas_inventario');
    const estadoStock = document.getElementById('filtro_estado_alertas_inventario');
    const familiaStock = document.getElementById('filtro_familia_alertas_inventario');
    const actividadStock = document.getElementById('filtro_actividad_alertas_inventario');
    const limpiarStock = document.getElementById('limpiar_filtros_alertas_inventario');
    const filas = document.getElementById('filas_vencimientos');
    const informacion = document.getElementById('informacion_paginador_vencimientos');
    const numeros = document.getElementById('numeros_paginas_vencimientos');
    const botonAnterior = document.getElementById('anterior_vencimientos');
    const botonSiguiente = document.getElementById('siguiente_vencimientos');
    const titulo = document.getElementById('titulo_tabla_vencimientos');
    const busquedaVencimientos = document.getElementById('busqueda_vencimientos');
    const estadoVencimientos = document.getElementById('filtro_estado_vencimientos');
    const ordenVencimientos = document.getElementById('orden_vencimientos');
    const fechaDesdeVencimientos = document.getElementById('fecha_desde_vencimientos');
    const fechaHastaVencimientos = document.getElementById('fecha_hasta_vencimientos');
    const limpiarVencimientos = document.getElementById('limpiar_filtros_vencimientos');
    const pestañas = Array.from(document.querySelectorAll('.pestana_vencimientos'));
    const modalEditar = document.getElementById('modal_editar_vencimiento');
    const fechaEditar = document.getElementById('fecha_editar_vencimiento');
    const descripcionEditar = document.getElementById('descripcion_modal_editar_vencimiento');
    const mensajeEditar = document.getElementById('mensaje_modal_editar_vencimiento');
    const botonGuardarEditar = document.getElementById('guardar_editar_vencimiento');
    const modalBaja = document.getElementById('modal_baja_lote_vencimiento');
    const descripcionBaja = document.getElementById('descripcion_modal_baja_lote_vencimiento');
    const avisoBaja = document.getElementById('aviso_modal_baja_lote_vencimiento');
    const estadoBaja = document.getElementById('estado_baja_lote_vencimiento');
    const campoCantidadMerma = document.getElementById('campo_cantidad_merma_lote');
    const cantidadMermaLote = document.getElementById('cantidad_merma_lote_vencimiento');
    const opcionDescuentoMerma = document.getElementById('opcion_descuento_merma_lote');
    const descontarStockMerma = document.getElementById('descontar_stock_merma_lote');
    const motivoBaja = document.getElementById('motivo_baja_lote_vencimiento');
    const mensajeBaja = document.getElementById('mensaje_modal_baja_lote_vencimiento');
    const botonConfirmarBaja = document.getElementById('confirmar_baja_lote_vencimiento');
    if (!filasStock || !filas) return;

    const filasPorPagina = 10;
    let alertasStock = [];
    let paginaStock = 1;
    let totalPaginasStock = 1;
    let estadoActual = 'activos';
    let paginaActual = 1;
    let totalPaginas = 1;
    let idLoteEditado = null;
    let idLoteBaja = null;
    let cantidadLoteDisponible = 0;
    let temporizadorBusquedaVencimientos = null;

    const normalizarTexto = texto => String(texto || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

    // Sustituye el desplegable nativo por una lista situada debajo del campo.
    // Conserva el SELECT y los eventos change para no alterar las consultas actuales.
    const selectoresLotesPersonalizados = [];
    const cerrarSelectoresLotes = () => {
        selectoresLotesPersonalizados.forEach(({boton, panel}) => {
            panel.hidden = true;
            boton.setAttribute('aria-expanded', 'false');
        });
    };
    const configurarSelectorLotes = select => {
        if (!select || select.dataset.selectorVisualConfigurado === 'si') return;
        select.dataset.selectorVisualConfigurado = 'si';
        select.classList.add('selector_nativo_oculto_vencimientos');
        select.setAttribute('tabindex', '-1');
        select.setAttribute('aria-hidden', 'true');

        const id = select.id;
        const etiqueta = select.closest('.campo_filtro_alertas')?.querySelector('label');
        const contenedor = document.createElement('div');
        contenedor.className = 'selector_visual_vencimientos';
        const boton = document.createElement('button');
        boton.id = `boton_visual_${id}`;
        boton.className = 'boton_selector_visual_vencimientos';
        boton.type = 'button';
        boton.setAttribute('aria-haspopup', 'listbox');
        boton.setAttribute('aria-expanded', 'false');
        const panel = document.createElement('div');
        panel.id = `panel_visual_${id}`;
        panel.className = 'panel_selector_visual_vencimientos';
        panel.setAttribute('role', 'listbox');
        panel.hidden = true;
        boton.setAttribute('aria-controls', panel.id);
        if (etiqueta) {
            etiqueta.setAttribute('for', boton.id);
            etiqueta.id = etiqueta.id || `etiqueta_${id}`;
            boton.setAttribute('aria-labelledby', etiqueta.id);
        }
        const texto = document.createElement('span');
        texto.className = 'texto_selector_visual_vencimientos';
        const flecha = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        flecha.setAttribute('viewBox', '0 0 24 24');
        flecha.setAttribute('fill', 'none');
        flecha.setAttribute('stroke', 'currentColor');
        flecha.setAttribute('stroke-width', '2');
        flecha.setAttribute('stroke-linecap', 'round');
        flecha.setAttribute('stroke-linejoin', 'round');
        flecha.setAttribute('aria-hidden', 'true');
        const trazo = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        trazo.setAttribute('d', 'm6 9 6 6 6-6');
        flecha.appendChild(trazo);
        boton.append(texto, flecha);
        contenedor.append(boton, panel);
        select.after(contenedor);

        const actualizar = () => {
            texto.textContent = select.selectedOptions[0]?.textContent || 'Seleccionar';
            panel.replaceChildren();
            Array.from(select.options).forEach(opcion => {
                if (opcion.hidden) return;
                const item = document.createElement('button');
                item.type = 'button';
                item.className = 'opcion_selector_visual_vencimientos';
                item.setAttribute('role', 'option');
                item.setAttribute('aria-selected', String(opcion.value === select.value));
                item.textContent = opcion.textContent;
                item.addEventListener('click', () => {
                    select.value = opcion.value;
                    select.dispatchEvent(new Event('change', {bubbles: true}));
                    cerrarSelectoresLotes();
                    boton.focus();
                });
                panel.appendChild(item);
            });
        };
        const abrir = () => {
            const estabaAbierto = !panel.hidden;
            cerrarSelectoresLotes();
            if (estabaAbierto) return;
            actualizar();
            // Menú de altura limitada, siempre anclado por debajo del control.
            panel.style.maxHeight = `${Math.min(245, Math.max(140, window.innerHeight - boton.getBoundingClientRect().bottom - 14))}px`;
            panel.hidden = false;
            boton.setAttribute('aria-expanded', 'true');
        };
        boton.addEventListener('click', abrir);
        boton.addEventListener('keydown', evento => {
            if (evento.key === 'ArrowDown' || evento.key === 'ArrowUp') {
                evento.preventDefault();
                if (panel.hidden) abrir();
                const opciones = Array.from(panel.querySelectorAll('[role="option"]'));
                (evento.key === 'ArrowDown' ? opciones[0] : opciones[opciones.length - 1])?.focus();
            } else if (evento.key === 'Escape') {
                cerrarSelectoresLotes();
            }
        });
        panel.addEventListener('keydown', evento => {
            const opciones = Array.from(panel.querySelectorAll('[role="option"]'));
            const posicion = opciones.indexOf(document.activeElement);
            let siguiente = posicion;
            if (evento.key === 'ArrowDown') siguiente = Math.min(opciones.length - 1, posicion + 1);
            else if (evento.key === 'ArrowUp') siguiente = Math.max(0, posicion - 1);
            else if (evento.key === 'Home') siguiente = 0;
            else if (evento.key === 'End') siguiente = opciones.length - 1;
            else if (evento.key === 'Escape') {
                evento.preventDefault();
                cerrarSelectoresLotes();
                boton.focus();
                return;
            } else return;
            evento.preventDefault();
            opciones[siguiente]?.focus();
        });
        select.addEventListener('change', actualizar);
        selectoresLotesPersonalizados.push({boton, panel, actualizar});
        actualizar();
    };
    const actualizarSelectoresLotes = () => selectoresLotesPersonalizados.forEach(item => item.actualizar());
    [estadoVencimientos, ordenVencimientos].forEach(configurarSelectorLotes);
    document.addEventListener('click', evento => {
        if (!evento.target.closest('.selector_visual_vencimientos')) cerrarSelectoresLotes();
    });


    const fechaLocalHoy = () => {
        const hoy = new Date();
        hoy.setMinutes(hoy.getMinutes() - hoy.getTimezoneOffset());
        return hoy.toISOString().slice(0, 10);
    };

    // Días calendario hasta el vencimiento (fecha local, sin desfases por zona horaria).
    const diasHastaVencimientoLote = fecha => {
        const fechaLote = String(fecha || '').slice(0, 10);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaLote)) return null;
        const convertirUTC = valor => {
            const [anio, mes, dia] = valor.split('-').map(Number);
            return Date.UTC(anio, mes - 1, dia);
        };
        const distancia = (convertirUTC(fechaLote) - convertirUTC(fechaLocalHoy())) / 86400000;
        return Number.isFinite(distancia) ? Math.round(distancia) : null;
    };

    const cerrarModalEditar = () => {
        modalEditar.hidden = true;
        modalEditar.setAttribute('aria-hidden', 'true');
        idLoteEditado = null;
        mensajeEditar.textContent = '';
        botonGuardarEditar.disabled = false;
    };

    const abrirModalEditar = lote => {
        idLoteEditado = Number(lote.id_lote);
        descripcionEditar.textContent = `${lote.producto || 'Producto'} · Código ${lote.codigo || '—'}`;
        fechaEditar.min = fechaLocalHoy();
        fechaEditar.value = String(lote.fecha_vencimiento || '').slice(0, 10);
        mensajeEditar.textContent = '';
        modalEditar.hidden = false;
        modalEditar.setAttribute('aria-hidden', 'false');
        fechaEditar.focus();
    };

    const guardarFechaEditar = async () => {
        const fecha = fechaEditar.value;
        if (!idLoteEditado || !fecha || fecha < fechaLocalHoy()) {
            mensajeEditar.textContent = 'El vencimiento debe ser hoy o una fecha futura.';
            fechaEditar.focus();
            return;
        }

        botonGuardarEditar.disabled = true;
        mensajeEditar.textContent = 'Guardando fecha…';
        try {
            const respuesta = await fetchConCsrf(
                `${URL_API}/api/alertas/vencimientos/${idLoteEditado}/fecha`,
                {
                    method: 'PATCH',
                    credentials: 'include',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({fecha_vencimiento: fecha})
                }
            );
            const datos = await respuesta.json();
            if (!respuesta.ok) throw new Error(datos.mensaje || 'No se pudo actualizar el vencimiento.');

            cerrarModalEditar();
            await cargarLotes();
            if (typeof mostrarAlertaSuperior === 'function') {
                mostrarAlertaSuperior('Fecha de vencimiento actualizada.');
            }
        } catch (error) {
            mensajeEditar.textContent = error.message || 'No se pudo actualizar el vencimiento.';
            botonGuardarEditar.disabled = false;
        }
    };

    const cerrarModalBaja = () => {
        modalBaja.hidden = true;
        modalBaja.setAttribute('aria-hidden', 'true');
        idLoteBaja = null;
        cantidadLoteDisponible = 0;
        estadoBaja.value = '';
        campoCantidadMerma.hidden = true;
        cantidadMermaLote.value = '';
        opcionDescuentoMerma.hidden = true;
        descontarStockMerma.checked = false;
        motivoBaja.value = '';
        mensajeBaja.textContent = '';
        botonConfirmarBaja.disabled = false;
    };

    const actualizarAvisoBaja = () => {
        if (estadoBaja.value === 'MERMA') {
            avisoBaja.textContent = descontarStockMerma.checked
                ? 'Se registrará la merma y se descontará del stock general si tiene unidades suficientes. Una merma parcial conserva el resto del lote.'
                : 'Se reducirá la cantidad disponible del lote, pero el stock general no cambiará. Verifica que la pérdida no haya sido descontada previamente.';
        } else {
            avisoBaja.textContent = 'El lote pasará a Inactivos, sin modificar el stock general. Si hubo una salida física, debe quedar registrada en Inventario.';
        }
    };

    const abrirModalBaja = lote => {
        idLoteBaja = Number(lote.id_lote);
        cantidadLoteDisponible = Number(lote.cantidad || 0);
        const unidadLote = String(lote.familia || '').trim().toLowerCase() === 'balanza' ? ' (KG)' : '';
        descripcionBaja.textContent = `${lote.producto || 'Producto'} · Código ${lote.codigo || '—'} · Cantidad disponible: ${Number(lote.cantidad || 0).toLocaleString('es-CL', {maximumFractionDigits: 4})}${unidadLote}`;
        estadoBaja.value = '';
        cantidadMermaLote.value = String(Number(lote.cantidad || 0));
        campoCantidadMerma.hidden = true;
        descontarStockMerma.checked = false;
        opcionDescuentoMerma.hidden = true;
        botonConfirmarBaja.textContent = 'Confirmar baja';
        motivoBaja.value = '';
        mensajeBaja.textContent = '';
        actualizarAvisoBaja();
        modalBaja.hidden = false;
        modalBaja.setAttribute('aria-hidden', 'false');
        estadoBaja.focus();
    };

    const confirmarBajaLote = async () => {
        const motivo = motivoBaja.value.trim();
        const descontarStock = estadoBaja.value === 'MERMA' && descontarStockMerma.checked;
        const textoCantidadMerma = cantidadMermaLote.value.trim();
        const esMerma = estadoBaja.value === 'MERMA';
        const cantidadMerma = esMerma && /^[0-9]{1,4}([.,][0-9]{1,4})?$/.test(textoCantidadMerma)
            ? Number(textoCantidadMerma.replace(',', '.'))
            : NaN;
        if (!idLoteBaja || !estadoBaja.value || !motivo || motivo.length > 255 ||
            (esMerma && (!Number.isFinite(cantidadMerma) || cantidadMerma <= 0 || cantidadMerma > cantidadLoteDisponible))) {
            mensajeBaja.textContent = esMerma
                ? 'Indica una cantidad perdida válida que no supere el lote (hasta 4 dígitos enteros y 4 decimales) y un motivo.'
                : 'Selecciona el estado y escribe un motivo breve para archivar el lote.';
            if (!estadoBaja.value) estadoBaja.focus();
            else if (esMerma && (!Number.isFinite(cantidadMerma) || cantidadMerma <= 0 || cantidadMerma > cantidadLoteDisponible)) cantidadMermaLote.focus();
            else motivoBaja.focus();
            return;
        }

        botonConfirmarBaja.disabled = true;
        mensajeBaja.textContent = 'Archivando lote…';
        try {
            const respuesta = await fetchConCsrf(
                `${URL_API}/api/alertas/vencimientos/${idLoteBaja}/baja`,
                {
                    method: 'PATCH',
                    credentials: 'include',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        estado_baja: estadoBaja.value,
                        motivo_baja: motivo,
                        descontar_stock: descontarStock,
                        cantidad_merma: esMerma ? cantidadMerma : null
                    })
                }
            );
            const datos = await respuesta.json();
            if (!respuesta.ok) throw new Error(datos.mensaje || 'No se pudo archivar el lote.');

            cerrarModalBaja();
            await cargarLotes();
            if (typeof mostrarAlertaSuperior === 'function') {
                mostrarAlertaSuperior(datos.mensaje || 'Lote archivado en Inactivos.');
            }
        } catch (error) {
            mensajeBaja.textContent = error.message || 'No se pudo archivar el lote.';
            botonConfirmarBaja.disabled = false;
        }
    };

    const formatearCantidad = (valor, familia) => {
        const cantidad = Number(valor || 0).toLocaleString('es-CL', {maximumFractionDigits: 4});
        return String(familia || '').trim().toLowerCase() === 'balanza' ? `${cantidad} (KG)` : cantidad;
    };

    const formatearFecha = (valor, incluirHora = false) => {
        if (!valor) return '—';
        if (!incluirHora && /^\d{4}-\d{2}-\d{2}/.test(String(valor))) {
            const [anio, mes, dia] = String(valor).slice(0, 10).split('-').map(Number);
            return new Date(anio, mes - 1, dia).toLocaleDateString('es-CL');
        }
        const fecha = new Date(valor);
        return Number.isNaN(fecha.getTime()) ? '—' : fecha.toLocaleString('es-CL', incluirHora ? {} : {dateStyle: 'short'});
    };

    const configurarDivInteractivo = (elemento, accion, deshabilitado = () => false) => {
        elemento.addEventListener('click', evento => {
            if (!deshabilitado()) accion(evento);
        });
        elemento.addEventListener('keydown', evento => {
            if (evento.key !== 'Enter' && evento.key !== ' ') return;
            evento.preventDefault();
            if (!deshabilitado()) accion(evento);
        });
    };

    const actualizarEstadoControl = (elemento, deshabilitado) => {
        elemento.setAttribute('aria-disabled', String(deshabilitado));
        elemento.setAttribute('tabindex', deshabilitado ? '-1' : '0');
    };

    const renderizarNumeros = (contenedor, pagina, total, seleccionar) => {
        contenedor.replaceChildren();
        const paginas = new Set([1, total]);
        for (let numero = Math.max(1, pagina - 2); numero <= Math.min(total, pagina + 2); numero++) paginas.add(numero);
        let anterior = 0;
        [...paginas].sort((a, b) => a - b).forEach(numero => {
            if (numero - anterior > 1) {
                const puntos = document.createElement('div');
                puntos.className = 'puntos_paginas_vencimientos';
                puntos.setAttribute('aria-label', 'Páginas intermedias');
                for (let i = 0; i < 3; i++) {
                    const punto = document.createElement('span');
                    punto.className = 'punto_paginacion_vencimientos';
                    puntos.appendChild(punto);
                }
                contenedor.appendChild(puntos);
            }
            const control = document.createElement('div');
            control.className = `boton_numero_pagina_vencimientos${numero === pagina ? ' pagina_actual_vencimientos' : ''}`;
            control.setAttribute('role', 'button');
            control.setAttribute('tabindex', '0');
            control.setAttribute('aria-label', `Ir a la página ${numero}`);
            if (numero === pagina) control.setAttribute('aria-current', 'page');
            control.textContent = String(numero);
            configurarDivInteractivo(control, () => seleccionar(numero));
            contenedor.appendChild(control);
            anterior = numero;
        });
    };

    const mostrarMensajeTabla = (cuerpo, texto) => {
        cuerpo.replaceChildren();
        const fila = document.createElement('div');
        fila.className = 'fila_vencimiento fila_mensaje_vencimiento';
        fila.setAttribute('role', 'row');
        const celda = document.createElement('div');
        celda.className = 'mensaje_tabla_vencimientos';
        celda.setAttribute('role', 'cell');
        celda.textContent = texto;
        fila.appendChild(celda);
        cuerpo.appendChild(fila);
    };

    const crearFila = (valores, claseFila, estadoClase, acciones = null, indiceEstado = valores.length - 1) => {
        const fila = document.createElement('div');
        fila.className = `fila_vencimiento ${claseFila}`;
        fila.setAttribute('role', 'row');
        const etiquetas = claseFila === 'fila_stock_alertas'
            ? ['Producto', 'Código', 'Familia', 'Stock actual', 'Stock mínimo', 'Estado']
            : ['Producto', 'Código', estadoActual === 'activos' ? 'Cantidad disponible' : 'Cantidad original',
                'Cantidad afectada', 'Fecha de ingreso', 'Fecha de vencimiento', 'Estado', 'Motivo'];
        valores.forEach((valor, indice) => {
            const celda = document.createElement('div');
            celda.setAttribute('role', 'cell');
            celda.dataset.etiqueta = etiquetas[indice] || '';
            if (indice === indiceEstado && estadoClase) {
                const etiqueta = document.createElement('div');
                etiqueta.className = `etiqueta_estado_vencimiento ${estadoClase}`;
                etiqueta.textContent = String(valor);
                celda.appendChild(etiqueta);
            } else {
                celda.textContent = String(valor);
            }
            fila.appendChild(celda);
        });
        if (acciones) {
            const celdaAccion = document.createElement('div');
            celdaAccion.className = 'acciones_lote_vencimiento';
            celdaAccion.setAttribute('role', 'cell');
            celdaAccion.dataset.etiqueta = 'Acciones';
            (Array.isArray(acciones) ? acciones : [acciones]).forEach(accion => celdaAccion.appendChild(accion));
            fila.appendChild(celdaAccion);
        }
        return fila;
    };

    const renderizarStock = () => {
        filasStock.replaceChildren();
        const busqueda = normalizarTexto(busquedaStock.value);
        const estadoSeleccionado = estadoStock.value;
        const familiaSeleccionada = familiaStock.value;
        const actividadSeleccionada = actividadStock.value;
        const alertasFiltradas = alertasStock.filter(producto => {
            const textoProducto = normalizarTexto(`${producto.descripcion || ''} ${producto.codigo || ''}`);
            return (!busqueda || textoProducto.includes(busqueda)) &&
                (!estadoSeleccionado || producto.estado === estadoSeleccionado) &&
                (!familiaSeleccionada || String(producto.familia || '') === familiaSeleccionada) &&
                (actividadSeleccionada === 'TODOS' || producto.actividad_comercial === actividadSeleccionada);
        });
        totalPaginasStock = Math.max(1, Math.ceil(alertasFiltradas.length / filasPorPagina));
        paginaStock = Math.min(paginaStock, totalPaginasStock);
        if (!alertasFiltradas.length) {
            const mensaje = alertasStock.length
                ? 'Ningún producto coincide con los filtros.'
                : 'No hay productos con alertas de stock.';
            mostrarMensajeTabla(filasStock, mensaje);
            informacionStock.textContent = 'Mostrando 0 productos';
            actualizarEstadoControl(anteriorStock, true);
            actualizarEstadoControl(siguienteStock, true);
            numerosStock.replaceChildren();
            return;
        }

        const inicio = (paginaStock - 1) * filasPorPagina;
        const paginaProductos = alertasFiltradas.slice(inicio, inicio + filasPorPagina);
        paginaProductos.forEach(producto => {
            const valores = [
                producto.descripcion || '—',
                producto.codigo || '—',
                producto.familia || '—',
                formatearCantidad(producto.stock_actual, producto.familia),
                producto.stock_minimo_calculable ? formatearCantidad(producto.stock_minimo, producto.familia) : '—',
                producto.estado || '—'
            ];
            const clase = producto.estado === 'STOCK BAJO' ? 'estado_alerta_stock_bajo' : 'estado_alerta_sin_stock';
            filasStock.appendChild(crearFila(valores, 'fila_stock_alertas', clase));
        });

        const fin = Math.min(paginaStock * filasPorPagina, alertasFiltradas.length);
        informacionStock.textContent = `Mostrando ${inicio + 1} a ${fin} de ${alertasFiltradas.length} productos`;
        actualizarEstadoControl(anteriorStock, paginaStock <= 1);
        actualizarEstadoControl(siguienteStock, paginaStock >= totalPaginasStock);
        renderizarNumeros(numerosStock, paginaStock, totalPaginasStock, pagina => {
            paginaStock = pagina;
            renderizarStock();
        });
    };

    const cargarAlertasStock = async () => {
        try {
            const respuesta = await fetchConCsrf(`${URL_API}/api/inventario`, {method: 'GET', credentials: 'include'});
            const productos = await respuesta.json();
            if (!respuesta.ok) throw new Error(productos.mensaje || 'No se pudieron cargar las alertas de inventario.');
            const prioridad = {'STOCK NEGATIVO': 0, 'SIN STOCK': 1, 'STOCK BAJO': 2};
            alertasStock = (Array.isArray(productos) ? productos : [])
                .filter(producto => Object.prototype.hasOwnProperty.call(prioridad, producto.estado))
                .sort((a, b) => prioridad[a.estado] - prioridad[b.estado] || String(a.descripcion).localeCompare(String(b.descripcion), 'es'));
            const familiaActual = familiaStock.value;
            familiaStock.replaceChildren(new Option('Todas las familias', ''));
            [...new Set(alertasStock.map(producto => String(producto.familia || '').trim()).filter(Boolean))]
                .sort((a, b) => a.localeCompare(b, 'es'))
                .forEach(familia => familiaStock.add(new Option(familia, familia)));
            familiaStock.value = familiaActual;
            document.getElementById('resumen_alertas_stock').textContent = alertasStock.length.toLocaleString('es-CL');
            renderizarStock();
        } catch (error) {
            mostrarMensajeTabla(filasStock, error.message || 'No se pudieron cargar las alertas de inventario.');
            informacionStock.textContent = 'No se pudo cargar la paginación';
            numerosStock.replaceChildren();
        }
    };

    const renderizarPaginasVencimientos = () => {
        renderizarNumeros(numeros, paginaActual, totalPaginas, pagina => {
            paginaActual = pagina;
            cargarLotes();
        });
    };

    const cargarLotes = async () => {
        const tablaLotes = document.querySelector('.tabla_lotes_vencimiento');
        const motivoEncabezado = document.getElementById('encabezado_motivo_lote_vencimiento');
        const cantidadEncabezado = document.getElementById('encabezado_cantidad_lote_vencimiento');
        if (tablaLotes) tablaLotes.dataset.modo = estadoActual;
        if (motivoEncabezado) motivoEncabezado.hidden = estadoActual !== 'inactivos';
        if (cantidadEncabezado) cantidadEncabezado.textContent = estadoActual === 'activos' ? 'Disponible' : 'Cantidad original';
        filas.replaceChildren();
        mostrarMensajeTabla(filas, 'Cargando vencimientos…');
        try {
            const parametros = new URLSearchParams({estado: estadoActual, pagina: String(paginaActual)});
            if (busquedaVencimientos.value.trim()) parametros.set('busqueda', busquedaVencimientos.value.trim());
            if (estadoVencimientos.value) parametros.set('filtro_estado', estadoVencimientos.value);
            parametros.set('orden', ordenVencimientos.value);
            if (fechaDesdeVencimientos.value) parametros.set('fecha_desde', fechaDesdeVencimientos.value);
            if (fechaHastaVencimientos.value) parametros.set('fecha_hasta', fechaHastaVencimientos.value);
            const respuesta = await fetchConCsrf(`${URL_API}/api/alertas/vencimientos?${parametros}`, {method: 'GET', credentials: 'include'});
            const datos = await respuesta.json();
            if (!respuesta.ok) throw new Error(datos.mensaje || 'No se pudo cargar el listado de vencimientos.');

            document.getElementById('contador_lotes_activos').textContent = Number(datos.resumen?.activos || 0).toLocaleString('es-CL');
            document.getElementById('contador_lotes_inactivos').textContent = Number(datos.resumen?.inactivos || 0).toLocaleString('es-CL');
            document.getElementById('resumen_lotes_activos').textContent = Number(datos.resumen?.activos || 0).toLocaleString('es-CL');
            document.getElementById('resumen_lotes_criticos').textContent = Number(datos.resumen?.criticos || 0).toLocaleString('es-CL');
            const lotes = Array.isArray(datos.lotes) ? datos.lotes : [];
            const paginacion = datos.paginacion || {};
            paginaActual = Number(paginacion.pagina_actual) || 1;
            totalPaginas = Number(paginacion.total_paginas) || 1;
            filas.replaceChildren();

            if (!lotes.length) {
                mostrarMensajeTabla(filas, estadoActual === 'activos' ? 'No hay lotes activos.' : 'No hay lotes inactivos.');
            } else {
                lotes.forEach(lote => {
                    const esInactivo = estadoActual === 'inactivos';
                    const esBalanza = String(lote.familia || '').trim().toLowerCase() === 'balanza';
                    const cantidadDisponible = formatearCantidad(lote.cantidad, lote.familia);
                    const cantidadOriginal = formatearCantidad(lote.cantidad_original ?? lote.cantidad, lote.familia);
                    const cantidadAfectada = Number(lote.cantidad_afectada || 0);
                    const fechaIngreso = formatearFecha(lote.fecha_ingreso, true);
                    const fechaVencimiento = formatearFecha(lote.fecha_vencimiento);
                    const clase = esInactivo
                        ? lote.estado === 'VENDIDO' ? 'estado_lote_vendido'
                            : lote.estado === 'VENCIDO' ? 'estado_lote_inactivo' : 'estado_lote_riesgo'
                        : lote.estado === 'VENCIDO' || lote.estado === 'AGOTADO' ? 'estado_lote_inactivo'
                            : lote.estado === 'VENCIMIENTO CRÍTICO' ? 'estado_lote_critico'
                                : lote.estado === 'VENCIMIENTO EN RIESGO' ? 'estado_lote_riesgo'
                                    : lote.estado === 'PRÓXIMO A VENCER' ? 'estado_lote_proximo' : 'estado_lote_vigente';

                    const fila = document.createElement('div');
                    fila.className = 'fila_vencimiento fila_lotes_vencimiento';
                    fila.setAttribute('role', 'row');

                    // Crea celdas en el mismo orden que el encabezado, evitando columnas sobrantes.
                    const celda = (etiqueta, claseCelda = '') => {
                        const elemento = document.createElement('div');
                        elemento.setAttribute('role', 'cell');
                        elemento.dataset.etiqueta = etiqueta;
                        if (claseCelda) elemento.className = claseCelda;
                        fila.appendChild(elemento);
                        return elemento;
                    };
                    const texto = (padre, contenido, claseTexto) => {
                        const elemento = document.createElement('div');
                        elemento.className = claseTexto;
                        elemento.textContent = contenido;
                        padre.appendChild(elemento);
                        return elemento;
                    };

                    const producto = celda('Producto', 'celda_producto_lote');
                    texto(producto, lote.producto || '—', 'nombre_producto_lote');
                    texto(producto, `Código: ${lote.codigo || '—'}`, 'dato_secundario_lote');
                    if (lote.fecha_ingreso) texto(producto, `Ingreso: ${fechaIngreso}`, 'dato_secundario_lote');

                    const cantidad = celda(esInactivo ? 'Cantidad original' : 'Disponible');
                    texto(cantidad, esInactivo ? cantidadOriginal : cantidadDisponible, 'dato_principal_lote');
                    if (cantidadAfectada > 0) {
                        texto(cantidad, `Afectada: ${formatearCantidad(cantidadAfectada, lote.familia)}`, 'dato_secundario_lote');
                    }

                    const vencimiento = celda('Vencimiento');
                    texto(vencimiento, fechaVencimiento, 'dato_principal_lote');
                    if (lote.fecha_vencimiento) {
                        const dias = diasHastaVencimientoLote(lote.fecha_vencimiento);
                        if (dias !== null) {
                            const detalleDias = dias < 0 ? `Venció hace ${-dias} día${dias === -1 ? '' : 's'}`
                                : dias === 0 ? 'Vence hoy'
                                : `En ${dias} día${dias === 1 ? '' : 's'}`;
                            texto(vencimiento, detalleDias, 'dato_secundario_lote');
                        }
                    }

                    const estadoCelda = celda('Estado');
                    const etiqueta = document.createElement('span');
                    etiqueta.className = `etiqueta_estado_vencimiento ${clase}`;
                    etiqueta.textContent = lote.estado || '—';
                    estadoCelda.appendChild(etiqueta);
                    const ayudaEstado = {
                        'VENCIMIENTO CRÍTICO': 'Vence dentro de 5 días o menos.',
                        'VENCIMIENTO EN RIESGO': 'Vence entre 6 y 10 días.',
                        'PRÓXIMO A VENCER': 'Vence entre 11 y 30 días.',
                        'VIGENTE': 'Vence en más de 30 días.',
                        'VENCIDO': 'El lote superó su fecha de vencimiento.'
                    };
                    if (ayudaEstado[lote.estado]) etiqueta.title = ayudaEstado[lote.estado];

                    if (esInactivo) {
                        const motivo = celda('Motivo de baja');
                        texto(motivo, lote.motivo_baja || 'Sin detalle', 'dato_motivo_lote');
                        if (lote.fecha_baja) texto(motivo, `Baja: ${formatearFecha(lote.fecha_baja, true)}`, 'dato_secundario_lote');
                    }

                    const acciones = celda('Acciones', 'acciones_lote_vencimiento');
                    const botonEditar = document.createElement('button');
                    botonEditar.className = 'boton_editar_vencimiento';
                    botonEditar.type = 'button';
                    botonEditar.title = 'Editar fecha de vencimiento';
                    botonEditar.setAttribute('aria-label', `Editar fecha de vencimiento de ${lote.producto || lote.codigo}`);
                    botonEditar.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L9 17l-4 1 1-4Z"/></svg>';
                    botonEditar.addEventListener('click', () => abrirModalEditar(lote));
                    acciones.appendChild(botonEditar);

                    if (lote.activo !== false) {
                        const botonBaja = document.createElement('button');
                        botonBaja.className = 'boton_baja_lote_vencimiento';
                        botonBaja.type = 'button';
                        botonBaja.title = 'Dar de baja el lote (archivar)';
                        botonBaja.setAttribute('aria-label', `Dar de baja el lote de ${lote.producto || lote.codigo}`);
                        botonBaja.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="3" width="20" height="4" rx="1"/><path d="M4 7v13a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V7"/><path d="M10 12h4"/></svg>';
                        botonBaja.addEventListener('click', () => abrirModalBaja(lote));
                        acciones.appendChild(botonBaja);
                    }
                    filas.appendChild(fila);
                });
            }

            const total = Number(paginacion.total_lotes || 0);
            const limite = Number(paginacion.limite || 15);
            const inicio = total ? (paginaActual - 1) * limite + 1 : 0;
            const fin = Math.min(paginaActual * limite, total);
            informacion.textContent = `Mostrando ${inicio} a ${fin} de ${total} lotes`;
            totalPaginas = Math.max(1, totalPaginas);
            actualizarEstadoControl(botonAnterior, paginaActual <= 1);
            actualizarEstadoControl(botonSiguiente, paginaActual >= totalPaginas);
            renderizarPaginasVencimientos();
        } catch (error) {
            mostrarMensajeTabla(filas, error.message || 'No se pudo cargar el listado de vencimientos.');
            informacion.textContent = 'No se pudo cargar la paginación';
            numeros.replaceChildren();
        }
    };

    const cambiarPestana = pestaña => {
        estadoActual = pestaña.dataset.estado;
        paginaActual = 1;
        estadoVencimientos.value = '';
        cerrarSelectoresLotes();
        actualizarSelectoresLotes();
        pestañas.forEach(opcion => {
            const activa = opcion === pestaña;
            opcion.classList.toggle('pestana_vencimientos_activa', activa);
            opcion.setAttribute('aria-selected', String(activa));
            opcion.setAttribute('tabindex', activa ? '0' : '-1');
        });
        titulo.textContent = estadoActual === 'activos' ? 'Lotes activos' : 'Lotes inactivos';
        cargarLotes();
    };

    const aplicarFiltrosStock = () => {
        paginaStock = 1;
        renderizarStock();
    };

    busquedaStock.addEventListener('input', aplicarFiltrosStock);
    estadoStock.addEventListener('change', aplicarFiltrosStock);
    familiaStock.addEventListener('change', aplicarFiltrosStock);
    actividadStock.addEventListener('change', aplicarFiltrosStock);
    limpiarStock.addEventListener('click', () => {
        busquedaStock.value = '';
        estadoStock.value = '';
        familiaStock.value = '';
        actividadStock.value = 'RECIENTES';
        aplicarFiltrosStock();
    });

    const aplicarFiltrosVencimientos = () => {
        paginaActual = 1;
        cargarLotes();
    };
    const buscarVencimientosConPausa = () => {
        clearTimeout(temporizadorBusquedaVencimientos);
        temporizadorBusquedaVencimientos = setTimeout(aplicarFiltrosVencimientos, 250);
    };
    busquedaVencimientos.addEventListener('input', buscarVencimientosConPausa);
    estadoVencimientos.addEventListener('change', aplicarFiltrosVencimientos);
    ordenVencimientos.addEventListener('change', aplicarFiltrosVencimientos);
    fechaDesdeVencimientos.addEventListener('change', aplicarFiltrosVencimientos);
    fechaHastaVencimientos.addEventListener('change', aplicarFiltrosVencimientos);
    limpiarVencimientos.addEventListener('click', () => {
        clearTimeout(temporizadorBusquedaVencimientos);
        busquedaVencimientos.value = '';
        estadoVencimientos.value = '';
        ordenVencimientos.value = 'asc';
        fechaDesdeVencimientos.value = '';
        fechaHastaVencimientos.value = '';
        cerrarSelectoresLotes();
        actualizarSelectoresLotes();
        aplicarFiltrosVencimientos();
    });

    pestañas.forEach(pestaña => {
        configurarDivInteractivo(pestaña, () => cambiarPestana(pestaña));
    });

    document.getElementById('cerrar_modal_editar_vencimiento').onclick = cerrarModalEditar;
    document.getElementById('cancelar_editar_vencimiento').onclick = cerrarModalEditar;
    botonGuardarEditar.onclick = guardarFechaEditar;
    document.getElementById('cerrar_modal_baja_lote_vencimiento').onclick = cerrarModalBaja;
    document.getElementById('cancelar_baja_lote_vencimiento').onclick = cerrarModalBaja;
    botonConfirmarBaja.onclick = confirmarBajaLote;
    estadoBaja.onchange = () => {
        const esMerma = estadoBaja.value === 'MERMA';
        campoCantidadMerma.hidden = !esMerma;
        opcionDescuentoMerma.hidden = !esMerma;
        botonConfirmarBaja.textContent = esMerma ? 'Registrar merma' : 'Confirmar baja';
        if (!esMerma) descontarStockMerma.checked = false;
        actualizarAvisoBaja();
    };
    descontarStockMerma.addEventListener('change', actualizarAvisoBaja);

    configurarDivInteractivo(anteriorStock, () => {
        if (paginaStock > 1) {
            paginaStock--;
            renderizarStock();
        }
    }, () => anteriorStock.getAttribute('aria-disabled') === 'true');
    configurarDivInteractivo(siguienteStock, () => {
        if (paginaStock < totalPaginasStock) {
            paginaStock++;
            renderizarStock();
        }
    }, () => siguienteStock.getAttribute('aria-disabled') === 'true');
    configurarDivInteractivo(botonAnterior, () => {
        if (paginaActual > 1) {
            paginaActual--;
            cargarLotes();
        }
    }, () => botonAnterior.getAttribute('aria-disabled') === 'true');
    configurarDivInteractivo(botonSiguiente, () => {
        if (paginaActual < totalPaginas) {
            paginaActual++;
            cargarLotes();
        }
    }, () => botonSiguiente.getAttribute('aria-disabled') === 'true');

    await Promise.all([cargarAlertasStock(), cargarLotes()]);
}
