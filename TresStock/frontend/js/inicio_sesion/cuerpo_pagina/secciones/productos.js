// variable para almacenar los productos obtenidos desde el backend
let productosCargados = [];


let modoFormularioProducto = 'nuevo';
let codigoOriginalProducto = null;
let imagenOriginalProducto = null;
let imagenGuardadaProducto = null;
let archivoImagenManualProducto = null;
let urlVistaPreviaManualProducto = null;
let imagenNuevaBuscadaProducto = false;
let codigoBarraImagenBuscadaProducto = null;
let busquedaImagenProductoSecuencia = 0;
let buscandoImagenProducto = false;
let guardandoProducto = false;
let listaProveedoresProducto = null;
let importandoArchivoProductos = false;


// variables de paginacion

let paginaActualProductos = 1;
const productosPorPagina = 120;

// almacenar los productos actuales que se estan mostrando 
let productosFiltradosActuales = [];

// TITULO 1 FORMULARIO PRODUCTO

    // función para mostrar el formulario de registro de un nuevo producto
    function abrirFormularioProducto() {

        const contenedorFormularioProducto = document.getElementById(
            'contenedor_formulario_producto'
        );

        const tituloFormularioProducto = document.getElementById(
            'titulo_formulario_producto'
        );

        if (tituloFormularioProducto) {

            tituloFormularioProducto.textContent = 'Nuevo producto';

        }

        limpiarFormularioProducto();

        modoFormularioProducto = 'nuevo';
        codigoOriginalProducto = null;
        imagenOriginalProducto = null;
        imagenGuardadaProducto = null;

        configurarEstadoFormularioProducto();

        cargarOpcionesProveedoresProducto().catch(console.error);


        if (contenedorFormularioProducto) {

            contenedorFormularioProducto.classList.remove(
                'contenedor_formulario_producto_oculto'
            );

        }

    }


    // función para ocultar el formulario de producto
    function cerrarFormularioProducto() {

        // libera la fotografía seleccionada si se cancela/cierra el formulario
        limpiarArchivoImagenManualProducto();

        // ignora respuestas de busquedas pendientes al cerrar el formulario
        busquedaImagenProductoSecuencia++;
        buscandoImagenProducto = false;

        const contenedorFormularioProducto = document.getElementById(
            'contenedor_formulario_producto'
        );


        if (contenedorFormularioProducto) {

            contenedorFormularioProducto.classList.add(
                'contenedor_formulario_producto_oculto'
            );

        }

    }


// TITULO 2 LIMPIEZA FORMULARIO PRODUCTO

    // función para limpiar los campos del formulario de producto
    function limpiarFormularioProducto() {

        const inputCodigoProducto = document.getElementById(
            'input_codigo_producto'
        );

        const inputCodigoBarraProducto = document.getElementById(
            'input_codigo_barra_producto'
        );

        const inputDescripcionProducto = document.getElementById(
            'input_descripcion_producto'
        );

        const inputFamiliaProducto = document.getElementById(
            'input_familia_producto'
        );

        const inputPrecioProducto = document.getElementById(
            'input_precio_producto'
        );

        const selectProveedorProducto = document.getElementById(
            'select_proveedor_producto'
        );


        if (inputCodigoProducto) {
            inputCodigoProducto.value = '';
        }

        if (inputCodigoBarraProducto) {
            inputCodigoBarraProducto.value = '';
        }

        if (inputDescripcionProducto) {
            inputDescripcionProducto.value = '';
        }

        if (inputFamiliaProducto) {
            inputFamiliaProducto.value = '';
        }

        if (inputPrecioProducto) {
            inputPrecioProducto.value = '';
        }

        if (selectProveedorProducto) {
            selectProveedorProducto.value = '';
        }

        // descarta archivos seleccionados en un producto anterior
        limpiarArchivoImagenManualProducto();

        // restablece la fotografia cada vez que se abre un producto
        busquedaImagenProductoSecuencia++;
        buscandoImagenProducto = false;
        imagenOriginalProducto = null;
        imagenGuardadaProducto = null;
        imagenNuevaBuscadaProducto = false;
        codigoBarraImagenBuscadaProducto = null;
        mostrarVistaPreviaImagenProducto(null,
            'Puedes buscar una imagen o subir una foto desde tu dispositivo.');

    }


