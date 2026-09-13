// TITULO 1 FORMULARIO USUARIO

    // función para mostrar el formulario de registro de un nuevo usuario
    function abrirFormularioUsuario() {

        const contenedorFormularioUsuario = document.getElementById('contenedor_formulario_usuario');

        const tituloFormularioUsuario = document.getElementById('titulo_formulario_usuario');

        if (tituloFormularioUsuario) {
            tituloFormularioUsuario.textContent = 'Nuevo usuario';
        }

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