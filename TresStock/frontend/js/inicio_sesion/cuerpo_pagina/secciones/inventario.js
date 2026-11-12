// TITULO 1 CONTENEDOR INVENTARIO

    // arreglo para almacenar el inventario obtenido desde la base de datos
    let inventarioCargado = [];

    // arreglo para almacenar los productos filtrados
    let inventarioFiltrado = [];

    // almacena la página actual
    let paginaActualInventario = 1;

    // cantidad de productos mostrados por página
    const productosPorPaginaInventario = 120;

    // vista seleccionada en las pestañas de inventario
    let vistaActivaInventario = 'stock';

    // página actual del historial de movimientos
    let paginaActualMovimientosInventario = 1;

    // total de páginas del historial consultado
    let totalPaginasMovimientosInventario = 1;

    // temporizador para no consultar la API en cada tecla de búsqueda
    let temporizadorBusquedaMovimientosInventario;

// TITULO 2 ENCABEZADO INVENTARIO

    // sin función


// TITULO 3 INDICADORES INVENTARIO

    // función para cargar los indicadores desde la API
    async function cargarResumenInventario() {

        try {

            const respuesta = await fetchConCsrf(
                'http://127.0.0.1:3000/api/inventario/resumen',
                {
                    method: 'GET',
                    credentials: 'include'
                }
            );


            const resultado =
                await respuesta.json();


            if (!respuesta.ok) {

                console.error(
                    'Error al obtener resumen de inventario:',
                    resultado
                );

                return;

            }


            const valorTotal =
                document.getElementById(
                    'valor_total_productos_inventario'
                );

            const valorStockBajo =
                document.getElementById(
                    'valor_stock_bajo_inventario'
                );

            const valorSinStock =
                document.getElementById(
                    'valor_sin_stock_inventario'
                );

            const valorProximosVencer =
                document.getElementById(
                    'valor_proximos_vencer_inventario'
                );


            if (valorTotal) {

                valorTotal.textContent =
                    formatearNumeroInventario(
                        resultado.total_productos
                    );

            }


            if (valorStockBajo) {

                valorStockBajo.textContent =
                    formatearNumeroInventario(
                        resultado.stock_bajo
                    );

            }


            if (valorSinStock) {

                valorSinStock.textContent =
                    formatearNumeroInventario(
                        resultado.sin_stock
                    );

            }


            if (valorProximosVencer) {

                valorProximosVencer.textContent =
                    formatearNumeroInventario(
                        resultado.proximos_vencer
                    );

            }


        } catch (error) {

            console.error(
                'Error de conexión al obtener resumen de inventario:',
                error
            );

        }

    }


    // función para formatear números
    function formatearNumeroInventario(valor) {

        const numero =
            Number(valor || 0);


        return numero.toLocaleString(
            'es-CL'
        );

    }


// TITULO 4 PESTAÑAS INVENTARIO

    // sin función


// TITULO 5 FILTROS INVENTARIO

    // función para cargar las familias
    async function cargarFamiliasInventario() {

        try {

            const respuesta = await fetchConCsrf(
                'http://127.0.0.1:3000/api/inventario/familias',
                {
                    method: 'GET',
                    credentials: 'include'
                }
            );


            const resultado =
                await respuesta.json();


            if (!respuesta.ok) {

                console.error(
                    'Error al obtener familias:',
                    resultado
                );

                return;

            }


            const selectFamilia =
                document.getElementById(
                    'select_familia_inventario'
                );


            if (!selectFamilia) {
                return;
            }


            selectFamilia.innerHTML = '';


            const opcionTodas =
                document.createElement('option');

            opcionTodas.className =
                'opcion_familia_inventario';

            opcionTodas.value = '';

            opcionTodas.textContent =
                'Todas las familias';


            selectFamilia.appendChild(
                opcionTodas
            );


            resultado.forEach(
                registro => {

                    const opcion =
                        document.createElement(
                            'option'
                        );

                    opcion.className =
                        'opcion_familia_inventario';

                    opcion.value =
                        registro.familia || '';

                    opcion.textContent =
                        registro.familia || '';


                    selectFamilia.appendChild(
                        opcion
                    );

                }
            );

            // actualiza el selector visual con las familias devueltas por PostgreSQL
            actualizarSelectorVisualInventario('familia');

        } catch (error) {

            console.error(
                'Error de conexión al obtener familias:',
                error
            );

        }

    }


    // función para configurar los filtros
    function configurarFiltrosInventario() {

        const inputBusqueda =
            document.getElementById(
                'input_busqueda_inventario'
            );

        const selectFamilia =
            document.getElementById(
                'select_familia_inventario'
            );

        const selectEstado =
            document.getElementById(
                'select_estado_inventario'
            );


        if (inputBusqueda) {

            inputBusqueda.addEventListener(
                'input',
                filtrarInventario
            );

        }


        if (selectFamilia) {

            selectFamilia.addEventListener(
                'change',
                filtrarInventario
            );

        }


        if (selectEstado) {

            selectEstado.addEventListener(
                'change',
                filtrarInventario
            );

        }

        const botonLimpiar = document.getElementById(
            'limpiar_filtros_stock_inventario'
        );

        if (botonLimpiar) {
            botonLimpiar.addEventListener('click', function() {
                if (inputBusqueda) inputBusqueda.value = '';
                if (selectFamilia) selectFamilia.value = '';
                if (selectEstado) selectEstado.value = '';

                cerrarSelectoresVisualesInventario();
                actualizarSelectorVisualInventario('familia');
                actualizarSelectorVisualInventario('estado');
                paginaActualInventario = 1;
                filtrarInventario();
            });
        }

    }


    // función para filtrar el inventario
    function filtrarInventario() {

        const inputBusqueda =
            document.getElementById(
                'input_busqueda_inventario'
            );

        const selectFamilia =
            document.getElementById(
                'select_familia_inventario'
            );

        const selectEstado =
            document.getElementById(
                'select_estado_inventario'
            );


        const textoBusqueda =
            inputBusqueda
                ? inputBusqueda.value
                    .trim()
                    .toLowerCase()
                : '';

        const familiaSeleccionada =
            selectFamilia
                ? selectFamilia.value
                : '';

        const estadoSeleccionado =
            selectEstado
                ? selectEstado.value
                : '';


        inventarioFiltrado =
            inventarioCargado.filter(
                producto => {

                    const codigo =
                        (
                            producto.codigo ||
                            ''
                        ).toLowerCase();

                    const codigoBarra =
                        (
                            producto.cod_barra ||
                            ''
                        ).toLowerCase();

                    const descripcion =
                        (
                            producto.descripcion ||
                            ''
                        ).toLowerCase();

                    const familia =
                        producto.familia || '';

                    const estado =
                        producto.estado || '';


                    const coincideBusqueda =
                        codigo.includes(
                            textoBusqueda
                        ) ||
                        codigoBarra.includes(
                            textoBusqueda
                        ) ||
                        descripcion.includes(
                            textoBusqueda
                        );


                    const coincideFamilia =
                        !familiaSeleccionada ||
                        familia ===
                            familiaSeleccionada;


                    const coincideEstado =
                        !estadoSeleccionado ||
                        estado ===
                            estadoSeleccionado;


                    return (
                        coincideBusqueda &&
                        coincideFamilia &&
                        coincideEstado
                    );

                }
            );


        paginaActualInventario = 1;


        mostrarInventario();

    }