// TITULO 3 IMPORTACION PRODUCTOS

    // abre la ventana de importación de productos
    function abrirImportacionProductos() {

        const contenedorImportacion = document.getElementById(
            'contenedor_importacion_productos'
        );

        if (contenedorImportacion) {

            contenedorImportacion.classList.remove(
                'contenedor_importacion_productos_oculto'
            );

        }

    }


    // cierra la ventana de importación de productos
    function cerrarImportacionProductos() {

        const contenedorImportacion = document.getElementById(
            'contenedor_importacion_productos'
        );

        const inputArchivo = document.getElementById(
            'input_archivo_productos'
        );

        const informacionArchivo = document.getElementById(
            'informacion_archivo_productos'
        );


        if (contenedorImportacion) {

            contenedorImportacion.classList.add(
                'contenedor_importacion_productos_oculto'
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
    function seleccionarArchivoProductos() {

        const inputArchivo = document.getElementById(
            'input_archivo_productos'
        );

        if (inputArchivo) {

            inputArchivo.click();

        }

    }


    // configura la selección del archivo
    function configurarImportacionProductos() {

        const inputArchivo = document.getElementById(
            'input_archivo_productos'
        );


        if (!inputArchivo) {
            return;
        }

        inputArchivo.addEventListener('change', function () {

            const informacionArchivo = document.getElementById(
                'informacion_archivo_productos'
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
                'Archivo seleccionado: ' + archivo.name;

        });

    }


    // importa el archivo seleccionado
    async function importarProductos() {

        const inputArchivo = document.getElementById(
            'input_archivo_productos'
        );

        const informacionArchivo = document.getElementById(
            'informacion_archivo_productos'
        );

        if (!inputArchivo || !informacionArchivo || importandoArchivoProductos) {
            return;
        }

        const archivo = inputArchivo.files[0];

        if (!archivo) {

            informacionArchivo.textContent =
                'Selecciona un archivo antes de importar.';

            return;

        }

        // aviso visible antes de reemplazar saldos modificados con el escaner
        const confirmado = confirm(
            'El Excel debe incluir la columna STOCK ACTUAL.\n\n' +
            'La importacion reemplazara el stock actual de TODOS los productos ' +
            'incluidos en el archivo, incluso si ya existen.\n\n' +
            'Esto puede sobrescribir ajustes realizados con el escaner.\n\n' +
            '¿Deseas continuar?'
        );

        if (!confirmado) {
            informacionArchivo.textContent = 'Importacion cancelada.';
            return;
        }

        importandoArchivoProductos = true;
        informacionArchivo.textContent = 'Importando productos y existencias...';

        const datos = new FormData();

        datos.append(
            'archivo',
            archivo
        );
        datos.append('confirmar_reemplazo_stock', 'SI');

        try {

            const respuesta = await fetch(
                'http://127.0.0.1:3000/api/productos/importar',
                {
                    method: 'POST',
                    body: datos,
                    credentials: 'include'
                }
            );


            const resultado = await respuesta.json();

            if (!respuesta.ok) {

                informacionArchivo.textContent =
                    resultado.mensaje ||
                    'No se pudo importar el archivo.';

                return;

            }

            console.log(
                'Resultado de la importación:',
                resultado
            );

            const resumen = resultado.resumen;

            
            informacionArchivo.textContent =
                'Importación completada\n\n' +
                'Total de filas: ' +
                resumen.total_filas +
                '\n' +
                'Productos importados: ' +
                resumen.productos_importados +
                '\n' +
                'Productos existentes (sin duplicar): ' +
                resumen.productos_existentes +
                '\nStock actual cargado o actualizado: ' +
                resumen.stock_actual_actualizados +
                (resumen.proveedores_procesados
                    ? '\nProductos con proveedor asignado: ' +
                        resumen.productos_con_proveedor +
                    '\nProductos sin proveedor: ' +
                        resumen.productos_sin_proveedor
                    : '');



            // actualiza la información de la vista
            await cargarProductos();
            await cargarFamilias();

        } catch (error) {

            console.error(
                'Error al importar productos:',
                error
            );

            informacionArchivo.textContent =
                'No se pudo conectar con el servidor.';
        } finally {
            importandoArchivoProductos = false;
        }

    }


// TITULO 4 CARGAR PRODUCTOS

    // función para obtener los productos desde el backend
    async function cargarProductos() {

        try {

            const respuesta = await fetch(
                'http://127.0.0.1:3000/api/productos',
                {
                    method: 'GET',
                    credentials: 'include'
                }
            );

            const productos = await respuesta.json();

            if (!respuesta.ok) {

                console.error(
                    'Error al obtener productos:',
                    productos
                );

                return;

            }

            productosCargados = productos;

            mostrarProductos(
                productosCargados
            );

            actualizarIndicadoresProductos(
                productosCargados
            );


        } catch (error) {

            console.error(
                'Error al cargar productos:',
                error
            );

        }

    }


// TITULO 5 MOSTRAR PRODUCTOS

    // función para mostrar los productos dentro de la tabla
    function mostrarProductos(productos) {

    const cuerpoTabla = document.getElementById(
        'cuerpo_tabla_productos'
    );

    if (!cuerpoTabla) {
        return;
    }


    // guarda los productos que corresponden al filtro actual

    productosFiltradosActuales = productos;


    // calcula la cantidad de paginas

    const totalPaginas = Math.ceil(
        productos.length / productosPorPagina
    );


    // evita quedar en una pagina que ya no existe

    if (
        paginaActualProductos > totalPaginas &&
        totalPaginas > 0
    ) {
        paginaActualProductos = totalPaginas;
    }


    // calcula desde que producto comienza la pagina

    const indiceInicio =
        (paginaActualProductos - 1) *
        productosPorPagina;


    // calcula hasta que producto llega la pagina

    const indiceFin =
        indiceInicio +
        productosPorPagina;


    // obtiene solamente los productos de la pagina actual

    const productosPagina =
        productos.slice(
            indiceInicio,
            indiceFin
        );


    cuerpoTabla.innerHTML = '';


    if (!productos.length) {

        cuerpoTabla.innerHTML = `
            <tr class="fila_sin_productos">
                <td
                    class="dato_sin_productos"
                    colspan="8"
                >
                    No hay productos cargados para mostrar.
                </td>
            </tr>
        `;

        mostrarPaginacionProductos(0);

        return;
    }


    productosPagina.forEach(function(producto) {

        const fila = document.createElement(
            'tr'
        );


        fila.className =
            'fila_producto';

        fila.dataset.codigo = producto.codigo;


        // formatea el precio publico en pesos chilenos

        const precioPublico = Number(
            producto.precio_publico ?? 0
        ).toLocaleString(
            'es-CL',
            {
                style: 'currency',
                currency: 'CLP',
                maximumFractionDigits: 0
            }
        );


        fila.innerHTML = `
            <!-- miniatura de la fotografia del producto -->
            <td class="dato_imagen_productos">
                <button
                    class="boton_accion_producto boton_ver_producto boton_imagen_producto"
                    type="button"
                    title="Ver detalle del producto"
                    aria-label="Ver detalle del producto"
                >
                    <img
                        class="imagen_miniatura_producto"
                        alt="Producto sin fotografía"
                        loading="lazy"
                        decoding="async"
                    >
                </button>
            </td>

            <td class="dato_codigo_productos">
                ${producto.codigo || '-'}
            </td>

            <td class="dato_codigo_barra_productos">
                ${producto.cod_barra || '-'}
            </td>

            <td class="dato_descripcion_productos">
                ${producto.descripcion || '-'}
            </td>

            <td class="dato_familia_productos">
                ${producto.familia || '-'}
            </td>

            <td class="dato_precio_productos">
                ${precioPublico}
            </td>

            <td class="dato_proveedor_productos">
                ${producto.proveedor || '-'}
            </td>


            <td class="dato_acciones_productos">

                <div class="contenedor_acciones_producto">

                    <!-- boton para ver producto -->
                    <button
                        class="boton_accion_producto boton_ver_producto"
                        type="button"
                        title="Ver producto"
                        aria-label="Ver producto"
                    >
                        <svg viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="2"
                            stroke-linecap="round" stroke-linejoin="round">
                            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/>
                            <circle cx="12" cy="12" r="3"/>
                        </svg>
                    </button>

                    <!-- boton para editar producto -->
                    <button
                        class="boton_accion_producto boton_editar_producto"
                        type="button"
                        title="Editar producto"
                        aria-label="Editar producto"
                    >
                        <svg viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="2"
                            stroke-linecap="round" stroke-linejoin="round">
                            <path d="M12 20h9"/>
                            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L9 17l-4 1 1-4Z"/>
                        </svg>
                    </button>

                    <!-- boton para eliminar producto -->
                    <button
                        class="boton_accion_producto boton_eliminar_producto"
                        type="button"
                        title="Eliminar producto"
                        aria-label="Eliminar producto"
                    >
                        <svg viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="2"
                            stroke-linecap="round" stroke-linejoin="round">
                            <path d="M3 6h18"/>
                            <path d="M8 6V4h8v2"/>
                            <path d="M5 6l1 14h12l1-14"/>
                            <path d="M10 10v7"/>
                            <path d="M14 10v7"/>
                        </svg>
                    </button>

                </div>

            </td>

        `;


        // usa la imagen ya guardada en PostgreSQL, sin consultar la API
        const miniatura = fila.querySelector(
            '.imagen_miniatura_producto'
        );

        if (miniatura) {

            const imagenGuardada = String(producto.imagen ?? '').trim();
            const imagenPredeterminada =
                './imagenes/inicio_sesion/cuerpo_pagina/secciones/package.svg';

            // si no tiene fotografia, muestra el icono predeterminado
            miniatura.src = imagenGuardada
                ? resolverRutaImagenProducto(imagenGuardada)
                : imagenPredeterminada;
            miniatura.alt = imagenGuardada
                ? 'Fotografía de ' + (producto.descripcion || 'producto')
                : 'Producto sin fotografía';

            if (!imagenGuardada) {
                miniatura.classList.add('imagen_miniatura_producto_vacia');
            }

            // evita mostrar el icono de imagen rota si la URL falla
            miniatura.onerror = function () {
                this.onerror = null;
                this.src = imagenPredeterminada;
                this.alt = 'Producto sin fotografía';
                this.classList.add('imagen_miniatura_producto_vacia');
            };

        }

        cuerpoTabla.appendChild(
            fila
        );

    });


    // actualiza los botones de paginacion

    mostrarPaginacionProductos(
        totalPaginas
    );
}



// TITULO 6 INDICADORES PRODUCTOS

    // función para actualizar los indicadores principales
    function actualizarIndicadoresProductos(productos) {

        // obtiene los elementos de los indicadores
        const valorTotalProductos = document.getElementById(
            'valor_total_productos'
        );

        const valorFamiliasProductos = document.getElementById(
            'valor_familias_productos'
        );

        const valorProductosConProveedor = document.getElementById(
            'valor_productos_con_proveedor'
        );

        const valorProductosSinProveedor = document.getElementById(
            'valor_productos_sin_proveedor'
        );


        // SUBTITULO 1 TOTAL PRODUCTOS

        const totalProductos = productos.length;

        if (valorTotalProductos) {

            valorTotalProductos.textContent =
                totalProductos.toLocaleString('es-CL');

        }


        // SUBTITULO 2 FAMILIAS REGISTRADAS

        const familias = new Set();

        productos.forEach(function(producto) {

            if (
                producto.familia &&
                producto.familia.trim() !== ''
            ) {

                familias.add(
                    producto.familia.trim().toUpperCase()
                );

            }

        });

        if (valorFamiliasProductos) {

            valorFamiliasProductos.textContent =
                familias.size.toLocaleString('es-CL');

        }


        // SUBTITULO 3 PRODUCTOS CON PROVEEDOR

        const productosConProveedor = productos.filter(
            function(producto) {

                const proveedor = String(
                    producto.proveedor ?? ''
                ).trim();

                return proveedor !== '' && proveedor !== '-';

            }
        ).length;

        // calcula el porcentaje de productos con proveedor
        const porcentajeConProveedor = totalProductos > 0
            ? (productosConProveedor / totalProductos) * 100
            : 0;

        if (valorProductosConProveedor) {

            valorProductosConProveedor.textContent =
                porcentajeConProveedor
                    .toFixed(1)
                    .replace('.', ',') + '%';

        }


        // SUBTITULO 4 PRODUCTOS SIN PROVEEDOR

        const productosSinProveedor =
            totalProductos - productosConProveedor;

        if (valorProductosSinProveedor) {

            valorProductosSinProveedor.textContent =
                productosSinProveedor.toLocaleString('es-CL');

        }

    }



// TITULO 8 CARGAR FAMILIAS

    // función para obtener las familias desde el backend
    async function cargarFamilias() {

        // selector de familias del filtro
        const selectFamilia = document.getElementById(
            'select_familia_productos'
        );

        // selector de familias del formulario
        const selectFamiliaFormulario = document.getElementById(
            'input_familia_producto'
        );

        if (!selectFamilia && !selectFamiliaFormulario) {
            return;
        }

        try {

            // obtiene las familias desde PostgreSQL
            const respuesta = await fetch(
                'http://127.0.0.1:3000/api/productos/familias',
                {
                    method: 'GET',
                    credentials: 'include'
                }
            );

            if (!respuesta.ok) {
                throw new Error('No se pudieron obtener las familias');
            }

            const familias = await respuesta.json();

            // actualiza ambos selectores
            const selectores = [
                {
                    elemento: selectFamilia,
                    textoInicial: 'Todas las familias'
                },
                {
                    elemento: selectFamiliaFormulario,
                    textoInicial: 'Seleccionar familia'
                }
            ];

            selectores.forEach(function(selector) {

                if (!selector.elemento) {
                    return;
                }

                // conserva la familia seleccionada
                const valorAnterior = selector.elemento.value;

                // limpia las opciones anteriores
                selector.elemento.replaceChildren();

                // agrega la opcion inicial
                const opcionInicial = document.createElement('option');

                opcionInicial.value = '';
                opcionInicial.textContent = selector.textoInicial;

                selector.elemento.appendChild(opcionInicial);

                // agrega las familias registradas
                familias.forEach(function(familia) {

                    const opcion = document.createElement('option');

                    opcion.className = 'opcion_familia_productos';

                    opcion.value = familia.familia;
                    opcion.textContent = familia.familia;

                    selector.elemento.appendChild(opcion);

                });

                // restaura la seleccion anterior
                selector.elemento.value = valorAnterior;

            });

        } catch (error) {

            console.error(
                'Error al cargar familias:',
                error
            );

        }

    }



// TITULO 9 FILTRO FAMILIA

    // función para activar el filtro por familia
    function configurarFiltroFamilias() {

        const selectFamilia = document.getElementById(
            'select_familia_productos'
        );

        if (!selectFamilia) {
            return;
        }

        selectFamilia.addEventListener(
            'change',
            filtrarProductos
        );
    }


// TITULO 10 BUSQUEDA PRODUCTOS

    // función para activar la búsqueda de productos
    function configurarBusquedaProductos() {

        const inputBusqueda = document.getElementById(
            'input_busqueda_productos'
        );

        if (!inputBusqueda) {
            return;
        }

        inputBusqueda.addEventListener(
            'input',
            filtrarProductos
        );
    }


// TITULO 11 FILTRAR PRODUCTOS

    // función para filtrar los productos por familia y búsqueda
    function filtrarProductos() {

        const selectFamilia = document.getElementById(
            'select_familia_productos'
        );

        const inputBusqueda = document.getElementById(
            'input_busqueda_productos'
        );

        if (
            !selectFamilia ||
            !inputBusqueda
        ) {
            return;
        }

        const familiaSeleccionada =
            selectFamilia.value;

        const textoBusqueda =
            inputBusqueda.value
                .trim()
                .toLowerCase();

        const productosFiltrados =
            productosCargados.filter(
                function(producto) {

                    const familiaProducto =
                        producto.familia || '';


                    const codigoProducto =
                        String(
                            producto.codigo || ''
                        ).toLowerCase();


                    const codigoBarraProducto =
                        String(
                            producto.cod_barra || ''
                        ).toLowerCase();


                    const descripcionProducto =
                        String(
                            producto.descripcion || ''
                        ).toLowerCase();


                    const coincideFamilia =
                        !familiaSeleccionada ||
                        familiaProducto ===
                        familiaSeleccionada;


                    const coincideBusqueda =
                        !textoBusqueda ||
                        codigoProducto.includes(
                            textoBusqueda
                        ) ||
                        codigoBarraProducto.includes(
                            textoBusqueda
                        ) ||
                        descripcionProducto.includes(
                            textoBusqueda
                        );

                    return (
                        coincideFamilia &&
                        coincideBusqueda
                    );

                }
            );

        paginaActualProductos = 1;

        mostrarProductos(
            productosFiltrados
        );

    }


// TITULO 12 INICIALIZACION PRODUCTOS

    // función para inicializar el funcionamiento de la vista productos
    async function inicializarProductos() {

        configurarImportacionProductos();
        configurarFiltroFamilias();
        configurarBusquedaProductos();
        configurarPaginacionProductos();
        configurarAccionesProductos();

        await cargarProductos();
        await cargarFamilias();
    }

// TITULO 13 PAGINACION DE PRODUCTOS

    // cambia la pagina actual

    function cambiarPaginaProductos(pagina) {

        paginaActualProductos =
            pagina;

        mostrarProductos(
            productosFiltradosActuales
        );
    }


    
    // función para configurar los botones de paginacion
    function configurarPaginacionProductos() {

        // obtiene el boton de pagina anterior
        const botonAnterior = document.getElementById(
            'boton_pagina_anterior_productos'
        );

        // obtiene el boton de pagina siguiente
        const botonSiguiente = document.getElementById(
            'boton_pagina_siguiente_productos'
        );


        // SUBTITULO 1 BOTON PAGINA ANTERIOR

        if (botonAnterior) {

            botonAnterior.addEventListener('click', function() {

                // verifica que no sea la primera pagina
                if (paginaActualProductos > 1) {

                    cambiarPaginaProductos(
                        paginaActualProductos - 1
                    );

                }

            });

        }


        // SUBTITULO 2 BOTON PAGINA SIGUIENTE

        if (botonSiguiente) {

            botonSiguiente.addEventListener('click', function() {

                // calcula la cantidad total de paginas
                const totalPaginas = Math.ceil(
                    productosFiltradosActuales.length / productosPorPagina
                );

                // verifica que no sea la ultima pagina
                if (paginaActualProductos < totalPaginas) {

                    cambiarPaginaProductos(
                        paginaActualProductos + 1
                    );

                }

            });

        }

    }


// funcion para mostrar los controles y la informacion de paginacion
function mostrarPaginacionProductos(totalPaginas) {

    // obtiene el contenedor principal
    const contenedorPaginacion = document.getElementById(
        'contenedor_paginacion_productos'
    );

    // obtiene el texto informativo
    const informacionPaginacion = document.getElementById(
        'informacion_paginacion_productos'
    );

    // obtiene el contenedor de controles
    const controlesPaginacion = document.getElementById(
        'controles_paginacion_productos'
    );

    // obtiene los botones de navegacion
    const botonAnterior = document.getElementById(
        'boton_pagina_anterior_productos'
    );

    const botonSiguiente = document.getElementById(
        'boton_pagina_siguiente_productos'
    );

    if (
        !contenedorPaginacion ||
        !informacionPaginacion ||
        !controlesPaginacion ||
        !botonAnterior ||
        !botonSiguiente
    ) {
        return;
    }


    // SUBTITULO 1 INFORMACION DE PRODUCTOS

    // obtiene la cantidad total de productos filtrados
    const totalProductos = productosFiltradosActuales.length;

    // calcula el primer producto mostrado
    const inicio = totalProductos === 0
        ? 0
        : (paginaActualProductos - 1) * productosPorPagina + 1;

    // calcula el ultimo producto mostrado
    const fin = Math.min(
        paginaActualProductos * productosPorPagina,
        totalProductos
    );

    // muestra la informacion de paginacion
    informacionPaginacion.textContent =
        'Mostrando ' +
        inicio.toLocaleString('es-CL') +
        ' a ' +
        fin.toLocaleString('es-CL') +
        ' de ' +
        totalProductos.toLocaleString('es-CL') +
        ' productos';


    // SUBTITULO 2 ESTADO DE LOS CONTROLES

    // mantiene visible la informacion
    contenedorPaginacion.style.display = 'flex';

    // oculta los controles cuando solo existe una pagina
    controlesPaginacion.style.display =
        totalPaginas <= 1 ? 'none' : 'flex';

    if (totalPaginas <= 1) {
        return;
    }

    // deshabilita anterior cuando esta en la primera pagina
    botonAnterior.disabled =
        paginaActualProductos === 1;

    // deshabilita siguiente cuando esta en la ultima pagina
    botonSiguiente.disabled =
        paginaActualProductos === totalPaginas;


    // SUBTITULO 3 NUMEROS DE PAGINA

    // actualiza los numeros de pagina
    mostrarNumerosPaginasProductos(
        totalPaginas
    );

}


function mostrarNumerosPaginasProductos(totalPaginas) {

    const numerosPaginas =
        document.getElementById(
            'numeros_paginas_productos'
        );

    if (!numerosPaginas) {

        return;
    }

    numerosPaginas.innerHTML = '';

    // calcula las paginas que se mostraran

    let paginasMostrar = [];

    // muestra todas las paginas si son pocas

    if (totalPaginas <= 7) {

        for (

            let pagina = 1;

            pagina <= totalPaginas;

            pagina++

        ) {

            paginasMostrar.push(pagina);
        }

    } else {

        // siempre muestra la primera pagina

        paginasMostrar.push(1);

        // muestra paginas cercanas a la actual

        if (paginaActualProductos > 4) {

            paginasMostrar.push('...');
        }

        const inicio =
            Math.max(
                2,
                paginaActualProductos - 2
            );

        const fin =
            Math.min(
                totalPaginas - 1,
                paginaActualProductos + 2
            );

        for (

            let pagina = inicio;

            pagina <= fin;

            pagina++

        ) {

            paginasMostrar.push(pagina);
        }

        // muestra puntos antes de la ultima

        if (
            paginaActualProductos <
            totalPaginas - 3
        ) {

            paginasMostrar.push('...');
        }

        // siempre muestra la ultima pagina

        paginasMostrar.push(
            totalPaginas
        );
    }

    // crea los botones

    paginasMostrar.forEach(
        function(pagina) {

            // crea los puntos suspensivos

            if (pagina === '...') {

                const puntos =
                    document.createElement(
                        'span'
                    );

                puntos.className =
                    'puntos_paginacion_productos';

                puntos.innerHTML = `
                    <div class="punto_paginacion"></div>
                    <div class="punto_paginacion"></div>
                    <div class="punto_paginacion"></div>
                `;

                numerosPaginas.appendChild(
                    puntos
                );

                return;
            }

            // crea el boton de pagina

            const botonPagina =
                document.createElement(
                    'button'
                );

            botonPagina.type =
                'button';

            botonPagina.className =
                'boton_numero_pagina_productos';

            botonPagina.textContent =
                pagina;

            // marca la pagina actual

            if (
                pagina === paginaActualProductos
            ) {

                botonPagina.classList.add(
                    'pagina_actual_productos'
                );
            }

            // cambia a la pagina seleccionada

            botonPagina.addEventListener(
                'click',
                function() {

                    cambiarPaginaProductos(
                        pagina
                    );
                }
            );

            numerosPaginas.appendChild(
                botonPagina
            );
        }
    );
}



/* TITULO 14 ACCIONES DE PRODUCTOS */

// obtiene los proveedores para el formulario
async function cargarOpcionesProveedoresProducto() {

    if (listaProveedoresProducto === null) {

        const respuesta = await fetch(
            'http://127.0.0.1:3000/api/proveedores',
            { credentials: 'include' }
        );

        if (!respuesta.ok) {
            throw new Error('No se pudieron cargar los proveedores');
        }

        const datos = await respuesta.json();

        listaProveedoresProducto = Array.isArray(datos)
            ? datos
            : (datos.proveedores || []);
    }

    const select = document.getElementById(
        'select_proveedor_producto'
    );

    if (!select) return;

    const seleccionado = select.value;

    select.replaceChildren(
        new Option('Seleccionar proveedor', '')
    );

    listaProveedoresProducto.forEach(function(proveedor) {

        select.add(new Option(
            proveedor.nombre_comercial,
            proveedor.nombre_comercial
        ));

    });

    select.value = seleccionado;
}


// configura el formulario segun la accion
function configurarEstadoFormularioProducto() {

    const soloLectura = modoFormularioProducto === 'ver';

    const campos = [
        'input_codigo_producto',
        'input_codigo_barra_producto',
        'input_descripcion_producto',
        'input_familia_producto',
        'input_precio_producto',
        'select_proveedor_producto'
    ];

    campos.forEach(function(id) {

        const campo = document.getElementById(id);

        if (campo) {
            campo.disabled = soloLectura;
        }

    });

    const codigo = document.getElementById(
        'input_codigo_producto'
    );

    if (codigo) {
        codigo.readOnly = modoFormularioProducto !== 'nuevo';
    }

    const guardar = document.getElementById(
        'boton_guardar_producto'
    );

    if (guardar) {

        guardar.style.display = soloLectura ? 'none' : '';

        guardar.textContent = modoFormularioProducto === 'editar'
            ? 'Guardar cambios'
            : 'Guardar producto';
    }

    actualizarBotonesImagenProducto();
}


// abre el formulario para ver o editar un producto
async function abrirDetalleProducto(codigo, modo) {

    const producto = productosCargados.find(
        p => String(p.codigo) === String(codigo)
    );

    if (!producto) {
        alert('No se encontró el producto');
        return;
    }

    limpiarFormularioProducto();

    modoFormularioProducto = modo;
    codigoOriginalProducto = producto.codigo;
    imagenOriginalProducto = producto.imagen ?? null;
    imagenGuardadaProducto = imagenOriginalProducto;

    mostrarVistaPreviaImagenProducto(
        imagenOriginalProducto,
        imagenOriginalProducto
            ? 'Fotografía asociada al producto.'
            : 'Este producto todavía no tiene fotografía.'
    );

    document.getElementById(
        'titulo_formulario_producto'
    ).textContent = modo === 'ver'
        ? 'Detalle del producto'
        : 'Editar producto';

    document.getElementById(
        'input_codigo_producto'
    ).value = producto.codigo;

    document.getElementById(
        'input_codigo_barra_producto'
    ).value = producto.cod_barra || '';

    document.getElementById(
        'input_descripcion_producto'
    ).value = producto.descripcion || '';

    document.getElementById(
        'input_familia_producto'
    ).value = producto.familia || '';

    document.getElementById(
        'input_precio_producto'
    ).value = producto.precio_publico ?? 0;

    configurarEstadoFormularioProducto();

    try {

        await cargarOpcionesProveedoresProducto();

        document.getElementById(
            'select_proveedor_producto'
        ).value = producto.proveedor || '';

    } catch (error) {

        alert(error.message);
        return;
    }

    document.getElementById(
        'contenedor_formulario_producto'
    ).classList.remove(
        'contenedor_formulario_producto_oculto'
    );
}


// guarda un producto nuevo o editado
async function guardarCambiosProducto() {

    if (
        modoFormularioProducto === 'ver' ||
        guardandoProducto ||
        buscandoImagenProducto
    ) {
        return;
    }

    const codigo = document.getElementById(
        'input_codigo_producto'
    ).value.trim();

    const codigoBarra = document.getElementById(
        'input_codigo_barra_producto'
    ).value.trim();

    const descripcion = document.getElementById(
        'input_descripcion_producto'
    ).value.trim();

    const familia = document.getElementById(
        'input_familia_producto'
    ).value.trim();

    const precioTexto = document.getElementById(
        'input_precio_producto'
    ).value.trim();

    const proveedor = document.getElementById(
        'select_proveedor_producto'
    ).value;

    const precio = Number(precioTexto);

    // valida los datos obligatorios
    if (
        !codigo ||
        !codigoBarra ||
        !descripcion ||
        !precioTexto ||
        !Number.isFinite(precio) ||
        precio < 0
    ) {

        alert('Completa los campos obligatorios con datos válidos.');
        return;
    }

    const esEdicion = modoFormularioProducto === 'editar';

    const url = esEdicion
        ? 'http://127.0.0.1:3000/api/productos/' +
            encodeURIComponent(codigoOriginalProducto)
        : 'http://127.0.0.1:3000/api/productos';

    guardandoProducto = true;
    actualizarBotonesImagenProducto();

    try {

        const datosProducto = {
            codigo,
            codigo_barra: codigoBarra,
            descripcion,
            familia,
            precio_publico: precio,
            imagen: imagenOriginalProducto,
            proveedor: proveedor || null
        };

        const opciones = {
            method: esEdicion ? 'PUT' : 'POST',
            credentials: 'include'
        };

        if (archivoImagenManualProducto) {
            // solo al guardar se sube la fotografia a nuestro backend
            const datosFormulario = new FormData();
            Object.entries(datosProducto).forEach(([campo, valor]) => {
                datosFormulario.append(campo, valor == null ? '' : String(valor));
            });
            datosFormulario.append(
                'imagen_archivo',
                archivoImagenManualProducto,
                archivoImagenManualProducto.name
            );
            opciones.body = datosFormulario;
            // no agregar Content-Type: fetch define el boundary multipart
        } else {
            opciones.headers = { 'Content-Type': 'application/json' };
            opciones.body = JSON.stringify(datosProducto);
        }

        const respuesta = await fetch(url, opciones);

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                resultado.mensaje || 'No se pudo guardar el producto'
            );
        }

        cerrarFormularioProducto();

        await cargarProductos();
        await cargarFamilias();

        alert(
            esEdicion
                ? 'Producto actualizado correctamente'
                : 'Producto creado correctamente'
        );

    } catch (error) {

        alert(error.message);

    } finally {

        guardandoProducto = false;
        actualizarBotonesImagenProducto();
    }
}


// confirma y solicita eliminar un producto
async function confirmarEliminacionProducto(codigo) {

    const producto = productosCargados.find(
        p => String(p.codigo) === String(codigo)
    );

    if (!producto) return;

    const confirmar = confirm(
        '¿Estás seguro de eliminar el producto ' +
        producto.descripcion + '?'
    );

    if (!confirmar) return;

    try {

        const respuesta = await fetch(
            'http://127.0.0.1:3000/api/productos/' +
                encodeURIComponent(codigo),
            {
                method: 'DELETE',
                credentials: 'include'
            }
        );

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                resultado.mensaje || 'No se pudo eliminar el producto'
            );
        }

        await cargarProductos();
        await cargarFamilias();

        alert('Producto eliminado correctamente');

    } catch (error) {

        alert(error.message);
    }
}


