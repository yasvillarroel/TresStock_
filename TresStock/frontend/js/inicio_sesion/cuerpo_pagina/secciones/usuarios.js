// variable para almacenar los usuarios obtenidos desde el backend
let usuariosCargados = [];


// TITULO 1 FORMULARIO USUARIO

    // función para mostrar el formulario de registro de un nuevo usuario
    function abrirFormularioUsuario() {

        const contenedorFormularioUsuario = document.getElementById(
            'contenedor_formulario_usuario'
        );

        const tituloFormularioUsuario = document.getElementById(
            'titulo_formulario_usuario'
        );


        if (tituloFormularioUsuario) {

            tituloFormularioUsuario.textContent =
                'Nuevo usuario';

        }


        limpiarFormularioUsuario();


        if (contenedorFormularioUsuario) {

            contenedorFormularioUsuario.classList.remove(
                'contenedor_formulario_usuario_oculto'
            );

        }

    }


    // función para ocultar el formulario de usuario
    function cerrarFormularioUsuario() {

        const contenedorFormularioUsuario = document.getElementById(
            'contenedor_formulario_usuario'
        );


        if (contenedorFormularioUsuario) {

            contenedorFormularioUsuario.classList.add(
                'contenedor_formulario_usuario_oculto'
            );

        }

    }


// TITULO 2 LIMPIEZA FORMULARIO USUARIO

    // función para limpiar los campos del formulario de usuario
    function limpiarFormularioUsuario() {

        const inputNombreUsuario = document.getElementById(
            'input_nombre_usuario'
        );

        const inputEmailUsuario = document.getElementById(
            'input_email_usuario'
        );

        const inputPasswordUsuario = document.getElementById(
            'input_password_usuario'
        );

        const inputConfirmarPasswordUsuario = document.getElementById(
            'input_confirmar_password_usuario'
        );

        const selectRolUsuario = document.getElementById(
            'select_rol_usuario'
        );


        if (inputNombreUsuario) {

            inputNombreUsuario.value = '';

        }


        if (inputEmailUsuario) {

            inputEmailUsuario.value = '';

        }


        if (inputPasswordUsuario) {

            inputPasswordUsuario.value = '';

        }


        if (inputConfirmarPasswordUsuario) {

            inputConfirmarPasswordUsuario.value = '';

        }


        if (selectRolUsuario) {

            selectRolUsuario.value = '';

        }

    }


// TITULO 3 CARGAR USUARIOS

    // función para obtener los usuarios registrados desde el backend
    async function cargarUsuarios() {

        try {

            const respuesta = await fetch(
                'http://127.0.0.1:3000/api/usuarios',
                {
                    method: 'GET',
                    credentials: 'include'
                }
            );


            const resultado = await respuesta.json();


            if (!respuesta.ok) {

                console.error(
                    'Error al obtener usuarios:',
                    resultado
                );

                return;

            }


            /*
             * permite trabajar si el backend devuelve:
             *
             * [
             *     {...},
             *     {...}
             * ]
             *
             * o:
             *
             * {
             *     usuarios: [...]
             * }
             */

            if (Array.isArray(resultado)) {

                usuariosCargados = resultado;

            } else if (
                resultado &&
                Array.isArray(resultado.usuarios)
            ) {

                usuariosCargados =
                    resultado.usuarios;

            } else {

                usuariosCargados = [];

            }


            mostrarUsuarios(
                usuariosCargados
            );


            actualizarIndicadoresUsuarios(
                usuariosCargados
            );


        } catch (error) {

            console.error(
                'Error al cargar usuarios:',
                error
            );

        }

    }


