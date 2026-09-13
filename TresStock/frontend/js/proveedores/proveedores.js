// TITULO 1 FORMULARIO PROVEEDOR

    // función para mostrar el formulario de registro de un nuevo proveedor
    function abrirFormularioProveedor() {

        const contenedorFormularioProveedor = document.getElementById('contenedor_formulario_proveedor');

        const tituloFormularioProveedor = document.getElementById('titulo_formulario_proveedor');

        if (tituloFormularioProveedor) {
            tituloFormularioProveedor.textContent = 'Nuevo proveedor';
        }

        if (contenedorFormularioProveedor) {
            contenedorFormularioProveedor.classList.remove('contenedor_formulario_proveedor_oculto');
        }

    }

    // función para ocultar el formulario de proveedor
    function cerrarFormularioProveedor() {

        const contenedorFormularioProveedor = document.getElementById('contenedor_formulario_proveedor');

        if (contenedorFormularioProveedor) {
            contenedorFormularioProveedor.classList.add('contenedor_formulario_proveedor_oculto');
        }

    }