// conecta los botones de la tabla y del formulario
function configurarAccionesProductos() {

    const cuerpoTabla = document.getElementById(
        'cuerpo_tabla_productos'
    );

    if (!cuerpoTabla) return;

    cuerpoTabla.addEventListener('click', function(evento) {

        const boton = evento.target.closest(
            'button.boton_accion_producto'
        );

        if (!boton || !cuerpoTabla.contains(boton)) {
            return;
        }

        const fila = boton.closest('tr');
        const codigo = fila?.dataset.codigo;

        if (!codigo) return;

        if (boton.classList.contains('boton_ver_producto')) {

            abrirDetalleProducto(codigo, 'ver');

        } else if (
            boton.classList.contains('boton_editar_producto')
        ) {

            abrirDetalleProducto(codigo, 'editar');

        } else if (
            boton.classList.contains('boton_eliminar_producto')
        ) {

            confirmarEliminacionProducto(codigo);
        }

    });

    const botonGuardar = document.getElementById(
        'boton_guardar_producto'
    );

    if (botonGuardar) {

        botonGuardar.addEventListener(
            'click',
            guardarCambiosProducto
        );
    }

    // permite buscar y quitar fotografias desde el formulario
    const botonBuscarImagen = document.getElementById('boton_buscar_imagen_producto');
    const botonQuitarImagen = document.getElementById('boton_quitar_imagen_producto');
    const botonSubirImagen = document.getElementById('boton_subir_imagen_producto');
    const inputArchivoImagen = document.getElementById('input_archivo_imagen_producto');
    const campoCodigoBarra = document.getElementById('input_codigo_barra_producto');
    const vistaPrevia = document.getElementById('imagen_vista_previa_producto');

    if (botonBuscarImagen) {
        botonBuscarImagen.addEventListener('click', buscarImagenProductoFormulario);
    }

    if (botonQuitarImagen) {
        botonQuitarImagen.addEventListener('click', quitarImagenProductoFormulario);
    }

    if (botonSubirImagen && inputArchivoImagen) {
        botonSubirImagen.addEventListener('click', () => inputArchivoImagen.click());
        inputArchivoImagen.addEventListener('change', seleccionarArchivoImagenManualProducto);
    }

    if (campoCodigoBarra) {
        campoCodigoBarra.addEventListener('input', function() {
            const codigoActual = campoCodigoBarra.value.trim();

            // cancela la aplicacion de una busqueda pendiente para otro codigo
            if (buscandoImagenProducto) {
                busquedaImagenProductoSecuencia++;
                buscandoImagenProducto = false;
                actualizarBotonesImagenProducto();
            }

            // una imagen encontrada para otro codigo de barras no debe guardarse
            if (
                imagenNuevaBuscadaProducto &&
                codigoBarraImagenBuscadaProducto !== codigoActual
            ) {
                busquedaImagenProductoSecuencia++;
                buscandoImagenProducto = false;
                imagenOriginalProducto = imagenGuardadaProducto;
                imagenNuevaBuscadaProducto = false;
                codigoBarraImagenBuscadaProducto = null;

                mostrarVistaPreviaImagenProducto(imagenOriginalProducto,
                    'Cambió el código de barras. Busca nuevamente la fotografía.');
            }
        });
    }

    if (vistaPrevia) {
        vistaPrevia.addEventListener('error', function() {
            vistaPrevia.hidden = true;

            const mensaje = document.getElementById('mensaje_sin_imagen_producto');
            if (mensaje) {
                mensaje.textContent = 'Imagen no disponible';
                mensaje.hidden = false;
            }

            // si falla una foto local, descartar su vista previa
            if (archivoImagenManualProducto) {
                limpiarArchivoImagenManualProducto();
                imagenOriginalProducto = imagenGuardadaProducto;
            }

            // no permite guardar una fotografia nueva que el navegador no pudo abrir
            if (imagenNuevaBuscadaProducto) {
                imagenOriginalProducto = imagenGuardadaProducto;
                imagenNuevaBuscadaProducto = false;
                codigoBarraImagenBuscadaProducto = null;
            }

            const estado = document.getElementById('texto_estado_imagen_producto');
            if (estado) {
                estado.textContent = 'No se pudo cargar la fotografía. Prueba otra vez.';
            }
            const fuente = document.getElementById('enlace_fuente_imagen_producto');
            if (fuente) fuente.hidden = true;
            actualizarBotonesImagenProducto();
        });
    }
}


