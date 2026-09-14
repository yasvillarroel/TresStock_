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