// TITULO 4 MOSTRAR USUARIOS

    // función para mostrar los usuarios dentro de la tabla
    function mostrarUsuarios(usuarios) {

        const cuerpoTabla = document.getElementById(
            'cuerpo_tabla_usuarios'
        );


        if (!cuerpoTabla) {

            return;

        }


        cuerpoTabla.innerHTML = '';


        // muestra mensaje cuando no existen usuarios
        if (!usuarios.length) {

            cuerpoTabla.innerHTML = `
                <tr class="fila_sin_usuarios">

                    <td
                        class="dato_sin_usuarios"
                        colspan="6"
                    >
                        No hay usuarios cargados para mostrar.
                    </td>

                </tr>
            `;

            return;

        }


        // recorre los usuarios obtenidos desde el backend
        usuarios.forEach(function(usuario) {

            const fila = document.createElement(
                'tr'
            );


            fila.className =
                'fila_usuario';


            // obtiene el nombre del rol del usuario
            const nombreRol =
                obtenerNombreRolUsuario(
                    usuario
                );


            // determina si el usuario está activo
            const usuarioActivo =
                obtenerEstadoUsuario(
                    usuario
                );


            // establece el texto del estado
            const textoEstado =
                usuarioActivo
                    ? 'Activo'
                    : 'Inactivo';


            // establece la clase visual del estado
            const claseEstado =
                usuarioActivo
                    ? 'estado_usuario_activo'
                    : 'estado_usuario_inactivo';


            // formatea la fecha de creación
            const fechaCreacion =
                formatearFechaUsuario(
                    usuario.fecha_creacion
                );


            fila.innerHTML = `

                <td class="dato_nombre_usuarios">
                    ${usuario.nombre || '-'}
                </td>

                <td class="dato_email_usuarios">
                    ${usuario.email || '-'}
                </td>

                <td class="dato_rol_usuarios">
                    ${nombreRol}
                </td>

                <td class="dato_estado_usuarios">

                    <div class="${claseEstado}">
                        ${textoEstado}
                    </div>

                </td>

                <td class="dato_fecha_creacion_usuarios">
                    ${fechaCreacion}
                </td>

                <td class="dato_acciones_usuarios">
                    -
                </td>

            `;


            cuerpoTabla.appendChild(
                fila
            );

        });

    }


// TITULO 5 OBTENER ROL USUARIO

    // función para obtener el nombre del rol de un usuario
    function obtenerNombreRolUsuario(usuario) {

        // utiliza el nombre del rol si el backend ya lo entrega
        if (usuario.rol) {

            return usuario.rol;

        }


        if (usuario.nombre_rol) {

            return usuario.nombre_rol;

        }


        // obtiene el rol utilizando su identificador
        if (Number(usuario.id_rol) === 1) {

            return 'Administrador';

        }


        if (Number(usuario.id_rol) === 2) {

            return 'Usuario';

        }


        return '-';

    }


// TITULO 6 OBTENER ESTADO USUARIO

    // función para determinar si un usuario está activo
    function obtenerEstadoUsuario(usuario) {

        return (
            usuario.activo === true ||
            usuario.activo === 'true' ||
            usuario.activo === 1 ||
            usuario.activo === '1'
        );

    }


// TITULO 7 FORMATEAR FECHA USUARIO

    // función para mostrar la fecha de creación en formato chileno
    function formatearFechaUsuario(fecha) {

        if (!fecha) {

            return '-';

        }


        const fechaUsuario =
            new Date(fecha);


        if (
            Number.isNaN(
                fechaUsuario.getTime()
            )
        ) {

            return '-';

        }


        return fechaUsuario.toLocaleDateString(
            'es-CL',
            {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            }
        );

    }


