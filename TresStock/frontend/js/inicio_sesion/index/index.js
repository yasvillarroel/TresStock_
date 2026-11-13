// TITULO 1 CARGA DE COMPONENTES PRINCIPALES

    // función para cargar un archivo HTML dentro de un contenedor
    async function cargarComponente(ruta, idContenedor) {

        const respuesta = await fetch(ruta);

        const contenido = await respuesta.text();

        document.getElementById(idContenedor).innerHTML = contenido;

    }


// TITULO 2 VERIFICACIÓN DE SESIÓN

    // usuario vigente obtenido desde la ruta protegida /api/autenticacion/sesion
    let usuarioSesionActual = null;

    // comprueba el rol actual del usuario para controlar las vistas del frontend
    function puedeAdministrarUsuarios() {

        const idRol = usuarioSesionActual
            ? (usuarioSesionActual.rol ?? usuarioSesionActual.id_rol)
            : null;

        return Number(idRol) === 1;

    }


    // función que consulta al backend si la cookie de sesión sigue siendo válida
    // (esto luego se puede mover a js/comun/autenticacion.js para reutilizarlo en otras páginas)
    async function verificarSesion() {

        try {

            const respuesta = await fetch(
                `${URL_API}/api/autenticacion/sesion`,
                {
                    method: 'GET',
                    credentials: 'include'
                }
            );

            if (!respuesta.ok) {
                return null;
            }

            const datos = await respuesta.json();

            return datos.usuario;

        } catch (error) {

            return null;
        }
    }

// TITULO 3 CARGA INICIAL DEL SISTEMA

    // función para cargar los componentes principales de TresStock
    async function cargarSistema(usuario) {

        await cargarComponente(
            './html/inicio_sesion/cuerpo_pagina/menu_lateral/menu_lateral.html',
            'contenedor_menu'
        );

        await cargarComponente(
            './html/inicio_sesion/cuerpo_pagina/cabecera/cabecera.html',
            'contenedor_cabecera'
        );

        // muestra el nombre y correo de la sesion en la cabecera ya cargada
        mostrarUsuarioCabecera(usuario);

        // configura el menu desplegable despues de insertar cabecera.html
        inicializarMenuUsuarioCabecera();
        // conecta la campanita con las alertas actuales de inventario
        inicializarNotificacionesCabecera();

        const vistaGuardada = sessionStorage.getItem(
            'vista_actual'
        );

        // evita reabrir Administración si la vista fue guardada con otra cuenta
        const vistaActual = vistaGuardada === 'administracion' && !puedeAdministrarUsuarios()
            ? 'dashboard'
            : (vistaGuardada || 'dashboard');

        // activa el funcionamiento responsive y la visibilidad según el rol
        inicializarMenuLateral(vistaActual, usuario);

        await cargarVista(vistaActual);
    }

// TITULO 4 CARGA DE VISTAS

    // función para cargar la vista seleccionada desde el menú lateral
    async function cargarVista(vista) {

        // restringe la navegación interna: solo administradores abren Administración
        if (vista === 'administracion' && !puedeAdministrarUsuarios()) {

            vista = 'dashboard';

            // actualiza también la opción visual activa del menú
            if (typeof seleccionarOpcionMenu === 'function') {
                seleccionarOpcionMenu('dashboard', false);
            }

        }

        const rutasVistas = {

            dashboard:'./html/inicio_sesion/cuerpo_pagina/secciones/dashboard.html',
            inventario:'./html/inicio_sesion/cuerpo_pagina/secciones/inventario.html',
            productos:'./html/inicio_sesion/cuerpo_pagina/secciones/productos.html',
            ventas:'./html/inicio_sesion/cuerpo_pagina/secciones/ventas.html',
            proveedores:'./html/inicio_sesion/cuerpo_pagina/secciones/proveedores.html',
            alertas:'./html/inicio_sesion/cuerpo_pagina/secciones/alertas_vencimientos.html',
            analisis:'./html/inicio_sesion/cuerpo_pagina/secciones/reportes_analitica.html',
            administracion:'./html/inicio_sesion/cuerpo_pagina/secciones/usuarios.html?v=20261113-6',
            escaner:'./html/inicio_sesion/cuerpo_pagina/secciones/escaner.html'
        };


        const titulosVistas = {

            dashboard: 'Dashboard',
            inventario: 'Inventario',
            productos: 'Productos',
            ventas: 'Ventas',
            proveedores: 'Proveedores',
            alertas: 'Alertas y vencimientos',
            analisis: 'Análisis',
            administracion: 'Administración',
            escaner: 'Escáner'
        };

        const rutaVista = rutasVistas[vista];

        if (!rutaVista) {return;}

        // apaga la camara si venia del escaner
        if (typeof cerrarEscanerProducto === 'function') {cerrarEscanerProducto();}

        // el escaner no se guarda como vista actual, para que al recargar
        // no se vuelva a pedir la camara
        if (vista !== 'escaner') {sessionStorage.setItem('vista_actual',vista);}

        await cargarComponente(rutaVista,'contenedor_contenido');

        // carga los indicadores y el ranking del dashboard
        if (vista === 'dashboard') {inicializarDashboard();}

        // inicializa el funcionamiento de inventario
        if (vista === 'inventario') {await inicializarInventario();}

        // carga la lista paginada de pronósticos por producto
        if (vista === 'analisis') {await inicializarAnalisisPronostico();}

        // carga los lotes de vencimiento y la paginación de la vista de alertas
        if (vista === 'alertas') {await inicializarAlertasVencimientos();}

        // inicializa ventas
        if (vista === 'ventas') {await inicializarVentas();}

        // inicializa el funcionamiento de productos
        if (vista === 'productos') {await inicializarProductos();}

        // inicializa el funcionamiento de usuarios
        if (vista === 'administracion') {inicializarUsuarios();}

        if (vista === 'proveedores') {inicializarProveedores();}

        // inicializa el escaner (su HTML ya esta cargado)
        if (vista === 'escaner') {inicializarEscaner();}

        // actualiza el título de la cabecera
        const tituloVistaCabecera =document.getElementById('titulo_vista_cabecera');

        if (tituloVistaCabecera) {tituloVistaCabecera.textContent =titulosVistas[vista];}

    }

// TITULO 5 INICIO DEL SISTEMA

    // función que decide si mostrar el sistema o mandar a inicio_sesion
    async function iniciarAplicacion() {

        const usuario = await verificarSesion();

        if (!usuario) {window.location.href = './html/inicio_sesion/inicio_sesion.html';return;}

        // usa el rol de la sesión confirmada por el backend, no datos del navegador
        usuarioSesionActual = usuario;

        console.log('Usuario autenticado:', usuario);

        await cargarSistema(usuario);
    }

    // llama a la función principal al cargar el index
    iniciarAplicacion();