// TITULO 15 BUSCAR Y PREVISUALIZAR IMAGENES DE PRODUCTOS

// convierte rutas locales de Node.js en direcciones completas para Live Server (:5500)
function resolverRutaImagenProducto(ruta) {
    if (typeof ruta === 'string' && ruta.startsWith('/api/productos/imagenes/')) {
        return 'http://127.0.0.1:3000' + ruta;
    }
    return ruta;
}

// libera archivos temporales de vista previa, sin subirlos ni borrarlos del servidor
function limpiarArchivoImagenManualProducto() {
    archivoImagenManualProducto = null;
    if (urlVistaPreviaManualProducto) {
        URL.revokeObjectURL(urlVistaPreviaManualProducto);
        urlVistaPreviaManualProducto = null;
    }
    const input = document.getElementById('input_archivo_imagen_producto');
    if (input) input.value = '';
}

// permite escoger una fotografia desde el computador o telefono
function seleccionarArchivoImagenManualProducto(evento) {
    if (modoFormularioProducto === 'ver' || guardandoProducto || buscandoImagenProducto) {
        return;
    }

    const archivo = evento.target.files?.[0];
    if (!archivo) return;

    const tipos = ['image/jpeg', 'image/png', 'image/webp'];
    const estado = document.getElementById('texto_estado_imagen_producto');

    if (!tipos.includes(archivo.type) || archivo.size > 5 * 1024 * 1024 || !archivo.size) {
        evento.target.value = '';
        if (estado) estado.textContent =
            'Selecciona una foto JPG, PNG o WebP de hasta 5 MB.';
        return;
    }

    busquedaImagenProductoSecuencia++;
    buscandoImagenProducto = false;
    limpiarArchivoImagenManualProducto();
    archivoImagenManualProducto = archivo;
    urlVistaPreviaManualProducto = URL.createObjectURL(archivo);
    imagenOriginalProducto = imagenGuardadaProducto;
    imagenNuevaBuscadaProducto = false;
    codigoBarraImagenBuscadaProducto = null;

    mostrarVistaPreviaImagenProducto(urlVistaPreviaManualProducto,
        'Fotografía seleccionada: ' + archivo.name + '. Se subirá al presionar Guardar.');
}

