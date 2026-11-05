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

            dato.colSpan = 5;

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
                    producto.stock_minimo_calculable
                        ? formatearCantidadInventario(
                            producto.stock_minimo
                        )
                        : '—';


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

        if (busqueda) {
            busqueda.addEventListener('input', function() {
                clearTimeout(temporizadorBusquedaMovimientosInventario);
                temporizadorBusquedaMovimientosInventario = setTimeout(function() {
                    paginaActualMovimientosInventario = 1;
                    cargarMovimientosInventario();
                }, 250);
            });
        }

        [desde, hasta, orden].forEach(function(control) {
            if (control) {
                control.addEventListener('change', function() {
                    paginaActualMovimientosInventario = 1;
                    cargarMovimientosInventario();
                });
            }
        });

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

        if (['ENTRADA', 'SALIDA', 'AJUSTE'].includes(vistaActivaInventario)) {
            parametros.set('tipo', vistaActivaInventario);
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
            cuerpo.innerHTML = '<tr class="fila_sin_inventario"><td class="dato_sin_inventario" colspan="6">No se pudo cargar el historial de movimientos.</td></tr>';
        }
    }


    // dibuja las filas del historial y actualiza su paginación
    function mostrarMovimientosInventario(movimientos, paginacion) {

        const cuerpo = document.getElementById('cuerpo_movimientos_inventario');
        const informacion = document.getElementById('informacion_movimientos_inventario');
        const pagina = document.getElementById('pagina_movimientos_inventario');
        const anterior = document.getElementById('anterior_movimientos_inventario');
        const siguiente = document.getElementById('siguiente_movimientos_inventario');

        if (!cuerpo) return;

        cuerpo.innerHTML = '';

        if (movimientos.length === 0) {
            cuerpo.innerHTML = '<tr class="fila_sin_inventario"><td class="dato_sin_inventario" colspan="6">No hay movimientos para los filtros seleccionados.</td></tr>';
        }

        movimientos.forEach(function(movimiento) {
            const fila = document.createElement('tr');
            fila.className = 'fila_producto_inventario';

            const fecha = movimiento.fecha_hora
                ? new Date(movimiento.fecha_hora).toLocaleString('es-CL')
                : '-';
            const cantidad = Number(movimiento.cantidad || 0).toLocaleString('es-CL', {
                maximumFractionDigits: 4
            });
            const datos = [
                movimiento.producto || movimiento.codigo || '-',
                movimiento.tipo || '-',
                cantidad,
                movimiento.motivo || '-',
                movimiento.correo_usuario || 'No registrado',
                fecha
            ];

            datos.forEach(function(valor, indice) {
                const celda = document.createElement('td');
                celda.className = indice === 0
                    ? 'dato_producto_inventario'
                    : 'dato_movimiento_inventario';
                celda.textContent = valor;
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
        if (pagina) {
            pagina.textContent = `Página ${paginaActualMovimientosInventario} de ${totalPaginasMovimientosInventario}`;
        }
        if (anterior) anterior.disabled = paginaActualMovimientosInventario <= 1;
        if (siguiente) siguiente.disabled = paginaActualMovimientosInventario >= totalPaginasMovimientosInventario;
    }

    // función para inicializar la vista de inventario
    async function inicializarInventario() {

        configurarPestanasInventario();
        configurarFiltrosInventario();

        configurarPaginacionInventario();


        // recalcula el stock minimo antes de cargar los datos
        await recalcularStockMinimoInventario();

        await Promise.all([
            cargarFamiliasInventario(),
            cargarInventario(),
            cargarResumenInventario()
        ]);

    }
