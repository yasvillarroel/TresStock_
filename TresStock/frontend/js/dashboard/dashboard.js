// TITULO 1 CARGA DE COMPONENTES PRINCIPALES

    // función para cargar un archivo HTML dentro de un contenedor
    async function cargarComponente(ruta, idContenedor) {

        const respuesta = await fetch(ruta);

        const contenido = await respuesta.text();

        document.getElementById(idContenedor).innerHTML = contenido;

    }

// TITULO 2 CARGA INICIAL DEL SISTEMA

    // función para cargar los componentes principales de TresStock
    async function cargarSistema() {

        await cargarComponente(
            './html/menu_lateral/menu_lateral.html',
            'contenedor_menu'
        );

        await cargarComponente(
            './html/cabecera/cabecera.html',
            'contenedor_cabecera'
        );

        await cargarComponente(
            './html/dashboard/dashboard.html',
            'contenedor_contenido'
        );

    }

// TITULO 3 INICIO DEL SISTEMA

    // llama a la función principal al cargar el index
    cargarSistema();