// TITULO 8 INDICADORES USUARIOS

    // función para actualizar los indicadores principales de usuarios
    function actualizarIndicadoresUsuarios(usuarios) {

        const valorTotalUsuarios = document.getElementById(
            'valor_total_usuarios'
        );

        const valorUsuariosActivos = document.getElementById(
            'valor_usuarios_activos'
        );

        const valorUsuariosInactivos = document.getElementById(
            'valor_usuarios_inactivos'
        );

        const valorAdministradoresUsuarios = document.getElementById(
            'valor_administradores_usuarios'
        );


        // obtiene la cantidad de usuarios activos
        const usuariosActivos = usuarios.filter(
            function(usuario) {

                return obtenerEstadoUsuario(
                    usuario
                );

            }
        );


        // obtiene la cantidad de usuarios inactivos
        const usuariosInactivos = usuarios.filter(
            function(usuario) {

                return !obtenerEstadoUsuario(
                    usuario
                );

            }
        );


        // obtiene la cantidad de administradores
        const administradores = usuarios.filter(
            function(usuario) {

                return (
                    obtenerNombreRolUsuario(
                        usuario
                    ) === 'Administrador'
                );

            }
        );


        // actualiza total de usuarios
        if (valorTotalUsuarios) {

            valorTotalUsuarios.textContent =
                usuarios.length;

        }


        // actualiza usuarios activos
        if (valorUsuariosActivos) {

            valorUsuariosActivos.textContent =
                usuariosActivos.length;

        }


        // actualiza usuarios inactivos
        if (valorUsuariosInactivos) {

            valorUsuariosInactivos.textContent =
                usuariosInactivos.length;

        }


        // actualiza administradores
        if (valorAdministradoresUsuarios) {

            valorAdministradoresUsuarios.textContent =
                administradores.length;

        }

    }


// TITULO 9 CONFIGURACION FILTROS USUARIOS

    // función para activar los filtros de usuarios
    function configurarFiltrosUsuarios() {

        const inputBusqueda = document.getElementById(
            'input_busqueda_usuarios'
        );

        const selectRol = document.getElementById(
            'select_rol_usuarios'
        );

        const selectEstado = document.getElementById(
            'select_estado_usuarios'
        );


        // activa la búsqueda por nombre o correo
        if (inputBusqueda) {

            inputBusqueda.addEventListener(
                'input',
                filtrarUsuarios
            );

        }


        // activa el filtro por rol
        if (selectRol) {

            selectRol.addEventListener(
                'change',
                filtrarUsuarios
            );

        }


        // activa el filtro por estado
        if (selectEstado) {

            selectEstado.addEventListener(
                'change',
                filtrarUsuarios
            );

        }

    }


// TITULO 10 FILTRAR USUARIOS

    // función para filtrar usuarios por búsqueda, rol y estado
    function filtrarUsuarios() {

        const inputBusqueda = document.getElementById(
            'input_busqueda_usuarios'
        );

        const selectRol = document.getElementById(
            'select_rol_usuarios'
        );

        const selectEstado = document.getElementById(
            'select_estado_usuarios'
        );


        const textoBusqueda =
            inputBusqueda
                ? inputBusqueda.value
                    .trim()
                    .toLowerCase()
                : '';


        const rolSeleccionado =
            selectRol
                ? selectRol.value
                : '';


        const estadoSeleccionado =
            selectEstado
                ? selectEstado.value
                : '';


        const usuariosFiltrados =
            usuariosCargados.filter(
                function(usuario) {

                    // nombre del usuario
                    const nombre =
                        String(
                            usuario.nombre || ''
                        ).toLowerCase();


                    // correo del usuario
                    const email =
                        String(
                            usuario.email || ''
                        ).toLowerCase();


                    // rol del usuario
                    const rol =
                        obtenerNombreRolUsuario(
                            usuario
                        );


                    // estado del usuario
                    const estado =
                        obtenerEstadoUsuario(
                            usuario
                        )
                            ? 'activo'
                            : 'inactivo';


                    // comprueba búsqueda
                    const coincideBusqueda =
                        !textoBusqueda ||
                        nombre.includes(
                            textoBusqueda
                        ) ||
                        email.includes(
                            textoBusqueda
                        );


                    // comprueba rol
                    const coincideRol =
                        !rolSeleccionado ||
                        rol === rolSeleccionado;


                    // comprueba estado
                    const coincideEstado =
                        !estadoSeleccionado ||
                        estado === estadoSeleccionado;


                    return (
                        coincideBusqueda &&
                        coincideRol &&
                        coincideEstado
                    );

                }
            );


        mostrarUsuarios(
            usuariosFiltrados
        );

    }


// TITULO 11 INICIALIZACION USUARIOS

    // función para inicializar el funcionamiento de la vista usuarios
    async function inicializarUsuarios() {

        configurarFiltrosUsuarios();


        await cargarUsuarios();

    }