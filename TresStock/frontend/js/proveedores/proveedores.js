// TITULO 1 FORMULARIO PROVEEDOR

    // función para mostrar el formulario de registro de un nuevo proveedor
    function abrirFormularioProveedor() {

        const contenedorFormularioProveedor = document.getElementById('contenedor_formulario_proveedor');

        const tituloFormularioProveedor = document.getElementById('titulo_formulario_proveedor');

        if (tituloFormularioProveedor) {
            tituloFormularioProveedor.textContent = 'Nuevo proveedor';
        }

        limpiarFormularioProveedor();

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


// TITULO 2 LIMPIEZA FORMULARIO PROVEEDOR

    // función para limpiar los campos del formulario de proveedor
    function limpiarFormularioProveedor() {

        const inputNombreProveedor = document.getElementById('input_nombre_proveedor');
        const inputTelefonoProveedor = document.getElementById('input_telefono_proveedor');
        const inputEmailProveedor = document.getElementById('input_email_proveedor');
        const inputDireccionProveedor = document.getElementById('input_direccion_proveedor');

        if (inputNombreProveedor) {
            inputNombreProveedor.value = '';
        }

        if (inputTelefonoProveedor) {
            inputTelefonoProveedor.value = '';
        }

        if (inputEmailProveedor) {
            inputEmailProveedor.value = '';
        }

        if (inputDireccionProveedor) {
            inputDireccionProveedor.value = '';
        }

    }