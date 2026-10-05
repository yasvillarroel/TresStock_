// variables de paginacion
let paginaActualVentas = 1;
let totalPaginasVentas = 1;

const ventasPorPagina = 20;

// temporizador utilizado para la búsqueda
let temporizadorBusquedaVentas = null;


// TITULO 1 IMPORTACION VENTAS

    // abre el formulario de importación
    function abrirImportacionVentas() {

        const contenedor = document.getElementById(
            'contenedor_importacion_ventas'
        );

        if (contenedor) {

            contenedor.classList.remove(
                'contenedor_importacion_ventas_oculto'
            );

        }

    }


    // cierra el formulario de importación
    function cerrarImportacionVentas() {

        const contenedor = document.getElementById(
            'contenedor_importacion_ventas'
        );

        const inputArchivo = document.getElementById(
            'input_archivo_ventas'
        );

        const informacionArchivo = document.getElementById(
            'informacion_archivo_ventas'
        );


        if (contenedor) {

            contenedor.classList.add(
                'contenedor_importacion_ventas_oculto'
            );

        }


        if (inputArchivo) {

            inputArchivo.value = '';

        }


        if (informacionArchivo) {

            informacionArchivo.textContent =
                'No se ha seleccionado ningún archivo.';

        }

    }


    // abre el explorador de archivos
    function seleccionarArchivoVentas() {

        const inputArchivo = document.getElementById(
            'input_archivo_ventas'
        );

        if (inputArchivo) {

            inputArchivo.click();

        }

    }


    // configura el selector del archivo
    function configurarImportacionVentas() {

        const inputArchivo = document.getElementById(
            'input_archivo_ventas'
        );


        if (!inputArchivo) {

            return;

        }


        inputArchivo.addEventListener(
            'change',
            function() {

                const informacionArchivo = document.getElementById(
                    'informacion_archivo_ventas'
                );

                const archivo = this.files[0];


                if (!informacionArchivo) {

                    return;

                }


                if (!archivo) {

                    informacionArchivo.textContent =
                        'No se ha seleccionado ningún archivo.';

                    return;

                }


                informacionArchivo.textContent =
                    'Archivo seleccionado: ' +
                    archivo.name;

            }
        );

    }


    // envía el archivo CSV al backend
    async function importarVentas() {

        const inputArchivo = document.getElementById(
            'input_archivo_ventas'
        );

        const informacionArchivo = document.getElementById(
            'informacion_archivo_ventas'
        );


        if (
            !inputArchivo ||
            !informacionArchivo
        ) {

            return;

        }


        const archivo =
            inputArchivo.files[0];


        if (!archivo) {

            informacionArchivo.textContent =
                'Selecciona un archivo antes de importar.';

            return;

        }


        informacionArchivo.textContent =
            'Importando ventas. Este proceso puede tardar algunos minutos...';


        const datos =
            new FormData();


        datos.append(
            'archivo',
            archivo
        );


        try {

            const respuesta = await fetch(
                'http://127.0.0.1:3000/api/ventas/importar',
                {
                    method: 'POST',
                    body: datos,
                    credentials: 'include'
                }
            );


            const resultado =
                await respuesta.json();


            // muestra temporalmente los problemas encontrados durante la importacion
            console.log(
                'Productos no encontrados:',
                resultado.productos_no_encontrados
            );

            console.log(
                'Filas ignoradas:',
                resultado.filas_ignoradas_detalle
            );


            if (!respuesta.ok) {

                informacionArchivo.textContent =
                    resultado.mensaje ||
                    'No se pudo importar el archivo.';

                return;

            }


            const resumen =
                resultado.resumen;


            informacionArchivo.textContent =
                'Importación completada\n\n' +

                'Filas procesadas: ' +
                Number(
                    resumen.total_filas || 0
                ).toLocaleString('es-CL') +

                '\nBoletas importadas: ' +
                Number(
                    resumen.boletas_importadas || 0
                ).toLocaleString('es-CL') +

                '\nDetalles importados: ' +
                Number(
                    resumen.detalles_importados || 0
                ).toLocaleString('es-CL') +

                '\nBoletas que ya existían: ' +
                Number(
                    resumen.boletas_existentes || 0
                ).toLocaleString('es-CL') +

                '\nDetalles sin producto encontrado: ' +
                Number(
                    resumen.detalles_sin_producto || 0
                ).toLocaleString('es-CL') +

                '\nOperaciones negativas importadas: ' +
                Number(
                    resumen.operaciones_negativas || 0
                ).toLocaleString('es-CL') +

                '\nFilas ignoradas: ' +
                Number(
                    resumen.filas_ignoradas || 0
                ).toLocaleString('es-CL');


            paginaActualVentas = 1;

            await cargarVentas();
            await cargarResumenVentas();


        } catch (error) {

            console.error(
                'Error al importar ventas:',
                error
            );


            informacionArchivo.textContent =
                'No se pudo conectar con el servidor.';

        }

    }


