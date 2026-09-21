// TITULO 1 FORMULARIO USUARIO

    // función para mostrar el formulario de registro de un nuevo usuario
    function abrirFormularioUsuario() {

        const contenedorFormularioUsuario = document.getElementById('contenedor_formulario_usuario');

        const tituloFormularioUsuario = document.getElementById('titulo_formulario_usuario');

        if (tituloFormularioUsuario) {
            tituloFormularioUsuario.textContent = 'Nuevo usuario';
        }

        limpiarFormularioUsuario();

        if (contenedorFormularioUsuario) {
            contenedorFormularioUsuario.classList.remove('contenedor_formulario_usuario_oculto');
        }

    }


    // función para ocultar el formulario de usuario
    function cerrarFormularioUsuario() {

        const contenedorFormularioUsuario = document.getElementById('contenedor_formulario_usuario');

        if (contenedorFormularioUsuario) {
            contenedorFormularioUsuario.classList.add('contenedor_formulario_usuario_oculto');
        }

    }


// TITULO 2 LIMPIEZA FORMULARIO USUARIO

    // función para limpiar los campos del formulario de usuario
    function limpiarFormularioUsuario() {

        const inputNombreUsuario = document.getElementById('input_nombre_usuario');
        const inputEmailUsuario = document.getElementById('input_email_usuario');
        const inputPasswordUsuario = document.getElementById('input_password_usuario');
        const selectRolUsuario = document.getElementById('select_rol_usuario');
        const inputConfirmarPasswordUsuario  = document.getElementById('input_confirmar_password_usuario');

        if (inputNombreUsuario) {
            inputNombreUsuario.value = '';
        }

        if (inputEmailUsuario) {
            inputEmailUsuario.value = '';
        }

        if (inputPasswordUsuario) {
            inputPasswordUsuario.value = '';
        }

        if (selectRolUsuario) {
            selectRolUsuario.value = '';
        }

        if (inputConfirmarPasswordUsuario) {
            inputConfirmarPasswordUsuario.value = '';
        }

    }