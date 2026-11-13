let productosPronosticoAnalisis = [];
let productosPronosticoFiltradosAnalisis = [];
let paginaPronosticoAnalisis = 1;
const productosPorPaginaAnalisis = 8;
let solicitudGraficoPronosticoAnalisis = 0;

async function inicializarAnalisisPronostico() {
    const busqueda = document.getElementById('buscar_producto_analisis_pronostico');
    const filtroPronostico = document.getElementById('filtro_pronostico_analisis');
    const botonFiltro = document.getElementById('boton_selector_pronostico_analisis');
    const panelFiltro = document.getElementById('panel_selector_pronostico_analisis');
    const anterior = document.getElementById('pagina_anterior_analisis_pronostico');
    const siguiente = document.getElementById('pagina_siguiente_analisis_pronostico');
    if (!busqueda || !anterior || !siguiente) return;

    busqueda.addEventListener('input', () => {
        paginaPronosticoAnalisis = 1;
        ocultarGraficoPronosticoAnalisis();
        filtrarProductosPronosticoAnalisis();
    });
    filtroPronostico?.addEventListener('change', () => {
        paginaPronosticoAnalisis = 1;
        ocultarGraficoPronosticoAnalisis();
        filtrarProductosPronosticoAnalisis();
        actualizarSelectorPronosticoAnalisis();
    });
    botonFiltro?.addEventListener('click', () => {
        const abrir = panelFiltro.hidden;
        panelFiltro.hidden = !abrir;
        botonFiltro.setAttribute('aria-expanded', String(abrir));
        if (abrir) actualizarSelectorPronosticoAnalisis();
    });
    document.addEventListener('click', evento => {
        if (!evento.target.closest('#contenedor_selector_pronostico_analisis')) {
            if (panelFiltro) panelFiltro.hidden = true;
            botonFiltro?.setAttribute('aria-expanded', 'false');
        }
    });
    actualizarSelectorPronosticoAnalisis();
    document.getElementById('cuerpo_tabla_analisis_pronostico')?.addEventListener('click', evento => {
        const fila = evento.target.closest('.fila_analisis_pronostico');
        if (!fila) return;
        seleccionarProductoPronosticoAnalisis(fila.dataset.codigo, fila.dataset.descripcion);
    });
    document.getElementById('cuerpo_tabla_analisis_pronostico')?.addEventListener('keydown', evento => {
        if (!['Enter', ' '].includes(evento.key)) return;
        const fila = evento.target.closest('.fila_analisis_pronostico');
        if (!fila) return;
        evento.preventDefault();
        seleccionarProductoPronosticoAnalisis(fila.dataset.codigo, fila.dataset.descripcion);
    });
    anterior.addEventListener('click', () => cambiarPaginaPronosticoAnalisis(paginaPronosticoAnalisis - 1));
    siguiente.addEventListener('click', () => cambiarPaginaPronosticoAnalisis(paginaPronosticoAnalisis + 1));
    await cargarProductosPronosticoAnalisis();
}

async function cargarProductosPronosticoAnalisis() {
    const cuerpo = document.getElementById('cuerpo_tabla_analisis_pronostico');
    if (!cuerpo) return;
    cuerpo.innerHTML = '<div class="fila_vacia_analisis_pronostico" role="row"><div role="cell">Cargando pronósticos...</div></div>';

    try {
        const respuesta = await fetchConCsrf(`${URL_API}/api/inventario`, {
            method: 'GET',
            credentials: 'include'
        });
        const datos = await respuesta.json();
        if (!respuesta.ok) throw new Error(datos.mensaje || 'No se pudieron cargar los pronósticos.');

        productosPronosticoAnalisis = Array.isArray(datos) ? datos : [];
        const fechaCorte = productosPronosticoAnalisis.find(producto => producto.fecha_corte_pronostico)?.fecha_corte_pronostico;
        const etiquetaFecha = document.getElementById('fecha_corte_analisis_pronostico');
        if (etiquetaFecha) {
            etiquetaFecha.textContent = fechaCorte
                ? `Fecha de corte: ${new Date(`${String(fechaCorte).slice(0, 10)}T00:00:00`).toLocaleDateString('es-CL')}`
                : 'Fecha de corte: sin ventas registradas';
        }
        filtrarProductosPronosticoAnalisis();
    } catch (error) {
        cuerpo.innerHTML = '';
        const fila = document.createElement('div');
        fila.className = 'fila_vacia_analisis_pronostico';
        fila.setAttribute('role', 'row');
        const mensaje = document.createElement('div');
        mensaje.setAttribute('role', 'cell');
        mensaje.textContent = error.message || 'No se pudieron cargar los pronósticos.';
        fila.appendChild(mensaje);
        cuerpo.appendChild(fila);
    }
}