// TITULO 2 CARGAR VENTAS

    // obtiene las ventas desde el backend
    async function cargarVentas() {

        const inputBusqueda = document.getElementById(
            'input_busqueda_ventas'
        );

        const inputDesde = document.getElementById(
            'input_fecha_desde_ventas'
        );

        const inputHasta = document.getElementById(
            'input_fecha_hasta_ventas'
        );


        const buscar =
            inputBusqueda
                ? inputBusqueda.value.trim()
                : '';

        const desde =
            inputDesde
                ? inputDesde.value
                : '';

        const hasta =
            inputHasta
                ? inputHasta.value
                : '';


        const parametros =
            new URLSearchParams();


        parametros.set(
            'pagina',
            paginaActualVentas
        );

        parametros.set(
            'limite',
            ventasPorPagina
        );


        if (buscar) {

            parametros.set(
                'buscar',
                buscar
            );

        }


        if (desde) {

            parametros.set(
                'desde',
                desde
            );

        }


        if (hasta) {

            parametros.set(
                'hasta',
                hasta
            );

        }


        try {

            const respuesta = await fetch(
                'http://127.0.0.1:3000/api/ventas?' +
                parametros.toString(),
                {
                    method: 'GET',
                    credentials: 'include'
                }
            );


            const resultado =
                await respuesta.json();


            if (!respuesta.ok) {

                console.error(
                    'Error al obtener ventas:',
                    resultado
                );

                return;

            }


            mostrarVentas(
                resultado.ventas || []
            );


            totalPaginasVentas =
                Number(
                    resultado.paginacion?.total_paginas || 1
                );


            mostrarPaginacionVentas(
                totalPaginasVentas
            );


        } catch (error) {

            console.error(
                'Error al cargar ventas:',
                error
            );

        }

    }


// TITULO 3 MOSTRAR VENTAS

    // muestra las ventas en la tabla
    function mostrarVentas(ventas) {

        const cuerpoTabla = document.getElementById(
            'cuerpo_tabla_ventas'
        );


        if (!cuerpoTabla) {

            return;

        }


        cuerpoTabla.innerHTML = '';


        if (!ventas.length) {

            cuerpoTabla.innerHTML = `
                <tr class="fila_sin_ventas">
                    <td
                        class="dato_sin_ventas"
                        colspan="5"
                    >
                        No hay ventas cargadas para mostrar.
                    </td>
                </tr>
            `;

            return;

        }


        ventas.forEach(
            function(venta) {

                const fila =
                    document.createElement(
                        'tr'
                    );


                fila.className =
                    'fila_venta';


                const total =
                    formatearDineroVentas(
                        venta.total
                    );


                fila.innerHTML = `
                    <td class="dato_boleta_ventas">
                        ${venta.boleta || '-'}
                    </td>

                    <td class="dato_fecha_ventas">
                        ${venta.fecha || '-'}
                    </td>

                    <td class="dato_hora_ventas">
                        ${venta.hora || '-'}
                    </td>

                    <td class="dato_total_ventas">
                        ${total}
                    </td>

                    <td class="dato_acciones_ventas">

                        <div
                            class="boton_ver_venta"
                            onclick="verDetalleVenta(${venta.id_venta})"
                        >
                            Ver
                        </div>

                    </td>
                `;


                cuerpoTabla.appendChild(
                    fila
                );

            }
        );

    }


