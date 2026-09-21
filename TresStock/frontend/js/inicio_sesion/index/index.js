// TITULO 1 CARGA DE COMPONENTES PRINCIPALES

    // función para cargar un archivo HTML dentro de un contenedor
    async function cargarComponente(ruta, idContenedor) {

        const respuesta = await fetch(ruta);

        const contenido = await respuesta.text();

        document.getElementById(idContenedor).innerHTML = contenido;

    }


// TITULO 2 VERIFICACIÓN DE SESIÓN

    // función que consulta al backend si la cookie de sesión sigue siendo válida
    // (esto luego se puede mover a js/comun/autenticacion.js para reutilizarlo en otras páginas)
    async function verificarSesion() {

        try {

            const respuesta = await fetch(
                'http://127.0.0.1:3000/api/autenticacion/sesion',
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
    async function cargarSistema() {

        await cargarComponente(
            './html/inicio_sesion/cuerpo_pagina/menu_lateral/menu_lateral.html',
            'contenedor_menu'
        );

        await cargarComponente(
            './html/inicio_sesion/cuerpo_pagina/cabecera/cabecera.html',
            'contenedor_cabecera'
        );


        // activa el funcionamiento responsive del menú lateral
        inicializarMenuLateral();


        await cargarVista('dashboard');

    }

// TITULO 4 CARGA DE VISTAS

    // función para cargar la vista seleccionada desde el menú lateral
    async function cargarVista(vista) {

        const rutasVistas = {

            dashboard:'./html/inicio_sesion/cuerpo_pagina/secciones/dashboard.html',
            inventario:'./html/inicio_sesion/cuerpo_pagina/secciones/inventario.html',
            productos:'./html/inicio_sesion/cuerpo_pagina/secciones/productos.html',
            ventas:'./html/inicio_sesion/cuerpo_pagina/secciones/ventas.html',
            proveedores:'./html/inicio_sesion/cuerpo_pagina/secciones/proveedores.html',
            importacion:'./html/inicio_sesion/cuerpo_pagina/secciones/importacion.html',
            alertas:'./html/inicio_sesion/cuerpo_pagina/secciones/alertas_vencimientos.html',
            analisis:'./html/inicio_sesion/cuerpo_pagina/secciones/reportes_analitica.html',
            administracion:'./html/inicio_sesion/cuerpo_pagina/secciones/usuarios.html'

        };


        const titulosVistas = {

            dashboard: 'Dashboard',
            inventario: 'Inventario',
            productos: 'Productos',
            ventas: 'Ventas',
            proveedores: 'Proveedores',
            importacion: 'Importación DimaSoft',
            alertas: 'Alertas y vencimientos',
            analisis: 'Análisis',
            administracion: 'Administración'

        };

        const rutaVista =
            rutasVistas[vista];

        if (!rutaVista) {
            return;
        }


        // carga el contenido de la vista seleccionada
        await cargarComponente(
            rutaVista,
            'contenedor_contenido'
        );


        // inicializa el funcionamiento de productos
        if (vista === 'productos') {
            cargarProductos();
            cargarFamilias();
            configurarFiltroFamilias();
            configurarBusquedaProductos();
            configurarImportacionProductos();
        }


        // inicializa el funcionamiento de usuarios
        if (vista === 'administracion') {

            inicializarUsuarios();

        }

        if (vista === 'proveedores') {

            inicializarProveedores();

        }


        // actualiza el título de la cabecera
        const tituloVistaCabecera =
            document.getElementById(
                'titulo_vista_cabecera'
            );


        if (tituloVistaCabecera) {

            tituloVistaCabecera.textContent =
                titulosVistas[vista];

        }

    }

// TITULO 5 INICIO DEL SISTEMA

    // función que decide si mostrar el sistema o mandar a inicio_sesion
    async function iniciarAplicacion() {

        const usuario = await verificarSesion();

        if (!usuario) {
            window.location.href = './html/inicio_sesion/inicio_sesion.html';
            return;
        }

        console.log('Usuario autenticado:', usuario);

        await cargarSistema();
    }

    // llama a la función principal al cargar el index
    iniciarAplicacion();

    