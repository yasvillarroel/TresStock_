// variable para almacenar los productos obtenidos desde el backend
let productosCargados = [];

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

        if (contenedorFormularioProducto) {

            contenedorFormularioProducto.classList.remove(
                'contenedor_formulario_producto_oculto'
            );

        }

    }


    // función para ocultar el formulario de producto
    function cerrarFormularioProducto() {

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

        if (!inputArchivo || !informacionArchivo) {
            return;
        }

        const archivo = inputArchivo.files[0];

        if (!archivo) {

            informacionArchivo.textContent =
                'Selecciona un archivo antes de importar.';

            return;

        }

        informacionArchivo.textContent =
            'Enviando archivo...';


        const datos = new FormData();

        datos.append(
            'archivo',
            archivo
        );


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
                'Productos no importados porque ya existen: ' +
                resumen.productos_existentes;


            // actualiza la información de la vista
            await cargarProductos();
            await cargarFamilias();
            await cargarCantidadProveedores();

        } catch (error) {

            console.error(
                'Error al importar productos:',
                error
            );

            informacionArchivo.textContent =
                'No se pudo conectar con el servidor.';
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
                    colspan="9"
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

            <td class="dato_stock_actual_productos">
                ${producto.stock_actual ?? 0}
            </td>

            <td class="dato_stock_minimo_productos">
                ${producto.stock_minimo ?? 0}
            </td>

            <td class="dato_proveedor_productos">
                ${producto.proveedor || '-'}
            </td>

            <td class="dato_acciones_productos">
                -
            </td>
        `;


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

        const valorTotalProductos = document.getElementById(
            'valor_total_productos'
        );

        const valorFamiliasProductos = document.getElementById(
            'valor_familias_productos'
        );

        const valorStockBajoProductos = document.getElementById(
            'valor_stock_bajo_productos'
        );


        // cantidad total de productos
        if (valorTotalProductos) {

            valorTotalProductos.textContent =
                productos.length.toLocaleString('es-CL');

        }


        // obtiene las familias diferentes
        const familias = new Set();


        productos.forEach(function(producto) {

            if (
                producto.familia &&
                producto.familia.trim() !== ''
            ) {

                familias.add(
                    producto.familia
                        .trim()
                        .toUpperCase()
                );

            }

        });

        // cantidad de familias
        if (valorFamiliasProductos) {

            valorFamiliasProductos.textContent =
                familias.size;

        }

        // obtiene productos con stock bajo
        const productosStockBajo = productos.filter(
            function(producto) {

                const stockActual = Number(
                    producto.stock_actual ?? 0
                );

                const stockMinimo = Number(
                    producto.stock_minimo ?? 0
                );

                return (
                    stockMinimo > 0 &&
                    stockActual <= stockMinimo
                );

            }
        );

        // cantidad de productos con bajo stock
        if (valorStockBajoProductos) {

            valorStockBajoProductos.textContent =
                productosStockBajo.length.toLocaleString(
                    'es-CL'
                );

        }

    }


// TITULO 7 CARGAR CANTIDAD PROVEEDORES

    // función para obtener la cantidad de proveedores registrados
    async function cargarCantidadProveedores() {

        const valorProveedoresProductos = document.getElementById(
            'valor_proveedores_productos'
        );


        if (!valorProveedoresProductos) {
            return;
        }


        try {

            const respuesta = await fetch(
                'http://127.0.0.1:3000/api/proveedores',
                {
                    method: 'GET',
                    credentials: 'include'
                }
            );

            const resultado = await respuesta.json();

            if (!respuesta.ok) {

                console.error(
                    'Error al obtener proveedores:',
                    resultado
                );

                return;

            }

            // permite trabajar tanto si la API devuelve un arreglo
            // como si devuelve un objeto con la propiedad proveedores
            let proveedores = resultado;


            if (
                resultado &&
                Array.isArray(resultado.proveedores)
            ) {

                proveedores =
                    resultado.proveedores;

            }


            if (Array.isArray(proveedores)) {

                valorProveedoresProductos.textContent =
                    proveedores.length.toLocaleString(
                        'es-CL'
                    );

            }


        } catch (error) {

            console.error(
                'Error al cargar proveedores:',
                error
            );

        }

    }


// TITULO 8 CARGAR FAMILIAS

    // función para obtener las familias desde el backend
    async function cargarFamilias() {

        const selectFamilia = document.getElementById(
            'select_familia_productos'
        );


        if (!selectFamilia) {
            return;
        }

        try {

            const respuesta = await fetch(
                'http://127.0.0.1:3000/api/productos/familias',
                {
                    method: 'GET',
                    credentials: 'include'
                }
            );

            const familias = await respuesta.json();


            if (!respuesta.ok) {

                console.error(
                    'Error al obtener familias:',
                    familias
                );

                return;

            }

            selectFamilia.innerHTML = `
                <option
                    class="opcion_familia_productos"
                    value=""
                >
                    Todas las familias
                </option>
            `;


            familias.forEach(function(familia) {

                const opcion = document.createElement(
                    'option'
                );

                opcion.className =
                    'opcion_familia_productos';

                opcion.value =
                    familia.familia;

                opcion.textContent =
                    familia.familia;

                selectFamilia.appendChild(
                    opcion
                );

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

        await cargarProductos();
        await cargarFamilias();
        await cargarCantidadProveedores();
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


    // muestra los controles de paginacion

function mostrarPaginacionProductos(totalPaginas) {

    const contenedorPaginacion =
        document.getElementById(
            'contenedor_paginacion_productos'
        );

    const botonAnterior =
        document.getElementById(
            'boton_pagina_anterior_productos'
        );

    const numerosPaginas =
        document.getElementById(
            'numeros_paginas_productos'
        );

    const botonSiguiente =
        document.getElementById(
            'boton_pagina_siguiente_productos'
        );

    if (
        !contenedorPaginacion ||
        !botonAnterior ||
        !numerosPaginas ||
        !botonSiguiente
    ) {
        return;
    }

    // oculta la paginacion si no es necesaria

    if (totalPaginas <= 1) {

        contenedorPaginacion.style.display =
            'none';

        return;
    }

    contenedorPaginacion.style.display =
        'flex';

    // configura el estado del boton anterior

    botonAnterior.disabled =
        paginaActualProductos === 1;

    // configura el estado del boton siguiente

    botonSiguiente.disabled =
        paginaActualProductos === totalPaginas;

    // configura el boton anterior

    botonAnterior.onclick = function() {

        if (paginaActualProductos > 1) {

            cambiarPaginaProductos(
                paginaActualProductos - 1
            );

        }

    };

    // configura el boton siguiente

    botonSiguiente.onclick = function() {

        const totalPaginasActuales =
            Math.ceil(
                productosFiltradosActuales.length /
                productosPorPagina
            );

        if (
            paginaActualProductos <
            totalPaginasActuales
        ) {

            cambiarPaginaProductos(
                paginaActualProductos + 1
            );

        }

    };

    // limpia los numeros anteriores

    numerosPaginas.innerHTML = '';

    // crea los botones de cada pagina

    mostrarNumerosPaginasProductos(
    totalPaginas
        );{

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

        if (
            pagina === paginaActualProductos
        ) {

            botonPagina.classList.add(
                'pagina_actual_productos'
            );

        }

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
}

  // configura los botones anterior y siguiente

function configurarPaginacionProductos() {

    const botonAnterior =
        document.getElementById(
            'boton_pagina_anterior_productos'
        );

    const botonSiguiente =
        document.getElementById(
            'boton_pagina_siguiente_productos'
        );


    if (
        !botonAnterior ||
        !botonSiguiente
    ) {
        return;
    }


    botonAnterior.onclick = function() {

        if (
            paginaActualProductos > 1
        ) {

            cambiarPaginaProductos(
                paginaActualProductos - 1
            );

        }

    };


    botonSiguiente.onclick = function() {

        const totalPaginas =
            Math.ceil(
                productosFiltradosActuales.length /
                productosPorPagina
            );


        if (
            paginaActualProductos <
            totalPaginas
        ) {

            cambiarPaginaProductos(
                paginaActualProductos + 1
            );

        }

    };

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