// TITULO 4 INDICADORES VENTAS

    // obtiene los indicadores principales
    async function cargarResumenVentas() {

        try {

            const respuesta = await fetch(
                'http://127.0.0.1:3000/api/ventas/resumen',
                {
                    method: 'GET',
                    credentials: 'include'
                }
            );


            const resumen =
                await respuesta.json();


            if (!respuesta.ok) {

                console.error(
                    'Error al obtener resumen de ventas:',
                    resumen
                );

                return;

            }


            const valorTotalVentas = document.getElementById(
                'valor_total_ventas'
            );

            const valorVentasDia = document.getElementById(
                'valor_ventas_dia'
            );

            const valorTotalVendido = document.getElementById(
                'valor_total_vendido'
            );


            if (valorTotalVentas) {

                valorTotalVentas.textContent =
                    Number(
                        resumen.total_ventas || 0
                    ).toLocaleString(
                        'es-CL'
                    );

            }


            if (valorVentasDia) {

                valorVentasDia.textContent =
                    Number(
                        resumen.ventas_dia || 0
                    ).toLocaleString(
                        'es-CL'
                    );

            }


            if (valorTotalVendido) {

                valorTotalVendido.textContent =
                    formatearDineroVentas(
                        resumen.total_vendido
                    );

            }


        } catch (error) {

            console.error(
                'Error al cargar resumen de ventas:',
                error
            );

        }

    }


// TITULO 5 DETALLE VENTA

    // obtiene y muestra el detalle de una venta
    async function verDetalleVenta(idVenta) {

        try {

            const respuesta = await fetch(
                'http://127.0.0.1:3000/api/ventas/' +
                idVenta +
                '/detalle',
                {
                    method: 'GET',
                    credentials: 'include'
                }
            );


            const resultado =
                await respuesta.json();


            if (!respuesta.ok) {

                console.error(
                    'Error al obtener detalle:',
                    resultado
                );

                return;

            }


            const contenedor = document.getElementById(
                'contenedor_detalle_venta'
            );

            const titulo = document.getElementById(
                'titulo_detalle_venta'
            );

            const fecha = document.getElementById(
                'fecha_detalle_venta'
            );

            const total = document.getElementById(
                'total_detalle_venta'
            );

            const cuerpoTabla = document.getElementById(
                'cuerpo_tabla_detalle_venta'
            );


            if (
                !contenedor ||
                !titulo ||
                !fecha ||
                !total ||
                !cuerpoTabla
            ) {

                return;

            }


            titulo.textContent =
                'Boleta Nº ' +
                resultado.venta.boleta;


            fecha.textContent =
                resultado.venta.fecha +
                ' - ' +
                resultado.venta.hora;


            total.textContent =
                'Total: ' +
                formatearDineroVentas(
                    resultado.venta.total
                );


            cuerpoTabla.innerHTML = '';


            resultado.detalles.forEach(
                function(detalle) {

                    const fila =
                        document.createElement(
                            'tr'
                        );


                    fila.className =
                        'fila_producto_detalle_venta';


                    fila.innerHTML = `
                        <td class="dato_producto_detalle_venta">

                            ${detalle.descripcion || detalle.codigo}

                        </td>

                        <td class="dato_cantidad_detalle_venta">

                            ${formatearCantidadVentas(
                                detalle.cantidad
                            )}

                        </td>

                        <td class="dato_precio_detalle_venta">

                            ${formatearDineroVentas(
                                detalle.precio
                            )}

                        </td>

                        <td class="dato_valorizado_detalle_venta">

                            ${formatearDineroVentas(
                                detalle.valorizado
                            )}

                        </td>
                    `;


                    cuerpoTabla.appendChild(
                        fila
                    );

                }
            );


            contenedor.classList.remove(
                'contenedor_detalle_venta_oculto'
            );


        } catch (error) {

            console.error(
                'Error al cargar detalle de venta:',
                error
            );

        }

    }


    // cierra el detalle
    function cerrarDetalleVenta() {

        const contenedor = document.getElementById(
            'contenedor_detalle_venta'
        );


        if (contenedor) {

            contenedor.classList.add(
                'contenedor_detalle_venta_oculto'
            );

        }

    }


// TITULO 6 FILTROS VENTAS

    // configura búsqueda y fechas
    function configurarFiltrosVentas() {

        const inputBusqueda = document.getElementById(
            'input_busqueda_ventas'
        );

        const inputDesde = document.getElementById(
            'input_fecha_desde_ventas'
        );

        const inputHasta = document.getElementById(
            'input_fecha_hasta_ventas'
        );


        if (inputBusqueda) {

            inputBusqueda.addEventListener(
                'input',
                function() {

                    clearTimeout(
                        temporizadorBusquedaVentas
                    );


                    temporizadorBusquedaVentas =
                        setTimeout(
                            function() {

                                paginaActualVentas = 1;

                                cargarVentas();

                            },
                            300
                        );

                }
            );

        }


        if (inputDesde) {

            inputDesde.addEventListener(
                'change',
                function() {

                    paginaActualVentas = 1;

                    cargarVentas();

                }
            );

        }


        if (inputHasta) {

            inputHasta.addEventListener(
                'change',
                function() {

                    paginaActualVentas = 1;

                    cargarVentas();

                }
            );

        }

    }