function filtrarProductosPronosticoAnalisis() {
    const texto = (document.getElementById('buscar_producto_analisis_pronostico')?.value || '').trim().toLocaleLowerCase('es-CL');
    const filtroPronostico = document.getElementById('filtro_pronostico_analisis')?.value || '';
    productosPronosticoFiltradosAnalisis = productosPronosticoAnalisis.filter(producto => {
        const coincideTexto = String(producto.descripcion || '').toLocaleLowerCase('es-CL').includes(texto)
            || String(producto.codigo || '').toLocaleLowerCase('es-CL').includes(texto)
            || String(producto.cod_barra || '').toLocaleLowerCase('es-CL').includes(texto);
        const valoresPronostico = [producto.pronostico_7_dias, producto.pronostico_14_dias, producto.pronostico_30_dias].map(Number);
        const tienePronostico = valoresPronostico.some(valor => Number.isFinite(valor) && valor > 0);
        const coincidePronostico = filtroPronostico === 'CON_PRONOSTICO'
            ? tienePronostico
            : filtroPronostico === 'SIN_PRONOSTICO' ? !tienePronostico : true;
        return coincideTexto && coincidePronostico;
    });
    mostrarProductosPronosticoAnalisis();
}

function actualizarSelectorPronosticoAnalisis() {
    const selector = document.getElementById('filtro_pronostico_analisis');
    const etiqueta = document.getElementById('texto_selector_pronostico_analisis');
    const lista = document.getElementById('lista_selector_pronostico_analisis');
    if (!selector || !etiqueta || !lista) return;
    const opcionActual = Array.from(selector.options).find(opcion => opcion.value === selector.value);
    etiqueta.textContent = opcionActual?.textContent || 'Todos';
    lista.replaceChildren();
    Array.from(selector.options).forEach(opcion => {
        const boton = document.createElement('button');
        boton.type = 'button';
        boton.className = 'opcion_lista_selector_inventario';
        boton.setAttribute('role', 'option');
        boton.setAttribute('aria-selected', String(opcion.value === selector.value));
        boton.textContent = opcion.textContent;
        boton.addEventListener('click', () => {
            selector.value = opcion.value;
            selector.dispatchEvent(new Event('change', {bubbles: true}));
            const panel = document.getElementById('panel_selector_pronostico_analisis');
            panel.hidden = true;
            document.getElementById('boton_selector_pronostico_analisis')?.setAttribute('aria-expanded', 'false');
        });
        lista.appendChild(boton);
    });
}