// SUBTITULO 1 SELECTORES PERSONALIZADOS DE INVENTARIO

    // normaliza los nombres para buscar familias con y sin tildes
    function normalizarTextoSelectorInventario(valor) {
        return String(valor ?? '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();
    }

    // cierra las listas y restablece sus atributos de accesibilidad
    function cerrarSelectoresVisualesInventario(excepto = '') {
        ['familia', 'estado'].forEach(function(tipo) {
            if (tipo === excepto) return;
            const panel = document.getElementById('panel_selector_' + tipo + '_inventario');
            const boton = document.getElementById('boton_selector_' + tipo + '_inventario');
            if (panel) panel.hidden = true;
            if (boton) boton.setAttribute('aria-expanded', 'false');
        });
    }

    // el SELECT original sigue controlando el filtro de stock
    function actualizarSelectorVisualInventario(tipo) {
        const select = document.getElementById('select_' + tipo + '_inventario');
        const etiqueta = document.getElementById('texto_selector_' + tipo + '_inventario');
        const lista = document.getElementById('lista_opciones_' + tipo + '_inventario');
        const buscador = tipo === 'familia'
            ? document.getElementById('buscar_selector_familia_inventario')
            : null;
        if (!select || !etiqueta || !lista) return;

        const opcionActual = Array.from(select.options).find(opcion => opcion.value === select.value);
        etiqueta.textContent = opcionActual?.textContent || (tipo === 'familia' ? 'Todas las familias' : 'Todos los estados');
        lista.replaceChildren();

        const texto = normalizarTextoSelectorInventario(buscador?.value || '');
        const opciones = Array.from(select.options).filter(opcion =>
            normalizarTextoSelectorInventario(opcion.textContent).includes(texto)
        );

        if (!opciones.length) {
            const sinResultados = document.createElement('div');
            sinResultados.className = 'mensaje_lista_selector_inventario';
            sinResultados.textContent = 'No se encontraron familias.';
            lista.appendChild(sinResultados);
            return;
        }

        opciones.forEach(function(opcion) {
            const boton = document.createElement('button');
            boton.type = 'button';
            boton.className = 'opcion_lista_selector_inventario';
            boton.setAttribute('role', 'option');
            boton.setAttribute('aria-selected', String(opcion.value === select.value));
            boton.textContent = opcion.textContent;
            boton.addEventListener('click', function() {
                select.value = opcion.value;
                select.dispatchEvent(new Event('change', {bubbles: true}));
                cerrarSelectoresVisualesInventario();
                actualizarSelectorVisualInventario(tipo);
                document.getElementById('boton_selector_' + tipo + '_inventario')?.focus();
            });
            lista.appendChild(boton);
        });
    }

    // añade eventos a los dos desplegables sin modificar la lógica del backend
    function configurarSelectoresVisualesInventario() {
        ['familia', 'estado'].forEach(function(tipo) {
            const select = document.getElementById('select_' + tipo + '_inventario');
            const contenedor = document.getElementById('contenedor_selector_' + tipo + '_inventario');
            const boton = document.getElementById('boton_selector_' + tipo + '_inventario');
            const panel = document.getElementById('panel_selector_' + tipo + '_inventario');
            if (!select || !contenedor || !boton || !panel || boton.dataset.configurado === 'si') return;
            boton.dataset.configurado = 'si';

            boton.addEventListener('click', function() {
                const abrir = panel.hidden;
                cerrarSelectoresVisualesInventario();
                panel.hidden = !abrir;
                boton.setAttribute('aria-expanded', String(abrir));
                if (abrir) {
                    const buscador = tipo === 'familia'
                        ? document.getElementById('buscar_selector_familia_inventario') : null;
                    if (buscador) buscador.value = '';
                    actualizarSelectorVisualInventario(tipo);
                    if (buscador) buscador.focus();
                }
            });

            select.addEventListener('change', function() {
                actualizarSelectorVisualInventario(tipo);
            });

            panel.addEventListener('keydown', function(evento) {
                if (evento.key === 'Escape') {
                    cerrarSelectoresVisualesInventario();
                    boton.focus();
                }
            });
            actualizarSelectorVisualInventario(tipo);
        });

        const buscador = document.getElementById('buscar_selector_familia_inventario');
        if (buscador && buscador.dataset.configurado !== 'si') {
            buscador.dataset.configurado = 'si';
            buscador.addEventListener('input', function() {
                actualizarSelectorVisualInventario('familia');
            });
        }

        const filtros = document.getElementById('filtros_stock_inventario');
        if (filtros && filtros.dataset.selectoresConfigurados !== 'si') {
            filtros.dataset.selectoresConfigurados = 'si';
            // solo registra un manejador de cierre por clic fuera de los selectores
            document.addEventListener('click', function(evento) {
                if (!evento.target.closest('#contenedor_selector_familia_inventario, #contenedor_selector_estado_inventario')) {
                    cerrarSelectoresVisualesInventario();
                }
            });
        }
    }


// TITULO 6 TABLA INVENTARIO

    // función para obtener el inventario desde la API
    async function cargarInventario() {

        try {

            const respuesta = await fetchConCsrf(
                'http://127.0.0.1:3000/api/inventario',
                {
                    method: 'GET',
                    credentials: 'include'
                }
            );


            const resultado =
                await respuesta.json();


            if (!respuesta.ok) {

                console.error(
                    'Error al obtener inventario:',
                    resultado
                );

                return;

            }


            inventarioCargado =
                Array.isArray(resultado)
                    ? resultado
                    : [];


            filtrarInventario();


        } catch (error) {

            console.error(
                'Error de conexión al obtener inventario:',
                error
            );

        }

    }


    // función para mostrar los productos en la tabla
    function mostrarInventario() {

        const cuerpoTabla =
            document.getElementById(
                'cuerpo_tabla_inventario'
            );


        if (!cuerpoTabla) {
            return;
        }


        cuerpoTabla.innerHTML = '';


        const totalProductos =
            inventarioFiltrado.length;


        if (!totalProductos) {

            const fila =
                document.createElement('div');

            fila.className =
                'fila_sin_inventario';
            fila.setAttribute('role', 'row');


            const dato =
                document.createElement('div');

            dato.className =
                'dato_sin_inventario';
            dato.setAttribute('role', 'cell');

            dato.textContent =
                'No se encontraron productos para mostrar.';


            fila.appendChild(
                dato
            );

            cuerpoTabla.appendChild(
                fila
            );


            actualizarPaginacionInventario();

            return;

        }


        const inicio =
            (
                paginaActualInventario -
                1
            ) *
            productosPorPaginaInventario;


        const fin =
            inicio +
            productosPorPaginaInventario;


        const productosPagina =
            inventarioFiltrado.slice(
                inicio,
                fin
            );


        productosPagina.forEach(
            producto => {

                const fila =
                    document.createElement(
                        'div'
                    );

                fila.className =
                    'fila_producto_inventario';
                fila.setAttribute('role', 'row');


                // miniatura de la fotografía del producto
                const datoImagen = document.createElement('div');
                datoImagen.className = 'dato_imagen_inventario';
                datoImagen.setAttribute('role', 'cell');
                datoImagen.dataset.etiqueta = 'Imagen';
                const botonVerFoto = document.createElement('button');
                botonVerFoto.className = 'boton_ver_foto_inventario';
                botonVerFoto.type = 'button';
                botonVerFoto.title = 'Ver fotografía ampliada';
                botonVerFoto.setAttribute('aria-label', `Ver fotografía de ${producto.descripcion || 'producto'}`);
                botonVerFoto.dataset.descripcion = String(producto.descripcion || 'Producto');
                const imagen = document.createElement('img');
                const rutaImagenPredeterminada = './imagenes/inicio_sesion/cuerpo_pagina/secciones/package.svg';
                const rutaImagen = String(producto.imagen || '').trim();
                imagen.className = 'imagen_miniatura_inventario';
                imagen.alt = rutaImagen ? `Fotografía de ${producto.descripcion || 'producto'}` : 'Producto sin fotografía';
                imagen.loading = 'lazy';
                imagen.decoding = 'async';
                imagen.draggable = false;
                imagen.src = rutaImagen
                    ? (rutaImagen.startsWith('/api/productos/imagenes/') ? `http://127.0.0.1:3000${rutaImagen}` : rutaImagen)
                    : rutaImagenPredeterminada;
                imagen.onerror = function() {
                    this.onerror = null;
                    this.src = rutaImagenPredeterminada;
                    this.alt = 'Producto sin fotografía';
                    this.classList.add('imagen_miniatura_inventario_vacia');
                };
                if (!rutaImagen) imagen.classList.add('imagen_miniatura_inventario_vacia');
                botonVerFoto.appendChild(imagen);
                datoImagen.appendChild(botonVerFoto);


                // producto
                const datoProducto =
                    document.createElement(
                        'div'
                    );

                datoProducto.className =
                    'dato_producto_inventario';
                datoProducto.setAttribute('role', 'cell');
                datoProducto.dataset.etiqueta = 'Producto';

                datoProducto.textContent =
                    producto.descripcion ||
                    '-';


                // familia
                const datoFamilia =
                    document.createElement(
                        'div'
                    );

                datoFamilia.className =
                    'dato_familia_inventario';
                datoFamilia.setAttribute('role', 'cell');
                datoFamilia.dataset.etiqueta = 'Familia';

                datoFamilia.textContent =
                    producto.familia ||
                    '-';


                // stock actual
                const datoStockActual =
                    document.createElement(
                        'div'
                    );

                datoStockActual.className =
                    'dato_stock_actual_inventario';
                datoStockActual.setAttribute('role', 'cell');
                datoStockActual.dataset.etiqueta = 'Stock actual';

                datoStockActual.textContent =
                    formatearCantidadInventario(
                        producto.stock_actual,
                        producto.es_producto_balanza
                    );


                // stock mínimo
                const datoStockMinimo =
                    document.createElement(
                        'div'
                    );

                datoStockMinimo.className =
                    'dato_stock_minimo_inventario';
                datoStockMinimo.setAttribute('role', 'cell');
                datoStockMinimo.dataset.etiqueta = 'Stock mínimo';

                datoStockMinimo.textContent =
                    producto.stock_minimo_calculable
                        ? formatearCantidadInventario(
                            producto.stock_minimo,
                            producto.es_producto_balanza
                        )
                        : '—';


                // estado
                const datoEstado =
                    document.createElement(
                        'div'
                    );

                datoEstado.className =
                    'dato_estado_inventario';
                datoEstado.setAttribute('role', 'cell');
                datoEstado.dataset.etiqueta = 'Estado';


                const estado =
                    document.createElement(
                        'div'
                    );


                configurarEstadoInventario(
                    estado,
                    producto.estado
                );


                datoEstado.appendChild(
                    estado
                );

                // botón para abrir el ajuste manual del producto
                const datoAcciones = document.createElement('div');
                datoAcciones.className = 'dato_acciones_inventario';
                datoAcciones.setAttribute('role', 'cell');
                datoAcciones.dataset.etiqueta = 'Acciones';
                const botonAjustar = document.createElement('button');
                botonAjustar.className = 'boton_ajustar_stock_inventario';
                botonAjustar.type = 'button';
                botonAjustar.title = 'Ajustar stock';
                botonAjustar.setAttribute('aria-label', `Ajustar stock de ${producto.descripcion || 'producto'}`);
                botonAjustar.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L9 17l-4 1 1-4Z"/></svg>`;
                botonAjustar.dataset.codigo = String(producto.codigo || '');
                botonAjustar.dataset.descripcion = String(producto.descripcion || 'Producto');
                const grupoAcciones = document.createElement('div');
                grupoAcciones.className = 'contenedor_acciones_inventario';
                grupoAcciones.appendChild(botonAjustar);
                const botonHistorial = document.createElement('button');
                botonHistorial.className = 'boton_historial_stock_inventario';
                botonHistorial.type = 'button';
                botonHistorial.title = 'Últimos movimientos';
                botonHistorial.setAttribute('aria-label', `Ver últimos movimientos de ${producto.descripcion || 'producto'}`);
                botonHistorial.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>`;
                botonHistorial.dataset.codigo = String(producto.codigo || '');
                botonHistorial.dataset.descripcion = String(producto.descripcion || 'Producto');
                grupoAcciones.appendChild(botonHistorial);
                datoAcciones.appendChild(grupoAcciones);


                fila.appendChild(
                    datoImagen
                );

                fila.appendChild(
                    datoProducto
                );

                fila.appendChild(
                    datoFamilia
                );

                fila.appendChild(
                    datoStockActual
                );

                fila.appendChild(
                    datoStockMinimo
                );

                fila.appendChild(
                    datoEstado
                );

                fila.appendChild(datoAcciones);

                cuerpoTabla.appendChild(
                    fila
                );

            }
        );


        actualizarPaginacionInventario();

    }


    // función para establecer el estado visual
    function configurarEstadoInventario(
        elemento,
        estado
    ) {

        if (estado === 'STOCK NEGATIVO') {

            elemento.className =
                'estado_stock_negativo_inventario';

            elemento.textContent =
                'Stock negativo';

            return;

        }

        if (estado === 'SIN STOCK') {

            elemento.className =
                'estado_sin_stock_inventario';

            elemento.textContent =
                'Sin stock';

            return;

        }


        if (estado === 'STOCK BAJO') {

            elemento.className =
                'estado_stock_bajo_inventario';

            elemento.textContent =
                'Stock bajo';

            return;

        }


        if (estado === 'PENDIENTE') {

            elemento.className =
                'estado_pendiente_inventario';

            elemento.textContent =
                'Pendiente';

            return;

        }


        elemento.className =
            'estado_optimo_inventario';

        elemento.textContent =
            'Óptimo';

    }


    // función para mostrar cantidades
    function formatearCantidadInventario(
        valor,
        esProductoBalanza = false
    ) {

        const numero =
            Number(
                valor || 0
            );


        const cantidadFormateada = numero.toLocaleString(
            'es-CL',
            {
                minimumFractionDigits: 0,
                maximumFractionDigits: 3
            }
        );

        return esProductoBalanza ? `${cantidadFormateada} (KG)` : cantidadFormateada;

    }


// TITULO 7 PAGINACION INVENTARIO

    // función para cambiar de página
    function cambiarPaginaInventario(pagina) {

        const totalPaginas = Math.ceil(
            inventarioFiltrado.length / productosPorPaginaInventario
        );

        if (pagina < 1 || pagina > totalPaginas) {
            return;
        }

        paginaActualInventario = pagina;
        mostrarInventario();

    }


    // función para configurar los botones anterior y siguiente
    function configurarPaginacionInventario() {

        const botonAnterior = document.getElementById(
            'boton_pagina_anterior_inventario'
        );

        const botonSiguiente = document.getElementById(
            'boton_pagina_siguiente_inventario'
        );

        if (botonAnterior) {
            botonAnterior.addEventListener('click', function() {
                cambiarPaginaInventario(paginaActualInventario - 1);
            });
        }

        if (botonSiguiente) {
            botonSiguiente.addEventListener('click', function() {
                cambiarPaginaInventario(paginaActualInventario + 1);
            });
        }

    }


    // función para mostrar el contador y los controles de paginación
    function actualizarPaginacionInventario() {

        const contenedor = document.getElementById(
            'contenedor_paginacion_inventario'
        );

        const informacion = document.getElementById(
            'informacion_paginacion_inventario'
        );

        const controles = document.getElementById(
            'controles_paginacion_inventario'
        );

        const anterior = document.getElementById(
            'boton_pagina_anterior_inventario'
        );

        const siguiente = document.getElementById(
            'boton_pagina_siguiente_inventario'
        );

        if (!contenedor || !informacion || !controles || !anterior || !siguiente) {
            return;
        }

        const totalProductos = inventarioFiltrado.length;
        const totalPaginas = Math.ceil(totalProductos / productosPorPaginaInventario);

        if (totalPaginas > 0 && paginaActualInventario > totalPaginas) {
            paginaActualInventario = totalPaginas;
        }

        const inicio = totalProductos === 0
            ? 0
            : (paginaActualInventario - 1) * productosPorPaginaInventario + 1;

        const fin = Math.min(
            paginaActualInventario * productosPorPaginaInventario,
            totalProductos
        );

        informacion.textContent =
            'Mostrando ' + inicio.toLocaleString('es-CL') +
            ' a ' + fin.toLocaleString('es-CL') +
            ' de ' + totalProductos.toLocaleString('es-CL') + ' productos';

        contenedor.style.display = 'flex';
        controles.style.display = totalPaginas <= 1 ? 'none' : 'flex';

        if (totalPaginas <= 1) {
            return;
        }

        anterior.disabled = paginaActualInventario === 1;
        siguiente.disabled = paginaActualInventario === totalPaginas;

        mostrarNumerosPaginasInventario(totalPaginas);

    }


    // función para mostrar los números de página y los puntos suspensivos
    function mostrarNumerosPaginasInventario(totalPaginas) {

        const numeros = document.getElementById(
            'numeros_paginas_inventario'
        );

        if (!numeros) {
            return;
        }

        numeros.innerHTML = '';

        const paginasMostrar = [];

        if (totalPaginas <= 7) {

            for (let pagina = 1; pagina <= totalPaginas; pagina++) {
                paginasMostrar.push(pagina);
            }

        } else {

            paginasMostrar.push(1);

            if (paginaActualInventario > 4) {
                paginasMostrar.push('...');
            }

            const inicio = Math.max(2, paginaActualInventario - 2);
            const fin = Math.min(totalPaginas - 1, paginaActualInventario + 2);

            for (let pagina = inicio; pagina <= fin; pagina++) {
                paginasMostrar.push(pagina);
            }

            if (paginaActualInventario < totalPaginas - 3) {
                paginasMostrar.push('...');
            }

            paginasMostrar.push(totalPaginas);

        }

        paginasMostrar.forEach(function(pagina) {

            if (pagina === '...') {

                const puntos = document.createElement('span');
                puntos.className = 'puntos_paginacion_inventario';
                puntos.setAttribute('aria-hidden', 'true');

                for (let numero = 0; numero < 3; numero++) {
                    const punto = document.createElement('div');
                    punto.className = 'punto_paginacion_inventario';
                    puntos.appendChild(punto);
                }

                numeros.appendChild(puntos);
                return;

            }

            const boton = document.createElement('button');
            boton.type = 'button';
            boton.className = 'boton_numero_pagina_inventario';
            boton.textContent = pagina;

            if (pagina === paginaActualInventario) {
                boton.classList.add('pagina_actual_inventario');
                boton.setAttribute('aria-current', 'page');
            }

            boton.addEventListener('click', function() {
                cambiarPaginaInventario(pagina);
            });

            numeros.appendChild(boton);

        });

    }


// TITULO 8 RECALCULO AUTOMATICO DEL STOCK MINIMO

// recalcula el stock minimo utilizando las ventas y proveedores
async function recalcularStockMinimoInventario() {

    try {

        const respuesta = await fetchConCsrf(
            'http://127.0.0.1:3000/api/inventario/recalcular-stock-minimo',
            {
                method: 'PUT',
                credentials: 'include'
            }
        );


        const resultado =
            await respuesta.json();


        if (!respuesta.ok) {

            console.error(
                'Error al recalcular stock mínimo:',
                resultado
            );

            return;

        }


        console.log(
            'Stock mínimo recalculado:',
            resultado
        );


    } catch (error) {

        console.error(
            'Error al recalcular stock mínimo:',
            error
        );

    }

}


// TITULO 9 INICIALIZACION INVENTARIO

    // configura las pestañas de stock y movimientos
    function configurarPestanasInventario() {

        const pestañas = document.querySelectorAll(
            '.contenedor_pestanas_inventario [data-vista]'
        );

        pestañas.forEach(function(pestaña) {
            pestaña.addEventListener('click', function() {
                vistaActivaInventario = pestaña.dataset.vista;
                paginaActualMovimientosInventario = 1;

                pestañas.forEach(function(opcion) {
                    opcion.classList.toggle(
                        'pestana_inventario_activa',
                        opcion === pestaña
                    );
                });

                const esStockActual = vistaActivaInventario === 'stock';
                const filtroTipo = document.getElementById('campo_tipo_movimientos_inventario');
                const filtrosHistorial = document.getElementById('filtros_movimientos_inventario');
                if (filtroTipo) filtroTipo.hidden = vistaActivaInventario !== 'MOVIMIENTOS';
                if (filtrosHistorial) filtrosHistorial.dataset.vista = vistaActivaInventario;
                cerrarSelectoresHistorialInventario();
                document.getElementById('filtros_stock_inventario').hidden = !esStockActual;
                document.getElementById('vista_stock_actual_inventario').hidden = !esStockActual;
                document.getElementById('filtros_movimientos_inventario').hidden = esStockActual;
                document.getElementById('vista_movimientos_inventario').hidden = esStockActual;

                if (!esStockActual) {
                    cargarMovimientosInventario();
                }
            });
        });

        const busqueda = document.getElementById('busqueda_movimientos_inventario');
        const desde = document.getElementById('desde_movimientos_inventario');
        const hasta = document.getElementById('hasta_movimientos_inventario');
        const orden = document.getElementById('orden_movimientos_inventario');
        const tipo = document.getElementById('tipo_movimientos_inventario');
        const botonLimpiar = document.getElementById('limpiar_filtros_movimientos_inventario');

        // mismos desplegables personalizados que los filtros de Productos
        configurarSelectoresHistorialInventario();

        if (busqueda) {
            busqueda.addEventListener('input', function() {
                clearTimeout(temporizadorBusquedaMovimientosInventario);
                temporizadorBusquedaMovimientosInventario = setTimeout(function() {
                    paginaActualMovimientosInventario = 1;
                    cargarMovimientosInventario();
                }, 250);
            });
        }

        [desde, hasta, orden, tipo].forEach(function(control) {
            if (control) {
                control.addEventListener('change', function() {
                    paginaActualMovimientosInventario = 1;
                    cargarMovimientosInventario();
                });
            }
        });

        if (botonLimpiar) {
            botonLimpiar.addEventListener('click', function() {
                clearTimeout(temporizadorBusquedaMovimientosInventario);
                if (busqueda) busqueda.value = '';
                if (desde) desde.value = '';
                if (hasta) hasta.value = '';
                if (orden) orden.value = 'recientes';
                if (tipo) tipo.value = '';
                actualizarSelectorHistorialInventario('orden');
                actualizarSelectorHistorialInventario('tipo');
                cerrarSelectoresHistorialInventario();

                paginaActualMovimientosInventario = 1;
                cargarMovimientosInventario();
            });
        }

        document.getElementById('anterior_movimientos_inventario')
            ?.addEventListener('click', function() {
                if (paginaActualMovimientosInventario > 1) {
                    paginaActualMovimientosInventario--;
                    cargarMovimientosInventario();
                }
            });

        document.getElementById('siguiente_movimientos_inventario')
            ?.addEventListener('click', function() {
                if (paginaActualMovimientosInventario < totalPaginasMovimientosInventario) {
                    paginaActualMovimientosInventario++;
                    cargarMovimientosInventario();
                }
            });
    }


    // SUBTITULO 1 SELECTORES PERSONALIZADOS DEL HISTORIAL

    // cierra los menús de Tipo y Orden sin afectar sus valores seleccionados
    function cerrarSelectoresHistorialInventario() {
        ['tipo', 'orden'].forEach(function(nombre) {
            const panel = document.getElementById(`panel_selector_${nombre}_movimientos_inventario`);
            const boton = document.getElementById(`boton_selector_${nombre}_movimientos_inventario`);
            if (panel) panel.hidden = true;
            if (boton) boton.setAttribute('aria-expanded', 'false');
        });
    }

    // actualiza el texto y opciones del selector según el SELECT original
    function actualizarSelectorHistorialInventario(nombre) {
        const select = document.getElementById(`${nombre}_movimientos_inventario`);
        const etiqueta = document.getElementById(`texto_selector_${nombre}_movimientos_inventario`);
        const lista = document.getElementById(`lista_opciones_${nombre}_movimientos_inventario`);
        if (!select || !etiqueta || !lista) return;

        etiqueta.textContent = select.selectedOptions[0]?.textContent || 'Todos';
        lista.replaceChildren();
        Array.from(select.options).forEach(function(opcion) {
            const boton = document.createElement('button');
            boton.type = 'button';
            boton.className = 'opcion_lista_selector_inventario';
            boton.setAttribute('role', 'option');
            boton.setAttribute('aria-selected', String(opcion.value === select.value));
            boton.textContent = opcion.textContent;
            boton.addEventListener('click', function() {
                select.value = opcion.value;
                select.dispatchEvent(new Event('change', {bubbles: true}));
                actualizarSelectorHistorialInventario(nombre);
                cerrarSelectoresHistorialInventario();
                document.getElementById(`boton_selector_${nombre}_movimientos_inventario`)?.focus();
            });
            lista.appendChild(boton);
        });
    }

    // permite seleccionar Tipo y Orden con los mismos estilos de Productos
    function configurarSelectoresHistorialInventario() {
        ['tipo', 'orden'].forEach(function(nombre) {
            const boton = document.getElementById(`boton_selector_${nombre}_movimientos_inventario`);
            const panel = document.getElementById(`panel_selector_${nombre}_movimientos_inventario`);
            if (!boton || !panel || boton.dataset.configurado === 'si') return;
            boton.dataset.configurado = 'si';
            actualizarSelectorHistorialInventario(nombre);

            boton.addEventListener('click', function() {
                const abrir = panel.hidden;
                cerrarSelectoresHistorialInventario();
                panel.hidden = !abrir;
                boton.setAttribute('aria-expanded', String(abrir));
                if (abrir) {
                    actualizarSelectorHistorialInventario(nombre);
                    panel.querySelector('button')?.focus();
                }
            });
            panel.addEventListener('keydown', function(evento) {
                if (evento.key === 'Escape') {
                    cerrarSelectoresHistorialInventario();
                    boton.focus();
                }
            });
        });
        const contenedor = document.getElementById('filtros_movimientos_inventario');
        if (contenedor && contenedor.dataset.selectorConfigurado !== 'si') {
            contenedor.dataset.selectorConfigurado = 'si';
            document.addEventListener('click', function(evento) {
                if (!evento.target.closest('#contenedor_selector_tipo_movimientos_inventario, #contenedor_selector_orden_movimientos_inventario')) {
                    cerrarSelectoresHistorialInventario();
                }
            });
        }
    }

    // SUBTITULO 2 COLUMNAS SEGÚN PESTAÑA

    function configurarColumnasHistorialInventario() {
        const tabla = document.querySelector('.tabla_movimientos_inventario');
        const cabecera = document.getElementById('encabezado_movimientos_inventario');
        if (!tabla || !cabecera) return;

        const modo = ['ENTRADA', 'SALIDA', 'AJUSTE'].includes(vistaActivaInventario)
            ? vistaActivaInventario : 'MOVIMIENTOS';
        tabla.dataset.modo = modo;
        const columnas = modo === 'AJUSTE'
            ? ['Producto', 'Stock anterior', 'Stock nuevo', 'Diferencia', 'Motivo', 'Realizado por', 'Fecha de registro']
            : modo === 'MOVIMIENTOS'
                ? ['Producto', 'Tipo', 'Cantidad', 'Motivo', 'Realizado por', 'Fecha de registro']
                : ['Producto', 'Cantidad', 'Motivo', 'Realizado por', 'Fecha de registro'];

        cabecera.replaceChildren();
        columnas.forEach(function(nombre) {
            const celda = document.createElement('div');
            celda.setAttribute('role', 'columnheader');
            celda.textContent = nombre;
            cabecera.appendChild(celda);
        });
    }

    // mantiene la precisión registrada de los movimientos, incluso cantidades por peso
    function formatearCantidadMovimientoInventario(valor) {
        const numero = Number(valor);
        if (!Number.isFinite(numero)) return '—';
        return numero.toLocaleString('es-CL', {minimumFractionDigits: 0, maximumFractionDigits: 4});
    }

    // recupera saldos antiguos SOLO si aparecen explícitamente en el motivo generado por TresStock
    function obtenerSaldosAjusteInventario(movimiento) {
        if (movimiento.stock_anterior !== null && movimiento.stock_anterior !== undefined &&
            movimiento.stock_nuevo !== null && movimiento.stock_nuevo !== undefined) {
            return {anterior: Number(movimiento.stock_anterior), nuevo: Number(movimiento.stock_nuevo)};
        }
        const coincidencia = String(movimiento.motivo || '').match(/(?:^|\s)Stock:\s*(-?\d+(?:\.\d+)?)\s+a\s*(-?\d+(?:\.\d+)?)(?:\s|$)/i);
        if (!coincidencia) return null;
        return {anterior: Number(coincidencia[1]), nuevo: Number(coincidencia[2])};
    }

    // carga del backend los movimientos de la pestaña seleccionada
    async function cargarMovimientosInventario() {

        const cuerpo = document.getElementById('cuerpo_movimientos_inventario');

        if (!cuerpo) {
            return;
        }

        const parametros = new URLSearchParams();
        const busqueda = document.getElementById('busqueda_movimientos_inventario');
        const desde = document.getElementById('desde_movimientos_inventario');
        const hasta = document.getElementById('hasta_movimientos_inventario');
        const orden = document.getElementById('orden_movimientos_inventario');
        const tipoSeleccionado = document.getElementById('tipo_movimientos_inventario');
        const titulo = document.getElementById('titulo_movimientos_inventario');

        const titulos = {
            ENTRADA: 'Entradas de inventario',
            SALIDA: 'Salidas de inventario',
            AJUSTE: 'Ajustes de inventario',
            MOVIMIENTOS: 'Todos los movimientos'
        };

        if (titulo) {
            titulo.textContent = titulos[vistaActivaInventario] || 'Historial de movimientos';
        }
        const descripcionHistorial = document.getElementById('descripcion_movimientos_inventario');
        if (descripcionHistorial) {
            descripcionHistorial.textContent = vistaActivaInventario === 'AJUSTE'
                ? '* En los ajustes antiguos sin stock anterior y nuevo, la diferencia indica solamente la magnitud; no se conoce su dirección.'
                : 'Fecha de registro: momento en que TresStock guardó el movimiento (no necesariamente la fecha de la venta en DimaSoft).';
        }
        configurarColumnasHistorialInventario();

        if (['ENTRADA', 'SALIDA', 'AJUSTE'].includes(vistaActivaInventario)) {
            parametros.set('tipo', vistaActivaInventario);
        } else if (vistaActivaInventario === 'MOVIMIENTOS' && tipoSeleccionado?.value) {
            parametros.set('tipo', tipoSeleccionado.value);
        }

        if (busqueda?.value.trim()) parametros.set('buscar', busqueda.value.trim());
        if (desde?.value) parametros.set('desde', desde.value);
        if (hasta?.value) parametros.set('hasta', hasta.value);
        if (orden?.value) parametros.set('orden', orden.value);
        parametros.set('pagina', paginaActualMovimientosInventario);

        try {
            const respuesta = await fetchConCsrf(
                `http://127.0.0.1:3000/api/inventario/movimientos?${parametros.toString()}`,
                { method: 'GET', credentials: 'include' }
            );
            const resultado = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(resultado.mensaje || 'No se pudo cargar el historial.');
            }

            totalPaginasMovimientosInventario = resultado.paginacion?.total_paginas || 1;
            paginaActualMovimientosInventario = resultado.paginacion?.pagina_actual || 1;
            mostrarMovimientosInventario(resultado.movimientos || [], resultado.paginacion || {});
        } catch (error) {
            console.error('Error al cargar movimientos de inventario:', error);
            cuerpo.innerHTML = '<div class="fila_sin_inventario" role="row"><div class="dato_sin_inventario" role="cell">No se pudo cargar el historial de movimientos.</div></div>';
        }
    }


    // dibuja las filas del historial y actualiza su paginación
    function mostrarMovimientosInventario(movimientos, paginacion) {

        const cuerpo = document.getElementById('cuerpo_movimientos_inventario');
        const informacion = document.getElementById('informacion_movimientos_inventario');
        const anterior = document.getElementById('anterior_movimientos_inventario');
        const siguiente = document.getElementById('siguiente_movimientos_inventario');
        const numeros = document.getElementById('numeros_paginas_movimientos_inventario');
        const controles = document.querySelector(
            '#paginacion_movimientos_inventario .controles_paginacion_inventario'
        );

        if (!cuerpo) return;

        cuerpo.innerHTML = '';

        if (movimientos.length === 0) {
            cuerpo.innerHTML = '<div class="fila_sin_inventario" role="row"><div class="dato_sin_inventario" role="cell">No hay movimientos para los filtros seleccionados.</div></div>';
        }

        // muestra las columnas propias de cada pestaña, con signos y colores claros
        movimientos.forEach(function(movimiento) {
            const fila = document.createElement('div');
            fila.className = 'fila_producto_inventario';
            fila.setAttribute('role', 'row');

            const fecha = movimiento.fecha_hora
                ? new Date(movimiento.fecha_hora).toLocaleString('es-CL')
                : '—';
            const cantidad = formatearCantidadMovimientoInventario(movimiento.cantidad);
            const tipo = String(movimiento.tipo || '').toUpperCase();
            const motivo = movimiento.motivo || '—';
            const usuario = movimiento.correo_usuario || 'No registrado';
            const nombre = movimiento.producto || movimiento.codigo || '—';

            // no se puede inferir el signo de un AJUSTE antiguo guardado solo con ABS()
            const saldos = tipo === 'AJUSTE' ? obtenerSaldosAjusteInventario(movimiento) : null;
            const diferencia = saldos ? Number((saldos.nuevo - saldos.anterior).toFixed(4)) : null;
            const cantidadConSigno = tipo === 'ENTRADA' ? `+${cantidad}`
                : tipo === 'SALIDA' ? `−${cantidad}`
                : diferencia === null ? cantidad
                : `${diferencia > 0 ? '+' : diferencia < 0 ? '−' : ''}${formatearCantidadMovimientoInventario(Math.abs(diferencia))}`;

            let celdas;
            if (vistaActivaInventario === 'AJUSTE') {
                celdas = [
                    ['Producto', nombre, 'producto'],
                    ['Stock anterior', saldos ? formatearCantidadMovimientoInventario(saldos.anterior) : '—', 'numero'],
                    ['Stock nuevo', saldos ? formatearCantidadMovimientoInventario(saldos.nuevo) : '—', 'numero'],
                    ['Diferencia', diferencia === null ? `${cantidad}*` : cantidadConSigno, 'diferencia'],
                    ['Motivo', motivo, 'motivo'],
                    ['Realizado por', usuario, 'usuario'],
                    ['Fecha de registro', fecha, 'fecha']
                ];
            } else if (vistaActivaInventario === 'MOVIMIENTOS') {
                celdas = [
                    ['Producto', nombre, 'producto'],
                    ['Tipo', tipo, 'tipo'],
                    ['Cantidad', cantidadConSigno, 'cantidad'],
                    ['Motivo', motivo, 'motivo'],
                    ['Realizado por', usuario, 'usuario'],
                    ['Fecha de registro', fecha, 'fecha']
                ];
            } else {
                celdas = [
                    ['Producto', nombre, 'producto'],
                    ['Cantidad', cantidadConSigno, 'cantidad'],
                    ['Motivo', motivo, 'motivo'],
                    ['Realizado por', usuario, 'usuario'],
                    ['Fecha de registro', fecha, 'fecha']
                ];
            }

            celdas.forEach(function([etiqueta, valor, clase]) {
                const celda = document.createElement('div');
                celda.className = clase === 'producto' ? 'dato_producto_inventario' : 'dato_movimiento_inventario';
                celda.classList.add(`celda_historial_${clase}_inventario`);
                celda.setAttribute('role', 'cell');
                celda.dataset.etiqueta = etiqueta;
                if (clase === 'tipo') {
                    const insignia = document.createElement('span');
                    insignia.className = `etiqueta_tipo_movimiento_inventario etiqueta_tipo_${tipo.toLowerCase()}_inventario`;
                    insignia.textContent = tipo;
                    celda.appendChild(insignia);
                } else {
                    celda.textContent = String(valor);
                }
                if (clase === 'diferencia' && diferencia === null) {
                    celda.title = 'Movimiento histórico sin stock anterior y nuevo: se muestra la magnitud sin dirección confirmada.';
                }
                if (clase === 'cantidad' || clase === 'diferencia') {
                    if (tipo === 'ENTRADA' || (tipo === 'AJUSTE' && diferencia > 0)) {
                        celda.classList.add('cantidad_positiva_inventario');
                    } else if (tipo === 'SALIDA' || (tipo === 'AJUSTE' && diferencia < 0)) {
                        celda.classList.add('cantidad_negativa_inventario');
                    }
                }
                fila.appendChild(celda);
            });

            cuerpo.appendChild(fila);
        });

        const total = Number(paginacion.total_movimientos || 0);
        const limite = Number(paginacion.limite || 25);
        const inicio = total === 0 ? 0 : (paginaActualMovimientosInventario - 1) * limite + 1;
        const fin = Math.min(paginaActualMovimientosInventario * limite, total);

        if (informacion) {
            informacion.textContent = `Mostrando ${inicio} a ${fin} de ${total} movimientos`;
        }
        if (anterior) anterior.disabled = paginaActualMovimientosInventario <= 1;
        if (siguiente) siguiente.disabled = paginaActualMovimientosInventario >= totalPaginasMovimientosInventario;
        if (controles) {
            controles.style.display = totalPaginasMovimientosInventario <= 1
                ? 'none'
                : 'flex';
        }

        if (numeros) {
            numeros.innerHTML = '';

            const paginasMostrar = [];

            if (totalPaginasMovimientosInventario <= 7) {
                for (let numeroPagina = 1; numeroPagina <= totalPaginasMovimientosInventario; numeroPagina++) {
                    paginasMostrar.push(numeroPagina);
                }
            } else {
                paginasMostrar.push(1);

                if (paginaActualMovimientosInventario > 4) {
                    paginasMostrar.push('...');
                }

                const inicioPaginas = Math.max(2, paginaActualMovimientosInventario - 2);
                const finPaginas = Math.min(totalPaginasMovimientosInventario - 1, paginaActualMovimientosInventario + 2);

                for (let numeroPagina = inicioPaginas; numeroPagina <= finPaginas; numeroPagina++) {
                    paginasMostrar.push(numeroPagina);
                }

                if (paginaActualMovimientosInventario < totalPaginasMovimientosInventario - 3) {
                    paginasMostrar.push('...');
                }

                paginasMostrar.push(totalPaginasMovimientosInventario);
            }

            paginasMostrar.forEach(function(numeroPagina) {
                if (numeroPagina === '...') {
                    const puntos = document.createElement('span');
                    puntos.className = 'puntos_paginacion_inventario';
                    puntos.setAttribute('aria-hidden', 'true');

                    for (let indice = 0; indice < 3; indice++) {
                        const punto = document.createElement('div');
                        punto.className = 'punto_paginacion_inventario';
                        puntos.appendChild(punto);
                    }

                    numeros.appendChild(puntos);
                    return;
                }

                const boton = document.createElement('button');
                boton.type = 'button';
                boton.className = 'boton_numero_pagina_inventario';
                boton.textContent = numeroPagina;

                if (numeroPagina === paginaActualMovimientosInventario) {
                    boton.classList.add('pagina_actual_inventario');
                    boton.setAttribute('aria-current', 'page');
                }

                boton.addEventListener('click', function() {
                    paginaActualMovimientosInventario = numeroPagina;
                    cargarMovimientosInventario();
                });

                numeros.appendChild(boton);
            });
        }
    }

    // función para inicializar la vista de inventario
    async function inicializarInventario() {

        configurarPestanasInventario();
        configurarFiltrosInventario();
        configurarSelectoresVisualesInventario();
        configurarAjusteManualInventario();
        configurarHistorialProductoInventario();
        configurarVistaFotoInventario();

        configurarPaginacionInventario();


        // recalcula el stock minimo antes de cargar los datos
        await recalcularStockMinimoInventario();

        await Promise.all([
            cargarFamiliasInventario(),
            cargarInventario(),
            cargarResumenInventario()
        ]);

    }

    // configura el modal para sumar, restar o fijar el stock de un producto
    function configurarAjusteManualInventario() {
        const modal = document.getElementById('modal_ajuste_stock_inventario');
        const formulario = document.getElementById('formulario_ajuste_stock_inventario');
        const tabla = document.getElementById('cuerpo_tabla_inventario');
        const operacion = document.getElementById('operacion_ajuste_stock_inventario');
        const cantidad = document.getElementById('cantidad_ajuste_stock_inventario');
        const campoLote = document.getElementById('campo_lote_vencimiento_inventario');
        const botonToggleLote = document.getElementById('boton_toggle_lote_vencimiento_inventario');
        const estadoToggleLote = document.getElementById('estado_toggle_lote_vencimiento_inventario');
        const campoFechaLote = document.getElementById('campo_fecha_lote_vencimiento_inventario');
        const fechaVencimiento = document.getElementById('fecha_vencimiento_lote_inventario');
        const etiquetaCantidad = document.getElementById('etiqueta_cantidad_ajuste_stock_inventario');
        const motivo = document.getElementById('motivo_ajuste_stock_inventario');
        const mensaje = document.getElementById('mensaje_ajuste_stock_inventario');
        const botonGuardar = document.getElementById('guardar_ajuste_stock_inventario');
        const etiquetaProducto = document.getElementById('producto_modal_ajuste_stock_inventario');
        let codigoSeleccionado = '';
        let productoBalanzaSeleccionado = false;
        let incluirLoteVencimiento = false;

        if (!modal || !formulario || !tabla) return;

        const cerrar = () => {
            modal.hidden = true;
            modal.setAttribute('aria-hidden', 'true');
            formulario.reset();
            motivo.value = 'Ajuste manual desde inventario';
            incluirLoteVencimiento = false;
            botonToggleLote.setAttribute('aria-pressed', 'false');
            estadoToggleLote.textContent = 'No';
            campoFechaLote.hidden = true;
            fechaVencimiento.required = false;
            fechaVencimiento.disabled = true;
            mensaje.textContent = '';
            if (botonGuardar) botonGuardar.disabled = false;
        };

        const actualizarEtiqueta = () => {
            const unidad = productoBalanzaSeleccionado ? ' (KG)' : '';
            const etiquetas = {sumar: `Cantidad a sumar${unidad}`, restar: `Cantidad a restar${unidad}`, fijar: `Nuevo stock total${unidad}`};
            etiquetaCantidad.textContent = etiquetas[operacion.value] || `Cantidad${unidad}`;
            cantidad.min = operacion.value === 'fijar' ? '0' : '0.0001';
            campoLote.hidden = operacion.value !== 'sumar';
            if (operacion.value !== 'sumar' && incluirLoteVencimiento) {
                incluirLoteVencimiento = false;
                botonToggleLote.setAttribute('aria-pressed', 'false');
                estadoToggleLote.textContent = 'No';
                campoFechaLote.hidden = true;
                fechaVencimiento.required = false;
                fechaVencimiento.disabled = true;
                fechaVencimiento.value = '';
            }
        };

        tabla.onclick = (evento) => {
            const boton = evento.target.closest('.boton_ajustar_stock_inventario');
            if (!boton) return;
            codigoSeleccionado = boton.dataset.codigo;
            const productoSeleccionado = inventarioCargado.find(producto => String(producto.codigo) === codigoSeleccionado);
            productoBalanzaSeleccionado = Boolean(productoSeleccionado?.es_producto_balanza);
            etiquetaProducto.textContent = `${boton.dataset.descripcion} · Stock actual: ${formatearCantidadInventario(productoSeleccionado?.stock_actual ?? 0, productoSeleccionado?.es_producto_balanza)}`;
            actualizarEtiqueta();
            modal.hidden = false;
            modal.setAttribute('aria-hidden', 'false');
            cantidad.focus();
        };

        document.getElementById('cerrar_modal_ajuste_stock_inventario').onclick = cerrar;
        document.getElementById('cancelar_ajuste_stock_inventario').onclick = cerrar;
        operacion.onchange = actualizarEtiqueta;
        botonToggleLote.onclick = () => {
            incluirLoteVencimiento = !incluirLoteVencimiento;
            botonToggleLote.setAttribute('aria-pressed', String(incluirLoteVencimiento));
            estadoToggleLote.textContent = incluirLoteVencimiento ? 'Sí' : 'No';
            campoFechaLote.hidden = !incluirLoteVencimiento;
            fechaVencimiento.disabled = !incluirLoteVencimiento;
            fechaVencimiento.required = incluirLoteVencimiento;
            if (incluirLoteVencimiento) fechaVencimiento.focus();
            else fechaVencimiento.value = '';
        };
        actualizarEtiqueta();

        formulario.onsubmit = async (evento) => {
            evento.preventDefault();
            const valor = Number(cantidad.value);
            if (!codigoSeleccionado || !Number.isFinite(valor) || valor < Number(cantidad.min)) {
                mensaje.textContent = 'Ingresa una cantidad válida.';
                return;
            }
            const loteSeGuardara = incluirLoteVencimiento;
            const fechaLoteGuardada = fechaVencimiento.value;
            botonGuardar.disabled = true;
            mensaje.textContent = 'Guardando ajuste…';
            try {
                const respuesta = await fetchConCsrf(`${URL_API}/api/inventario/ajustar`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({codigo: codigoSeleccionado, cantidad: valor, operacion: operacion.value, motivo: motivo.value.trim(), fecha_vencimiento: incluirLoteVencimiento ? fechaVencimiento.value : null})
                });
                const datos = await respuesta.json();
                if (!respuesta.ok) throw new Error(datos.mensaje || 'No se pudo actualizar el stock.');
                cerrar();
                await Promise.all([cargarInventario(), cargarResumenInventario()]);
                if (typeof mostrarAlertaSuperior === 'function') {
                    const mensajeExito = `Stock actualizado: ${formatearCantidadInventario(datos.inventario.stock_actual, productoBalanzaSeleccionado)}${loteSeGuardara ? `. Lote con vencimiento ${fechaLoteGuardada} registrado` : ''}.`;
                    mostrarAlertaSuperior(mensajeExito);
                }
            } catch (error) {
                mensaje.textContent = error.message || 'No se pudo guardar el ajuste.';
                botonGuardar.disabled = false;
            }
        };
    }

    // consulta y muestra los últimos movimientos asociados al código del producto
    function configurarHistorialProductoInventario() {
        const tabla = document.getElementById('cuerpo_tabla_inventario');
        const modal = document.getElementById('modal_historial_producto_inventario');
        const nombre = document.getElementById('nombre_historial_producto_inventario');
        const mensaje = document.getElementById('mensaje_historial_producto_inventario');
        const contenedor = document.getElementById('tabla_historial_producto_inventario_contenedor');
        const filas = document.getElementById('filas_historial_producto_inventario');
        const paginacion = document.getElementById('paginacion_historial_producto_inventario');
        const textoPagina = document.getElementById('texto_pagina_historial_producto_inventario');
        const botonAnterior = document.getElementById('anterior_historial_producto_inventario');
        const botonSiguiente = document.getElementById('siguiente_historial_producto_inventario');
        let codigoActual = '';
        let paginaActual = 1;
        let totalPaginas = 1;
        if (!tabla || !modal) return;
        if (modal.dataset.historialConfigurado === 'true') return;
        modal.dataset.historialConfigurado = 'true';

        const cerrar = () => {
            modal.hidden = true;
            modal.setAttribute('aria-hidden', 'true');
        };

        const cargarPagina = async () => {
            mensaje.textContent = 'Cargando movimientos…';
            contenedor.hidden = true;
            paginacion.hidden = true;
            filas.replaceChildren();
            try {
                const parametros = new URLSearchParams({codigo: codigoActual, pagina: String(paginaActual), limite: '10', orden: 'recientes'});
                const respuesta = await fetchConCsrf(`${URL_API}/api/inventario/movimientos?${parametros.toString()}`, {method: 'GET', credentials: 'include'});
                const datos = await respuesta.json();
                if (!respuesta.ok) throw new Error(datos.mensaje || 'No se pudieron cargar los movimientos.');
                const movimientos = Array.isArray(datos.movimientos) ? datos.movimientos : [];
                paginaActual = Number(datos.paginacion?.pagina_actual) || paginaActual;
                totalPaginas = Number(datos.paginacion?.total_paginas) || 1;
                if (!movimientos.length) {
                    mensaje.textContent = 'Este producto todavía no tiene movimientos registrados.';
                    return;
                }
                movimientos.forEach((movimiento) => {
                    const fila = document.createElement('div');
                    fila.className = 'fila_historial_producto_inventario';
                    fila.setAttribute('role', 'row');
                    const fecha = new Date(movimiento.fecha_hora);
                    const producto = inventarioCargado.find(item => String(item.codigo) === codigoActual);
                    const valores = [Number.isNaN(fecha.getTime()) ? '—' : fecha.toLocaleString('es-CL'), movimiento.tipo || '—', formatearCantidadInventario(movimiento.cantidad, producto?.es_producto_balanza), movimiento.motivo || '—', movimiento.correo_usuario || '—'];
                    valores.forEach((valor) => {
                        const celda = document.createElement('div');
                        celda.setAttribute('role', 'cell');
                        celda.textContent = String(valor);
                        fila.appendChild(celda);
                    });
                    filas.appendChild(fila);
                });
                mensaje.textContent = `Mostrando ${movimientos.length} movimientos de esta página.`;
                contenedor.hidden = false;
                paginacion.hidden = totalPaginas <= 1;
                textoPagina.textContent = `Página ${paginaActual} de ${totalPaginas}`;
                botonAnterior.disabled = paginaActual <= 1;
                botonSiguiente.disabled = paginaActual >= totalPaginas;
            } catch (error) {
                mensaje.textContent = error.message || 'No se pudieron cargar los movimientos.';
            }
        };

        tabla.addEventListener('click', (evento) => {
            const boton = evento.target.closest('.boton_historial_stock_inventario');
            if (!boton) return;
            codigoActual = boton.dataset.codigo;
            paginaActual = 1;
            totalPaginas = 1;
            modal.hidden = false;
            modal.setAttribute('aria-hidden', 'false');
            nombre.textContent = `${boton.dataset.descripcion} · Código ${codigoActual}`;
            cargarPagina();
        });

        botonAnterior.onclick = () => {
            if (paginaActual > 1) {
                paginaActual--;
                cargarPagina();
            }
        };
        botonSiguiente.onclick = () => {
            if (paginaActual < totalPaginas) {
                paginaActual++;
                cargarPagina();
            }
        };
        document.getElementById('cerrar_modal_historial_producto_inventario').onclick = cerrar;
    }

    // abre la fotografía del producto en una vista ampliada
    function configurarVistaFotoInventario() {
        const tabla = document.getElementById('cuerpo_tabla_inventario');
        const modal = document.getElementById('modal_foto_producto_inventario');
        const foto = document.getElementById('foto_ampliada_producto_inventario');
        const titulo = document.getElementById('titulo_modal_foto_producto_inventario');
        const botonCerrar = document.getElementById('cerrar_modal_foto_producto_inventario');
        if (!tabla || !modal || modal.dataset.configurado === 'true') return;
        modal.dataset.configurado = 'true';

        const cerrar = () => {
            modal.hidden = true;
            modal.setAttribute('aria-hidden', 'true');
            foto.removeAttribute('src');
        };

        tabla.addEventListener('click', (evento) => {
            const boton = evento.target.closest('.boton_ver_foto_inventario');
            if (!boton) return;
            const miniatura = boton.querySelector('img');
            if (!miniatura || miniatura.classList.contains('imagen_miniatura_inventario_vacia')) return;
            foto.src = miniatura.src;
            foto.alt = miniatura.alt;
            titulo.textContent = boton.dataset.descripcion;
            modal.hidden = false;
            modal.setAttribute('aria-hidden', 'false');
            botonCerrar.focus();
        });

        botonCerrar.onclick = cerrar;
        modal.addEventListener('keydown', (evento) => {
            if (evento.key === 'Escape') cerrar();
        });
    }
