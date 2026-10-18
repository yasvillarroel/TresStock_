// direccion base de la api de usuarios
const URL_API_USUARIOS = 'http://127.0.0.1:3000/api/usuarios';

// variable para almacenar los usuarios obtenidos desde el backend
let usuariosCargados = [];

// evita enviar el formulario dos veces seguidas
let guardandoUsuario = false;


// TITULO 1 FORMULARIO USUARIO

    // muestra el formulario de registro de un nuevo usuario
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


    // oculta el formulario de usuario
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

    // limpia los campos del formulario de usuario
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

    // obtiene los usuarios registrados desde el backend
    async function cargarUsuarios() {

        try {

            const respuesta = await fetch(
                URL_API_USUARIOS,
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


            // permite trabajar si el backend devuelve un arreglo o un objeto con usuarios
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


            // vuelve a aplicar los filtros activos sobre la lista nueva
            filtrarUsuarios();


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

    // escapa texto para que no se interprete como html
    function escaparTextoUsuario(texto) {

        const elemento = document.createElement(
            'div'
        );

        elemento.textContent =
            texto;

        return elemento.innerHTML;

    }


    // muestra los usuarios dentro de la tabla
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


            // determina si el usuario esta activo
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


            // establece el texto de la accion
            const textoAccion =
                usuarioActivo
                    ? 'Desactivar'
                    : 'Activar';


            // formatea la fecha de creacion
            const fechaCreacion =
                formatearFechaUsuario(
                    usuario.fecha_creacion
                );


            fila.innerHTML = `

                <td class="dato_nombre_usuarios">
                    ${escaparTextoUsuario(usuario.nombre || '-')}
                </td>

                <td class="dato_email_usuarios">
                    ${escaparTextoUsuario(usuario.email || '-')}
                </td>

                <td class="dato_rol_usuarios">
                    ${escaparTextoUsuario(nombreRol)}
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

                    <div
                        class="boton_cambiar_estado_usuario"
                        data-id-usuario="${Number(usuario.id_usuario)}"
                        data-activo-nuevo="${!usuarioActivo}"
                    >
                        ${textoAccion}
                    </div>

                </td>

            `;


            cuerpoTabla.appendChild(
                fila
            );

        });

    }


// TITULO 5 OBTENER ROL USUARIO

    // obtiene el nombre del rol de un usuario
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

    // determina si un usuario esta activo
    function obtenerEstadoUsuario(usuario) {

        return (
            usuario.activo === true ||
            usuario.activo === 'true' ||
            usuario.activo === 1 ||
            usuario.activo === '1'
        );

    }


// TITULO 7 FORMATEAR FECHA USUARIO

    // muestra la fecha de creacion en formato chileno
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

    // actualiza los indicadores principales de usuarios
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


        // obtiene los usuarios activos
        const usuariosActivos = usuarios.filter(
            function(usuario) {

                return obtenerEstadoUsuario(
                    usuario
                );

            }
        );


        // obtiene los usuarios inactivos
        const usuariosInactivos = usuarios.filter(
            function(usuario) {

                return !obtenerEstadoUsuario(
                    usuario
                );

            }
        );


        // obtiene los administradores
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

    // activa los filtros de usuarios
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


        // activa la busqueda por nombre o correo
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

    // filtra usuarios por busqueda rol y estado
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


                    // comprueba busqueda
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


// TITULO 11 GUARDAR USUARIO

    // envia los datos del formulario para registrar un usuario nuevo
    async function guardarUsuario() {

        // evita envios repetidos mientras se espera la respuesta
        if (guardandoUsuario) {

            return;

        }


        const nombre = document.getElementById(
            'input_nombre_usuario'
        ).value.trim();

        const email = document.getElementById(
            'input_email_usuario'
        ).value.trim();

        const password = document.getElementById(
            'input_password_usuario'
        ).value;

        const confirmar_password = document.getElementById(
            'input_confirmar_password_usuario'
        ).value;

        const rol = document.getElementById(
            'select_rol_usuario'
        ).value;


        // valida que no falten campos
        if (
            !nombre ||
            !email ||
            !password ||
            !confirmar_password ||
            !rol
        ) {

            alert('Completa todos los campos');

            return;

        }


        // valida que ambas contraseñas coincidan
        if (password !== confirmar_password) {

            alert('Las contraseñas no coinciden');

            return;

        }


        guardandoUsuario = true;


        try {

            const respuesta = await fetch(
                URL_API_USUARIOS,
                {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        nombre,
                        email,
                        password,
                        confirmar_password,
                        rol
                    })
                }
            );


            const resultado = await respuesta.json();


            // muestra el mensaje que envio el backend si fallo
            if (!respuesta.ok) {

                alert(
                    resultado.mensaje ||
                    'No se pudo crear el usuario'
                );

                return;

            }


            cerrarFormularioUsuario();


            await cargarUsuarios();


        } catch (error) {

            console.error(
                'Error al guardar usuario:',
                error
            );

            alert('No se pudo crear el usuario');

        } finally {

            guardandoUsuario = false;

        }

    }


// TITULO 12 CAMBIAR ESTADO USUARIO

    // activa o desactiva un usuario
    async function cambiarEstadoUsuario(idUsuario, activo) {

        try {

            const respuesta = await fetch(
                `${URL_API_USUARIOS}/${idUsuario}/estado`,
                {
                    method: 'PUT',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        activo
                    })
                }
            );


            if (!respuesta.ok) {

                alert('No se pudo cambiar el estado del usuario');

                return;

            }


            await cargarUsuarios();


        } catch (error) {

            console.error(
                'Error al cambiar estado del usuario:',
                error
            );

            alert('No se pudo cambiar el estado del usuario');

        }

    }


    // detecta los clics sobre los botones de la tabla
    function configurarAccionesTablaUsuarios() {

        const cuerpoTabla = document.getElementById(
            'cuerpo_tabla_usuarios'
        );


        if (!cuerpoTabla) {

            return;

        }


        cuerpoTabla.addEventListener(
            'click',
            function(evento) {

                const botonEstado = evento.target.closest(
                    '.boton_cambiar_estado_usuario'
                );


                if (!botonEstado) {

                    return;

                }


                cambiarEstadoUsuario(
                    Number(botonEstado.dataset.idUsuario),
                    botonEstado.dataset.activoNuevo === 'true'
                );

            }
        );

    }


// TITULO 13 INICIALIZACION USUARIOS

    // inicializa el funcionamiento de la vista usuarios
    async function inicializarUsuarios() {

        const botonGuardarUsuario = document.getElementById(
            'boton_guardar_usuario'
        );


        if (botonGuardarUsuario) {

            botonGuardarUsuario.addEventListener(
                'click',
                guardarUsuario
            );

        }


        configurarFiltrosUsuarios();


        configurarAccionesTablaUsuarios();


        await cargarUsuarios();

    }