// verifica que la ruta sea una URL web o una ruta local valida
function esRutaImagenProductoValida(ruta) {
    return typeof ruta === 'string' &&
        (/^https?:\/\//i.test(ruta) || /^\/(?!\/)/.test(ruta) || /^blob:/i.test(ruta));
}

// muestra la imagen asociada o la fotografia obtenida desde Open Food Facts
function mostrarVistaPreviaImagenProducto(ruta, mensaje) {

    const imagen = document.getElementById('imagen_vista_previa_producto');
    const sinImagen = document.getElementById('mensaje_sin_imagen_producto');
    const estado = document.getElementById('texto_estado_imagen_producto');
    const fuente = document.getElementById('enlace_fuente_imagen_producto');

    if (imagen && sinImagen) {
        if (esRutaImagenProductoValida(ruta)) {
            imagen.src = resolverRutaImagenProducto(ruta);
            imagen.hidden = false;
            sinImagen.hidden = true;
        } else {
            imagen.removeAttribute('src');
            imagen.hidden = true;
            sinImagen.textContent = 'Sin imagen';
            sinImagen.hidden = false;
        }
    }

    if (estado) {
        estado.textContent = mensaje || '';
    }

    if (fuente) {
        let esOpenFoodFacts = false;
        try {
            const url = new URL(ruta);
            esOpenFoodFacts = url.protocol === 'https:' &&
                ['images.openfoodfacts.org', 'static.openfoodfacts.org'].includes(url.hostname);
        } catch (error) {
            // una ruta local no proviene de Open Food Facts
        }

        const codigoBarra = document.getElementById('input_codigo_barra_producto')?.value.trim();
        fuente.hidden = !esOpenFoodFacts;
        if (esOpenFoodFacts && codigoBarra) {
            fuente.href = 'https://world.openfoodfacts.org/product/' +
                encodeURIComponent(codigoBarra);
        }
    }

    actualizarBotonesImagenProducto();
}

// habilita los controles segun el modo actual
function actualizarBotonesImagenProducto() {

    const buscar = document.getElementById('boton_buscar_imagen_producto');
    const quitar = document.getElementById('boton_quitar_imagen_producto');
    const subir = document.getElementById('boton_subir_imagen_producto');
    const soloLectura = modoFormularioProducto === 'ver';

    if (buscar) {
        buscar.hidden = soloLectura;
        buscar.disabled = buscandoImagenProducto || guardandoProducto;
        buscar.textContent = buscandoImagenProducto ? 'Buscando...' : 'Buscar imagen';
    }

    if (subir) {
        subir.hidden = soloLectura;
        subir.disabled = buscandoImagenProducto || guardandoProducto;
    }

    if (quitar) {
        quitar.hidden = soloLectura;
        quitar.disabled = buscandoImagenProducto || guardandoProducto ||
            (!imagenOriginalProducto && !archivoImagenManualProducto);
    }
}

// consulta la API y permite revisar la foto antes de guardarla
async function buscarImagenProductoFormulario() {

    if (modoFormularioProducto === 'ver' || buscandoImagenProducto || guardandoProducto) {
        return;
    }

    const codigoBarra = document.getElementById('input_codigo_barra_producto')?.value.trim() || '';
    const estado = document.getElementById('texto_estado_imagen_producto');

    if (!/^\d{8,14}$/.test(codigoBarra)) {
        if (estado) {
            estado.textContent = 'Ingresa un código de barras de 8 a 14 dígitos numéricos.';
        }
        return;
    }

    const solicitud = ++busquedaImagenProductoSecuencia;
    buscandoImagenProducto = true;
    actualizarBotonesImagenProducto();

    if (estado) {
        estado.textContent = 'Buscando fotografía en Open Food Facts...';
    }

    try {
        const respuesta = await fetch(
            'http://127.0.0.1:3000/api/productos/buscar-imagen/' +
                encodeURIComponent(codigoBarra),
            { method: 'GET', credentials: 'include' }
        );

        const datos = await respuesta.json();

        // evita que una respuesta antigua cambie el producto abierto actualmente
        if (solicitud !== busquedaImagenProductoSecuencia) {
            return;
        }

        if (!respuesta.ok) {
            throw new Error(datos.mensaje || 'No se pudo buscar la fotografía.');
        }

        if (!datos.encontrado || !esRutaImagenProductoValida(datos.imagen_url)) {
            if (estado) {
                estado.textContent = datos.mensaje || 'No se encontró una fotografía para ese código.';
            }
            return;
        }

        // verifica que la URL de la foto provenga de Open Food Facts
        const urlImagen = new URL(datos.imagen_url);
        if (
            urlImagen.protocol !== 'https:' ||
            !['images.openfoodfacts.org', 'static.openfoodfacts.org'].includes(urlImagen.hostname)
        ) {
            throw new Error('La fuente de la imagen no es válida.');
        }

        // una fotografia encontrada reemplaza la foto manual pendiente, si existe
        limpiarArchivoImagenManualProducto();
        imagenOriginalProducto = urlImagen.href;
        imagenNuevaBuscadaProducto = true;
        codigoBarraImagenBuscadaProducto = codigoBarra;

        const nombre = datos.nombre ? ' (' + datos.nombre + ')' : '';
        mostrarVistaPreviaImagenProducto(
            imagenOriginalProducto,
            'Imagen encontrada' + nombre + '. Verifica que corresponda al producto y presiona Guardar.'
        );

    } catch (error) {
        if (solicitud === busquedaImagenProductoSecuencia && estado) {
            estado.textContent = error.message || 'No fue posible buscar la fotografía.';
        }
    } finally {
        if (solicitud === busquedaImagenProductoSecuencia) {
            buscandoImagenProducto = false;
            actualizarBotonesImagenProducto();
        }
    }
}

// quita la fotografia en el formulario sin modificar todavia PostgreSQL
function quitarImagenProductoFormulario() {

    if (modoFormularioProducto === 'ver' || guardandoProducto || buscandoImagenProducto) {
        return;
    }

    busquedaImagenProductoSecuencia++;
    limpiarArchivoImagenManualProducto();
    imagenOriginalProducto = null;
    imagenNuevaBuscadaProducto = false;
    codigoBarraImagenBuscadaProducto = null;

    mostrarVistaPreviaImagenProducto(null,
        'La imagen se quitará del producto al guardar los cambios.');
}