function mostrarProductosPronosticoAnalisis() {
    const cuerpo = document.getElementById('cuerpo_tabla_analisis_pronostico');
    if (!cuerpo) return;
    cuerpo.replaceChildren();

    const total = productosPronosticoFiltradosAnalisis.length;
    const totalPaginas = Math.ceil(total / productosPorPaginaAnalisis);
    paginaPronosticoAnalisis = Math.max(1, Math.min(paginaPronosticoAnalisis, totalPaginas || 1));
    const desde = (paginaPronosticoAnalisis - 1) * productosPorPaginaAnalisis;
    const pagina = productosPronosticoFiltradosAnalisis.slice(desde, desde + productosPorPaginaAnalisis);

    if (!pagina.length) {
        const fila = document.createElement('div');
        fila.className = 'fila_vacia_analisis_pronostico';
        fila.setAttribute('role', 'row');
        const mensaje = document.createElement('div');
        mensaje.setAttribute('role', 'cell');
        mensaje.textContent = textoBusquedaAnalisis() ? 'No hay productos que coincidan con la búsqueda.' : 'No hay productos para mostrar.';
        fila.appendChild(mensaje);
        cuerpo.appendChild(fila);
    } else {
        pagina.forEach(producto => cuerpo.appendChild(crearFilaPronosticoAnalisis(producto)));
    }

    actualizarPaginacionPronosticoAnalisis(total, totalPaginas);
}

function crearFilaPronosticoAnalisis(producto) {
    const fila = document.createElement('div');
    fila.className = 'fila_analisis_pronostico';
    fila.setAttribute('role', 'row');
    fila.tabIndex = 0;
    fila.dataset.codigo = String(producto.codigo || '');
    fila.dataset.descripcion = String(producto.descripcion || 'Producto');
    fila.setAttribute('aria-label', `Ver ventas diarias de ${producto.descripcion || 'producto'}`);

    const celdaFoto = document.createElement('div');
    celdaFoto.dataset.etiqueta = 'Foto';
    celdaFoto.setAttribute('role', 'cell');
    const imagen = document.createElement('img');
    const rutaImagen = String(producto.imagen || '').trim();
    const imagenPredeterminada = './imagenes/inicio_sesion/cuerpo_pagina/secciones/package.svg';
    imagen.className = 'imagen_producto_analisis_pronostico';
    imagen.alt = rutaImagen ? `Foto de ${producto.descripcion || 'producto'}` : 'Producto sin fotografía';
    imagen.loading = 'lazy';
    imagen.decoding = 'async';
    imagen.draggable = false;
    imagen.src = rutaImagen
        ? (rutaImagen.startsWith('/api/productos/imagenes/') ? `${URL_API}${rutaImagen}` : rutaImagen)
        : imagenPredeterminada;
    if (!rutaImagen) imagen.classList.add('imagen_producto_analisis_pronostico_vacia');
    imagen.onerror = function() {
        this.onerror = null;
        this.src = imagenPredeterminada;
        this.alt = 'Producto sin fotografía';
        this.classList.add('imagen_producto_analisis_pronostico_vacia');
    };
    celdaFoto.appendChild(imagen);

    const celdaProducto = document.createElement('div');
    celdaProducto.dataset.etiqueta = 'Producto';
    celdaProducto.setAttribute('role', 'cell');
    celdaProducto.textContent = producto.descripcion || 'Producto sin nombre';
    celdaProducto.title = `Código: ${producto.codigo || '—'}`;

    fila.append(celdaFoto, celdaProducto);
    [
        ['Ventas · 28 días', producto.ventas_ultimos_28_dias],
        ['Pronóstico · 7 días', producto.pronostico_7_dias],
        ['Pronóstico · 14 días', producto.pronostico_14_dias],
        ['Pronóstico · 30 días', producto.pronostico_30_dias]
    ].forEach(([etiqueta, valor]) => {
        const celda = document.createElement('div');
        celda.dataset.etiqueta = etiqueta;
        celda.setAttribute('role', 'cell');
        const cantidad = Number(valor);
        celda.textContent = valor === null || valor === undefined || !Number.isFinite(cantidad)
            ? '—'
            : formatearCantidadPronosticoAnalisis(cantidad, producto.es_producto_balanza);
        celda.classList.add('cantidad_analisis_pronostico');
        fila.appendChild(celda);
    });
    return fila;
}

function formatearCantidadPronosticoAnalisis(valor, esBalanza) {
    const cantidad = Number(valor).toLocaleString('es-CL', {maximumFractionDigits: 3});
    return esBalanza ? `${cantidad} (KG)` : cantidad;
}

