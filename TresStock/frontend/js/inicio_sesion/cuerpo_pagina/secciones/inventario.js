// TITULO 1 CONTENEDOR INVENTARIO

    // arreglo para almacenar el inventario obtenido desde la base de datos
    let inventarioCargado = [];

    // arreglo para almacenar los productos filtrados
    let inventarioFiltrado = [];

    // almacena la página actual
    let paginaActualInventario = 1;

    // cantidad de productos mostrados por página
    const productosPorPaginaInventario = 20;

    // almacena el código del producto cuyo stock mínimo se editará
    let codigoProductoStockMinimo = null;


// TITULO 2 ENCABEZADO INVENTARIO

    // sin función


// TITULO 3 INDICADORES INVENTARIO

    // función para cargar los indicadores desde la API
    async function cargarResumenInventario() {

        try {

            const respuesta = await fetch(
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

            const respuesta = await fetch(
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


// TITULO 6 TABLA INVENTARIO

    // función para obtener el inventario desde la API
    async function cargarInventario() {

        try {

            const respuesta = await fetch(
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


            inventarioFiltrado =
                [...inventarioCargado];


            mostrarInventario();


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
                document.createElement('tr');

            fila.className =
                'fila_sin_inventario';


            const dato =
                document.createElement('td');

            dato.className =
                'dato_sin_inventario';

            dato.colSpan = 6;

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
                        'tr'
                    );

                fila.className =
                    'fila_producto_inventario';


                // producto
                const datoProducto =
                    document.createElement(
                        'td'
                    );

                datoProducto.className =
                    'dato_producto_inventario';

                datoProducto.textContent =
                    producto.descripcion ||
                    '-';


                // familia
                const datoFamilia =
                    document.createElement(
                        'td'
                    );

                datoFamilia.className =
                    'dato_familia_inventario';

                datoFamilia.textContent =
                    producto.familia ||
                    '-';


                // stock actual
                const datoStockActual =
                    document.createElement(
                        'td'
                    );

                datoStockActual.className =
                    'dato_stock_actual_inventario';

                datoStockActual.textContent =
                    formatearCantidadInventario(
                        producto.stock_actual
                    );


                // stock mínimo
                const datoStockMinimo =
                    document.createElement(
                        'td'
                    );

                datoStockMinimo.className =
                    'dato_stock_minimo_inventario';

                datoStockMinimo.textContent =
                    formatearCantidadInventario(
                        producto.stock_minimo
                    );


                // estado
                const datoEstado =
                    document.createElement(
                        'td'
                    );

                datoEstado.className =
                    'dato_estado_inventario';


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


                // acciones
                const datoAcciones =
                    document.createElement(
                        'td'
                    );

                datoAcciones.className =
                    'dato_acciones_inventario';


                const botonStockMinimo =
                    document.createElement(
                        'div'
                    );

                botonStockMinimo.className =
                    'boton_stock_minimo_inventario';

                botonStockMinimo.textContent =
                    'Stock mínimo';


                botonStockMinimo.addEventListener(
                    'click',
                    () => {

                        abrirFormularioStockMinimoInventario(
                            producto
                        );

                    }
                );


                datoAcciones.appendChild(
                    botonStockMinimo
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

                fila.appendChild(
                    datoAcciones
                );


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


        elemento.className =
            'estado_optimo_inventario';

        elemento.textContent =
            'Óptimo';

    }


    // función para mostrar cantidades
    function formatearCantidadInventario(
        valor
    ) {

        const numero =
            Number(
                valor || 0
            );


        return numero.toLocaleString(
            'es-CL',
            {
                minimumFractionDigits: 0,
                maximumFractionDigits: 3
            }
        );

    }


// TITULO 7 PAGINACION INVENTARIO

    // función para actualizar la paginación
    function actualizarPaginacionInventario() {

        const textoPaginacion =
            document.getElementById(
                'texto_paginacion_inventario'
            );

        const controles =
            document.getElementById(
                'controles_paginacion_inventario'
            );


        if (
            !textoPaginacion ||
            !controles
        ) {
            return;
        }


        controles.innerHTML = '';


        const totalProductos =
            inventarioFiltrado.length;


        const totalPaginas =
            Math.max(
                1,
                Math.ceil(
                    totalProductos /
                    productosPorPaginaInventario
                )
            );


        if (
            paginaActualInventario >
            totalPaginas
        ) {

            paginaActualInventario =
                totalPaginas;

        }


        if (totalProductos === 0) {

            textoPaginacion.textContent =
                'Mostrando 0 productos';

            return;

        }


        const inicio =
            (
                paginaActualInventario -
                1
            ) *
            productosPorPaginaInventario +
            1;


        const fin =
            Math.min(
                paginaActualInventario *
                    productosPorPaginaInventario,
                totalProductos
            );


        textoPaginacion.textContent =
            `Mostrando ${inicio} a ${fin} de ${formatearNumeroInventario(totalProductos)} productos`;


        // botón anterior
        const botonAnterior =
            document.createElement(
                'div'
            );

        botonAnterior.className =
            'boton_pagina_inventario';

        botonAnterior.textContent =
            '‹';


        botonAnterior.addEventListener(
            'click',
            () => {

                if (
                    paginaActualInventario >
                    1
                ) {

                    paginaActualInventario--;

                    mostrarInventario();

                }

            }
        );


        controles.appendChild(
            botonAnterior
        );


        const paginasMostrar =
            obtenerPaginasInventario(
                totalPaginas
            );


        paginasMostrar.forEach(
            pagina => {

                if (pagina === '...') {

                    const separador =
                        document.createElement(
                            'div'
                        );

                    separador.className =
                        'boton_pagina_inventario';

                    separador.textContent =
                        '...';


                    controles.appendChild(
                        separador
                    );

                    return;

                }


                const botonPagina =
                    document.createElement(
                        'div'
                    );

                botonPagina.className =
                    'boton_pagina_inventario';


                if (
                    pagina ===
                    paginaActualInventario
                ) {

                    botonPagina.classList.add(
                        'boton_pagina_activa_inventario'
                    );

                }


                botonPagina.textContent =
                    pagina;


                botonPagina.addEventListener(
                    'click',
                    () => {

                        paginaActualInventario =
                            pagina;

                        mostrarInventario();

                    }
                );


                controles.appendChild(
                    botonPagina
                );

            }
        );


        // botón siguiente
        const botonSiguiente =
            document.createElement(
                'div'
            );

        botonSiguiente.className =
            'boton_pagina_inventario';

        botonSiguiente.textContent =
            '›';


        botonSiguiente.addEventListener(
            'click',
            () => {

                if (
                    paginaActualInventario <
                    totalPaginas
                ) {

                    paginaActualInventario++;

                    mostrarInventario();

                }

            }
        );


        controles.appendChild(
            botonSiguiente
        );

    }


    // función para determinar las páginas visibles
    function obtenerPaginasInventario(
        totalPaginas
    ) {

        if (totalPaginas <= 7) {

            const paginas = [];


            for (
                let pagina = 1;
                pagina <= totalPaginas;
                pagina++
            ) {

                paginas.push(
                    pagina
                );

            }


            return paginas;

        }


        if (
            paginaActualInventario <=
            4
        ) {

            return [
                1,
                2,
                3,
                4,
                5,
                '...',
                totalPaginas
            ];

        }


        if (
            paginaActualInventario >=
            totalPaginas - 3
        ) {

            return [
                1,
                '...',
                totalPaginas - 4,
                totalPaginas - 3,
                totalPaginas - 2,
                totalPaginas - 1,
                totalPaginas
            ];

        }


        return [
            1,
            '...',
            paginaActualInventario - 1,
            paginaActualInventario,
            paginaActualInventario + 1,
            '...',
            totalPaginas
        ];

    }


// TITULO 8 FORMULARIO STOCK MINIMO

    // función para abrir el formulario
    function abrirFormularioStockMinimoInventario(
        producto
    ) {

        codigoProductoStockMinimo =
            producto.codigo;


        const contenedor =
            document.getElementById(
                'contenedor_formulario_stock_minimo_inventario'
            );

        const valorProducto =
            document.getElementById(
                'valor_producto_stock_minimo_inventario'
            );

        const inputStockMinimo =
            document.getElementById(
                'input_stock_minimo_inventario'
            );


        if (valorProducto) {

            valorProducto.textContent =
                producto.descripcion ||
                '-';

        }


        if (inputStockMinimo) {

            inputStockMinimo.value =
                producto.stock_minimo ||
                0;

        }


        if (contenedor) {

            contenedor.classList.remove(
                'contenedor_formulario_stock_minimo_inventario_oculto'
            );

        }

    }


    // función para cerrar el formulario
    function cerrarFormularioStockMinimoInventario() {

        const contenedor =
            document.getElementById(
                'contenedor_formulario_stock_minimo_inventario'
            );


        if (contenedor) {

            contenedor.classList.add(
                'contenedor_formulario_stock_minimo_inventario_oculto'
            );

        }


        codigoProductoStockMinimo =
            null;

    }


// TITULO 9 CABECERA FORMULARIO STOCK MINIMO

    // sin función


// TITULO 10 ACCIONES FORMULARIO STOCK MINIMO

    // función para guardar el stock mínimo
    async function guardarStockMinimoInventario() {

        if (
            !codigoProductoStockMinimo
        ) {
            return;
        }


        const inputStockMinimo =
            document.getElementById(
                'input_stock_minimo_inventario'
            );


        if (!inputStockMinimo) {
            return;
        }


        const stockMinimo =
            Number(
                inputStockMinimo.value
            );


        if (
            Number.isNaN(stockMinimo) ||
            stockMinimo < 0
        ) {

            alert(
                'El stock mínimo debe ser igual o mayor a 0.'
            );

            return;

        }


        try {

            const respuesta = await fetch(
                `http://127.0.0.1:3000/api/inventario/${encodeURIComponent(codigoProductoStockMinimo)}/stock-minimo`,
                {
                    method: 'PUT',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    credentials:
                        'include',

                    body: JSON.stringify({
                        stock_minimo:
                            stockMinimo
                    })
                }
            );


            const resultado =
                await respuesta.json();


            if (!respuesta.ok) {

                alert(
                    resultado.mensaje ||
                    'No se pudo actualizar el stock mínimo.'
                );

                return;

            }


            cerrarFormularioStockMinimoInventario();


            await Promise.all([
                cargarInventario(),
                cargarResumenInventario()
            ]);


        } catch (error) {

            console.error(
                'Error al actualizar stock mínimo:',
                error
            );


            alert(
                'No se pudo conectar con el servidor.'
            );

        }

    }


// TITULO 11 INICIALIZACION INVENTARIO

    // función para inicializar la vista de inventario
    async function inicializarInventario() {

        configurarFiltrosInventario();


        const botonCerrar =
            document.getElementById(
                'boton_cerrar_stock_minimo_inventario'
            );

        const botonCancelar =
            document.getElementById(
                'boton_cancelar_stock_minimo_inventario'
            );

        const botonGuardar =
            document.getElementById(
                'boton_guardar_stock_minimo_inventario'
            );


        if (botonCerrar) {

            botonCerrar.addEventListener(
                'click',
                cerrarFormularioStockMinimoInventario
            );

        }


        if (botonCancelar) {

            botonCancelar.addEventListener(
                'click',
                cerrarFormularioStockMinimoInventario
            );

        }


        if (botonGuardar) {

            botonGuardar.addEventListener(
                'click',
                guardarStockMinimoInventario
            );

        }


        await Promise.all([
            cargarFamiliasInventario(),
            cargarInventario(),
            cargarResumenInventario()
        ]);

    }