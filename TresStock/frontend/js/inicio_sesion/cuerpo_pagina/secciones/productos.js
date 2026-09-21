// TITULO 1 FORMULARIO PRODUCTO

    // función para mostrar el formulario de registro de un nuevo producto
    function abrirFormularioProducto() {

        const contenedorFormularioProducto = document.getElementById('contenedor_formulario_producto');

        const tituloFormularioProducto = document.getElementById('titulo_formulario_producto');

        if (tituloFormularioProducto) {
            tituloFormularioProducto.textContent = 'Nuevo producto';
        }

        limpiarFormularioProducto();

        if (contenedorFormularioProducto) {
            contenedorFormularioProducto.classList.remove('contenedor_formulario_producto_oculto');
        }

    }


    // función para ocultar el formulario de producto
    function cerrarFormularioProducto() {

        const contenedorFormularioProducto = document.getElementById('contenedor_formulario_producto');

        if (contenedorFormularioProducto) {
            contenedorFormularioProducto.classList.add('contenedor_formulario_producto_oculto');
        }

    }


// TITULO 2 LIMPIEZA FORMULARIO PRODUCTO

    // función para limpiar los campos del formulario de producto
    function limpiarFormularioProducto() {

        const inputCodigoProducto = document.getElementById('input_codigo_producto');
        const inputCodigoBarraProducto = document.getElementById('input_codigo_barra_producto');
        const inputDescripcionProducto = document.getElementById('input_descripcion_producto');
        const inputFamiliaProducto = document.getElementById('input_familia_producto');
        const inputPrecioProducto = document.getElementById('input_precio_producto');
        const selectProveedorProducto = document.getElementById('select_proveedor_producto');

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

// TITULO 2 BOTON IMPORTAR DESDE EXCEL

    // abre la ventana de importacion de productos
    function abrirImportacionProductos() {

        const contenedor = document.getElementById('contenedor_importacion_productos');

        contenedor.classList.remove('contenedor_importacion_productos_oculto');

    }


    // cierra la ventana de importacion de productos
    function cerrarImportacionProductos() {

        const contenedor = document.getElementById('contenedor_importacion_productos');
        const inputArchivo = document.getElementById('input_archivo_productos');
        const informacionArchivo = document.getElementById('informacion_archivo_productos');

        contenedor.classList.add('contenedor_importacion_productos_oculto');

        inputArchivo.value = '';

        informacionArchivo.textContent = 'No se ha seleccionado ningún archivo.';

    }


    // abre el explorador de archivos
    function seleccionarArchivoProductos() {

        const inputArchivo = document.getElementById('input_archivo_productos');

        inputArchivo.click();

    }


    // configura la seleccion del archivo
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

            if (!archivo) {

                informacionArchivo.textContent =
                    'No se ha seleccionado ningún archivo.';

                return;
            }

            informacionArchivo.textContent =
                `Archivo seleccionado: ${archivo.name}`;

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

        const archivo = inputArchivo.files[0];

        if (!archivo) {

            informacionArchivo.textContent =
                'Selecciona un archivo antes de importar.';

            return;

        }

        informacionArchivo.textContent =
            'Enviando archivo...';

        const datos = new FormData();

        datos.append('archivo', archivo);

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
                'resultado de la importacion:',
                resultado
            );

            const resumen = resultado.resumen;

            informacionArchivo.textContent =
                `Importacion completada

                Total de filas: ${resumen.total_filas}

                Productos importados: ${resumen.productos_importados}

                Productos no importados porque ya existen: ${resumen.productos_existentes}`;

        } catch (error) {

            console.error(
                'Error al importar productos:',
                error
            );

            informacionArchivo.textContent =
                'No se pudo conectar con el servidor.';

        }

    }


// Cargar los productos

async function cargarProductos() {

    try {

        const respuesta = await fetch(
            'http://127.0.0.1:3000/api/productos',
            {
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

        mostrarProductos(productosCargados);

    } catch (error) {

        console.error(
            'Error al cargar productos:',
            error
        );

    }
}

// Mostrar los productos 
function mostrarProductos(productos) {

    const cuerpoTabla = document.getElementById(
        'cuerpo_tabla_productos'
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

        return;
    }

    productos.forEach(producto => {

        const fila = document.createElement('tr');

        fila.className = 'fila_producto';

        fila.innerHTML = `
            <td class="dato_codigo_productos">
                ${producto.codigo}
            </td>

            <td class="dato_codigo_barra_productos">
                ${producto.cod_barra}
            </td>

            <td class="dato_descripcion_productos">
                ${producto.descripcion}
            </td>

            <td class="dato_familia_productos">
                ${producto.familia || '-'}
            </td>

            <td class="dato_precio_productos">
                ${producto.precio_publico}
            </td>

            <td class="dato_stock_actual_productos">
                ${producto.stock_actual ?? 0}
            </td>

            <td class="dato_stock_minimo_productos">
                ${producto.stock_minimo ?? 0}
            </td>

            <td class="dato_proveedor_productos">
                -
            </td>

            <td class="dato_acciones_productos">
                -
            </td>
        `;

        cuerpoTabla.appendChild(fila);

    });
}

// Cargar las familias
async function cargarFamilias() {

    const selectFamilia = document.getElementById(
        'select_familia_productos'
    );

    try {

        const respuesta = await fetch(
            'http://127.0.0.1:3000/api/productos/familias',
            {
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
            <option value="">Todas las familias</option>
        `;

        familias.forEach(familia => {

            const opcion = document.createElement('option');

            opcion.value = familia.familia;
            opcion.textContent = familia.familia;

            selectFamilia.appendChild(opcion);

        });

    } catch (error) {

        console.error(
            'Error al cargar familias:',
            error
        );

    }

}

// filtro de familia
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

// filtro de busqueda
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


// filtra los productos por familia y busqueda
function filtrarProductos() {

    const selectFamilia = document.getElementById(
        'select_familia_productos'
    );

    const inputBusqueda = document.getElementById(
        'input_busqueda_productos'
    );

    const familiaSeleccionada = selectFamilia.value;

    const textoBusqueda = inputBusqueda.value
        .trim()
        .toLowerCase();

    const productosFiltrados = productosCargados.filter(
        producto => {

            const coincideFamilia =
                !familiaSeleccionada ||
                producto.familia === familiaSeleccionada;

            const coincideBusqueda =
                !textoBusqueda ||
                producto.codigo.toLowerCase().includes(textoBusqueda) ||
                producto.cod_barra.toLowerCase().includes(textoBusqueda) ||
                producto.descripcion.toLowerCase().includes(textoBusqueda);

            return coincideFamilia && coincideBusqueda;

        }
    );

    mostrarProductos(productosFiltrados);
}