// TITULO 1 FORMULARIO PRODUCTO

    // función para mostrar el formulario de registro de un nuevo producto
    function abrirFormularioProducto() {

        const contenedorFormularioProducto = document.getElementById('contenedor_formulario_producto');

        const tituloFormularioProducto = document.getElementById('titulo_formulario_producto');

        if (tituloFormularioProducto) {
            tituloFormularioProducto.textContent = 'Nuevo producto';
        }

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