function actualizarPaginacionPronosticoAnalisis(total, totalPaginas) {
    const resumen = document.getElementById('resumen_paginacion_analisis_pronostico');
    const anterior = document.getElementById('pagina_anterior_analisis_pronostico');
    const siguiente = document.getElementById('pagina_siguiente_analisis_pronostico');
    const numeros = document.getElementById('numeros_pagina_analisis_pronostico');
    if (!resumen || !anterior || !siguiente || !numeros) return;

    const inicio = total ? (paginaPronosticoAnalisis - 1) * productosPorPaginaAnalisis + 1 : 0;
    const fin = Math.min(paginaPronosticoAnalisis * productosPorPaginaAnalisis, total);
    resumen.textContent = `Mostrando ${inicio.toLocaleString('es-CL')} a ${fin.toLocaleString('es-CL')} de ${total.toLocaleString('es-CL')} productos`;
    anterior.disabled = paginaPronosticoAnalisis <= 1;
    siguiente.disabled = paginaPronosticoAnalisis >= totalPaginas;
    numeros.replaceChildren();

    const paginas = totalPaginas <= 7
        ? Array.from({length: totalPaginas}, (_, indice) => indice + 1)
        : [...new Set([1, paginaPronosticoAnalisis - 1, paginaPronosticoAnalisis, paginaPronosticoAnalisis + 1, totalPaginas])]
            .filter(numero => numero >= 1 && numero <= totalPaginas)
            .sort((a, b) => a - b);
    let paginaAnterior = 0;
    paginas.forEach(numero => {
        if (numero - paginaAnterior > 1) {
            const puntos = document.createElement('div');
            puntos.className = 'puntos_pagina_analisis_pronostico';
            puntos.textContent = '…';
            numeros.appendChild(puntos);
        }
        const boton = document.createElement('button');
        boton.type = 'button';
        boton.className = 'boton_numero_analisis_pronostico';
        boton.textContent = String(numero);
        boton.setAttribute('aria-label', `Ir a página ${numero}`);
        if (numero === paginaPronosticoAnalisis) {
            boton.classList.add('activa');
            boton.setAttribute('aria-current', 'page');
        }
        boton.addEventListener('click', () => cambiarPaginaPronosticoAnalisis(numero));
        numeros.appendChild(boton);
        paginaAnterior = numero;
    });
}

function cambiarPaginaPronosticoAnalisis(pagina) {
    const totalPaginas = Math.ceil(productosPronosticoFiltradosAnalisis.length / productosPorPaginaAnalisis);
    if (pagina < 1 || pagina > totalPaginas) return;
    paginaPronosticoAnalisis = pagina;
    mostrarProductosPronosticoAnalisis();
}

async function seleccionarProductoPronosticoAnalisis(codigo, descripcion) {
    if (!codigo) return;
    document.querySelectorAll('.fila_analisis_pronostico.seleccionada').forEach(fila => fila.classList.remove('seleccionada'));
    document.querySelectorAll('.fila_analisis_pronostico').forEach(fila => {
        if (fila.dataset.codigo === String(codigo)) fila.classList.add('seleccionada');
    });
    const solicitud = ++solicitudGraficoPronosticoAnalisis;
    const contenedor = document.getElementById('contenedor_grafico_analisis_pronostico');
    const titulo = document.getElementById('titulo_grafico_analisis_pronostico');
    const descripcionGrafico = document.getElementById('descripcion_grafico_analisis_pronostico');
    const mensaje = document.getElementById('mensaje_grafico_analisis_pronostico');
    const grafico = document.getElementById('grafico_barras_analisis_pronostico');
    if (!contenedor || !titulo || !descripcionGrafico || !mensaje || !grafico) return;

    contenedor.hidden = false;
    titulo.textContent = `Ventas por día · ${descripcion || 'Producto'}`;
    descripcionGrafico.textContent = 'Últimos 28 días del historial, incluyendo días sin ventas.';
    mensaje.textContent = 'Cargando ventas diarias...';
    grafico.replaceChildren();
    contenedor.scrollIntoView({behavior: 'smooth', block: 'nearest'});

    try {
        const respuesta = await fetchConCsrf(`${URL_API}/api/inventario/pronostico/${encodeURIComponent(codigo)}/ventas-diarias`, {
            method: 'GET',
            credentials: 'include'
        });
        const datos = await respuesta.json();
        if (!respuesta.ok) throw new Error(datos.mensaje || 'No se pudieron cargar las ventas diarias.');
        if (solicitud !== solicitudGraficoPronosticoAnalisis) return;
        dibujarGraficoVentasDiariasAnalisis(Array.isArray(datos.dias) ? datos.dias : []);
    } catch (error) {
        if (solicitud !== solicitudGraficoPronosticoAnalisis) return;
        mensaje.textContent = error.message || 'No se pudieron cargar las ventas diarias.';
    }
}