// TITULO 7 PAGINACION VENTAS

    // cambia la página
    function cambiarPaginaVentas(pagina) {

        if (
            pagina < 1 ||
            pagina > totalPaginasVentas
        ) {

            return;

        }


        paginaActualVentas =
            pagina;


        cargarVentas();

    }


    // muestra los controles de paginación
    function mostrarPaginacionVentas(totalPaginas) {

        const contenedor = document.getElementById(
            'contenedor_paginacion_ventas'
        );

        const numeros = document.getElementById(
            'numeros_paginas_ventas'
        );

        const anterior = document.getElementById(
            'boton_pagina_anterior_ventas'
        );

        const siguiente = document.getElementById(
            'boton_pagina_siguiente_ventas'
        );


        if (
            !contenedor ||
            !numeros ||
            !anterior ||
            !siguiente
        ) {

            return;

        }


        if (totalPaginas <= 1) {

            contenedor.style.display =
                'none';

            return;

        }


        contenedor.style.display =
            'flex';


        anterior.disabled =
            paginaActualVentas === 1;


        siguiente.disabled =
            paginaActualVentas === totalPaginas;


        anterior.onclick =
            function() {

                cambiarPaginaVentas(
                    paginaActualVentas - 1
                );

            };


        siguiente.onclick =
            function() {

                cambiarPaginaVentas(
                    paginaActualVentas + 1
                );

            };


        numeros.innerHTML = '';


        const paginasMostrar = [];


        if (totalPaginas <= 7) {

            for (
                let pagina = 1;
                pagina <= totalPaginas;
                pagina++
            ) {

                paginasMostrar.push(
                    pagina
                );

            }

        } else {

            paginasMostrar.push(1);


            if (
                paginaActualVentas > 4
            ) {

                paginasMostrar.push(
                    '...'
                );

            }


            const inicio =
                Math.max(
                    2,
                    paginaActualVentas - 2
                );


            const fin =
                Math.min(
                    totalPaginas - 1,
                    paginaActualVentas + 2
                );


            for (
                let pagina = inicio;
                pagina <= fin;
                pagina++
            ) {

                paginasMostrar.push(
                    pagina
                );

            }


            if (
                paginaActualVentas <
                totalPaginas - 3
            ) {

                paginasMostrar.push(
                    '...'
                );

            }


            paginasMostrar.push(
                totalPaginas
            );

        }


        paginasMostrar.forEach(
            function(pagina) {

                if (pagina === '...') {

                    const puntos =
                        document.createElement(
                            'span'
                        );


                    puntos.className =
                        'puntos_paginacion_ventas';


                    puntos.textContent =
                        '...';


                    numeros.appendChild(
                        puntos
                    );

                    return;

                }


                const boton =
                    document.createElement(
                        'button'
                    );


                boton.type =
                    'button';


                boton.className =
                    'boton_numero_pagina_ventas';


                boton.textContent =
                    pagina;


                if (
                    pagina ===
                    paginaActualVentas
                ) {

                    boton.classList.add(
                        'pagina_actual_ventas'
                    );

                }


                boton.onclick =
                    function() {

                        cambiarPaginaVentas(
                            pagina
                        );

                    };


                numeros.appendChild(
                    boton
                );

            }
        );

    }


// TITULO 8 FORMATO DATOS VENTAS

    // formatea valores monetarios
    function formatearDineroVentas(valor) {

        return Number(
            valor || 0
        ).toLocaleString(
            'es-CL',
            {
                style: 'currency',
                currency: 'CLP',
                maximumFractionDigits: 0
            }
        );

    }


    // formatea cantidades incluyendo productos por peso
    function formatearCantidadVentas(valor) {

        return Number(
            valor || 0
        ).toLocaleString(
            'es-CL',
            {
                minimumFractionDigits: 0,
                maximumFractionDigits: 4
            }
        );

    }


// TITULO 9 INICIALIZACION VENTAS

    // inicializa el funcionamiento de ventas
    async function inicializarVentas() {

        configurarImportacionVentas();
        configurarFiltrosVentas();

        await Promise.all([
            cargarVentas(),
            cargarResumenVentas()
        ]);

    }