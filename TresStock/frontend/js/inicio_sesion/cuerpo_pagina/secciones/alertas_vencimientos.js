// Inicializa las alertas de inventario y el listado paginado de vencimientos.
async function inicializarAlertasVencimientos() {
    const filasStock = document.getElementById('filas_alertas_inventario');
    const informacionStock = document.getElementById('informacion_alertas_inventario');
    const numerosStock = document.getElementById('numeros_alertas_inventario');
    const anteriorStock = document.getElementById('anterior_alertas_inventario');
    const siguienteStock = document.getElementById('siguiente_alertas_inventario');
    const filas = document.getElementById('filas_vencimientos');
    const informacion = document.getElementById('informacion_paginador_vencimientos');
    const numeros = document.getElementById('numeros_paginas_vencimientos');
    const botonAnterior = document.getElementById('anterior_vencimientos');
    const botonSiguiente = document.getElementById('siguiente_vencimientos');
    const titulo = document.getElementById('titulo_tabla_vencimientos');
    const pestañas = Array.from(document.querySelectorAll('.pestana_vencimientos'));
    const modalEditar = document.getElementById('modal_editar_vencimiento');
    const fechaEditar = document.getElementById('fecha_editar_vencimiento');
    const descripcionEditar = document.getElementById('descripcion_modal_editar_vencimiento');
    const mensajeEditar = document.getElementById('mensaje_modal_editar_vencimiento');
    const botonGuardarEditar = document.getElementById('guardar_editar_vencimiento');
    const modalBaja = document.getElementById('modal_baja_lote_vencimiento');
    const descripcionBaja = document.getElementById('descripcion_modal_baja_lote_vencimiento');
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

    const fechaLocalHoy = () => {
        const hoy = new Date();
        hoy.setMinutes(hoy.getMinutes() - hoy.getTimezoneOffset());
        return hoy.toISOString().slice(0, 10);
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
                puntos.textContent = '…';
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
        valores.forEach((valor, indice) => {
            const celda = document.createElement('div');
            celda.setAttribute('role', 'cell');
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
            (Array.isArray(acciones) ? acciones : [acciones]).forEach(accion => celdaAccion.appendChild(accion));
            fila.appendChild(celdaAccion);
        }
        return fila;
    };

    const renderizarStock = () => {
        filasStock.replaceChildren();
        if (!alertasStock.length) {
            mostrarMensajeTabla(filasStock, 'No hay productos con alertas de stock.');
            informacionStock.textContent = 'Mostrando 0 productos';
            actualizarEstadoControl(anteriorStock, true);
            actualizarEstadoControl(siguienteStock, true);
            numerosStock.replaceChildren();
            return;
        }

        const inicio = (paginaStock - 1) * filasPorPagina;
        const paginaProductos = alertasStock.slice(inicio, inicio + filasPorPagina);
        paginaProductos.forEach(producto => {
            const valores = [
                producto.descripcion || '—',
                producto.codigo || '—',
                producto.familia || '—',
                formatearCantidad(producto.stock_actual, producto.familia),
                producto.stock_minimo_calculable ? formatearCantidad(producto.stock_minimo, producto.familia) : '—',
                producto.estado || '—'
            ];
            const clase = producto.estado === 'STOCK NEGATIVO' ? 'estado_lote_inactivo' : 'estado_lote_proximo';
            filasStock.appendChild(crearFila(valores, 'fila_stock_alertas', clase));
        });

        const fin = Math.min(paginaStock * filasPorPagina, alertasStock.length);
        informacionStock.textContent = `Mostrando ${inicio + 1} a ${fin} de ${alertasStock.length} productos`;
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
            totalPaginasStock = Math.max(1, Math.ceil(alertasStock.length / filasPorPagina));
            paginaStock = Math.min(paginaStock, totalPaginasStock);
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
        filas.replaceChildren();
        mostrarMensajeTabla(filas, 'Cargando vencimientos…');
        try {
            const parametros = new URLSearchParams({estado: estadoActual, pagina: String(paginaActual)});
            const respuesta = await fetchConCsrf(`${URL_API}/api/alertas/vencimientos?${parametros}`, {method: 'GET', credentials: 'include'});
            const datos = await respuesta.json();
            if (!respuesta.ok) throw new Error(datos.mensaje || 'No se pudo cargar el listado de vencimientos.');

            document.getElementById('contador_lotes_activos').textContent = Number(datos.resumen?.activos || 0).toLocaleString('es-CL');
            document.getElementById('contador_lotes_inactivos').textContent = Number(datos.resumen?.inactivos || 0).toLocaleString('es-CL');
            const lotes = Array.isArray(datos.lotes) ? datos.lotes : [];
            const paginacion = datos.paginacion || {};
            paginaActual = Number(paginacion.pagina_actual) || 1;
            totalPaginas = Number(paginacion.total_paginas) || 1;
            filas.replaceChildren();

            if (!lotes.length) {
                mostrarMensajeTabla(filas, estadoActual === 'activos' ? 'No hay lotes activos.' : 'No hay lotes inactivos.');
            } else {
                lotes.forEach(lote => {
                    const cantidadOriginal = Number(lote.cantidad_original ?? lote.cantidad ?? 0).toLocaleString('es-CL', {maximumFractionDigits: 4});
                    const cantidadAfectadaNumero = Number(lote.cantidad_afectada || 0);
                    const cantidadAfectada = cantidadAfectadaNumero > 0 ? cantidadAfectadaNumero.toLocaleString('es-CL', {maximumFractionDigits: 4}) : '—';
                    const esBalanza = String(lote.familia || '').trim().toLowerCase() === 'balanza';
                    const cantidadOriginalConUnidad = esBalanza ? `${cantidadOriginal} (KG)` : cantidadOriginal;
                    const cantidadAfectadaConUnidad = cantidadAfectada !== '—' && esBalanza ? `${cantidadAfectada} (KG)` : cantidadAfectada;
                    const valores = [lote.producto || '—', lote.codigo || '—', cantidadOriginalConUnidad, cantidadAfectadaConUnidad, formatearFecha(lote.fecha_ingreso, true), formatearFecha(lote.fecha_vencimiento), lote.estado || '—', lote.motivo_baja || '—'];
                    const clase = estadoActual === 'inactivos'
                        ? lote.estado === 'VENCIDO' ? 'estado_lote_inactivo'
                            : lote.estado === 'VENDIDO' ? 'estado_lote_vendido' : 'estado_lote_riesgo'
                        : lote.estado === 'VENCIDO' || lote.estado === 'AGOTADO' ? 'estado_lote_inactivo'
                            : lote.estado === 'VENCIMIENTO CRÍTICO' ? 'estado_lote_critico'
                                : lote.estado === 'VENCIMIENTO EN RIESGO' ? 'estado_lote_riesgo'
                                    : lote.estado === 'PRÓXIMO A VENCER' ? 'estado_lote_proximo' : 'estado_lote_vigente';
                    const botonEditar = document.createElement('button');
                    botonEditar.className = 'boton_editar_vencimiento';
                    botonEditar.type = 'button';
                    botonEditar.textContent = 'Editar';
                    botonEditar.setAttribute('aria-label', `Editar fecha de vencimiento de ${lote.producto || lote.codigo}`);
                    botonEditar.addEventListener('click', () => abrirModalEditar(lote));
                    const acciones = [botonEditar];
                    if (lote.activo !== false) {
                        const botonBaja = document.createElement('button');
                        botonBaja.className = 'boton_baja_lote_vencimiento';
                        botonBaja.type = 'button';
                        botonBaja.textContent = 'Dar de baja';
                        botonBaja.title = 'Archivar el lote con un estado y motivo';
                        botonBaja.addEventListener('click', () => abrirModalBaja(lote));
                        acciones.push(botonBaja);
                    }
                    const fila = crearFila(valores, 'fila_lotes_vencimiento', clase, acciones, 6);
                    const etiquetaEstado = fila.children[6]?.querySelector('.etiqueta_estado_vencimiento');
                    const ayudaEstado = {
                        'VENCIMIENTO CRÍTICO': 'Vence dentro de 5 días o menos.',
                        'VENCIMIENTO EN RIESGO': 'Vence entre 6 y 10 días.',
                        'PRÓXIMO A VENCER': 'Vence en más de 10 días.'
                    };
                    if (etiquetaEstado && estadoActual === 'activos' && ayudaEstado[lote.estado]) {
                        etiquetaEstado.title = ayudaEstado[lote.estado];
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
        pestañas.forEach(opcion => {
            const activa = opcion === pestaña;
            opcion.classList.toggle('pestana_vencimientos_activa', activa);
            opcion.setAttribute('aria-selected', String(activa));
            opcion.setAttribute('tabindex', activa ? '0' : '-1');
        });
        titulo.textContent = estadoActual === 'activos' ? 'Lotes activos' : 'Lotes inactivos';
        cargarLotes();
    };

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
    };

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