function dibujarGraficoVentasDiariasAnalisis(dias) {
    const mensaje = document.getElementById('mensaje_grafico_analisis_pronostico');
    const grafico = document.getElementById('grafico_barras_analisis_pronostico');
    if (!mensaje || !grafico) return;
    grafico.replaceChildren();
    if (!dias.length) {
        mensaje.textContent = 'No hay fechas de ventas registradas para mostrar.';
        grafico.setAttribute('aria-label', 'No hay ventas registradas para el período.');
        return;
    }

    const maximo = Math.max(1, ...dias.map(dia => Number(dia.unidades) || 0));
    const total = dias.reduce((suma, dia) => suma + (Number(dia.unidades) || 0), 0);
    mensaje.textContent = `Total del período: ${formatearCantidadPronosticoAnalisis(total, false)} unidades. Cada barra representa un día.`;
    grafico.setAttribute('aria-label', `Ventas diarias de ${dias.length} días; total ${formatearCantidadPronosticoAnalisis(total, false)} unidades.`);

    dias.forEach((dia, indice) => {
        const unidades = Number(dia.unidades) || 0;
        const fecha = String(dia.fecha).slice(0, 10);
        const fechaLocal = new Date(`${fecha}T00:00:00`);
        const etiquetaFecha = Number.isNaN(fechaLocal.getTime()) ? fecha : fechaLocal.toLocaleDateString('es-CL', {day: '2-digit', month: '2-digit'});
        const columna = document.createElement('div');
        columna.className = 'columna_dia_analisis_pronostico';
        columna.title = `${fechaLocal.toLocaleDateString('es-CL')}: ${formatearCantidadPronosticoAnalisis(unidades, false)} unidades`;
        const areaBarra = document.createElement('div');
        areaBarra.className = 'area_barra_dia_analisis_pronostico';
        const barra = document.createElement('div');
        barra.className = unidades > 0 ? 'barra_dia_analisis_pronostico' : 'barra_dia_analisis_pronostico barra_dia_sin_ventas_analisis_pronostico';
        barra.style.height = unidades > 0 ? `${Math.max(4, (unidades / maximo) * 100)}%` : '2px';
        areaBarra.appendChild(barra);
        columna.appendChild(areaBarra);
        const valor = document.createElement('div');
        valor.className = 'valor_dia_analisis_pronostico';
        valor.textContent = formatearCantidadPronosticoAnalisis(unidades, false);
        columna.appendChild(valor);
        const etiqueta = document.createElement('div');
        etiqueta.className = 'fecha_dia_analisis_pronostico';
        etiqueta.textContent = indice % 7 === 0 || indice === dias.length - 1 ? etiquetaFecha : '';
        columna.appendChild(etiqueta);
        grafico.appendChild(columna);
    });
}

function ocultarGraficoPronosticoAnalisis() {
    const contenedor = document.getElementById('contenedor_grafico_analisis_pronostico');
    if (contenedor) contenedor.hidden = true;
    solicitudGraficoPronosticoAnalisis++;
}

function textoBusquedaAnalisis() {
    return (document.getElementById('buscar_producto_analisis_pronostico')?.value || '').trim();
}
