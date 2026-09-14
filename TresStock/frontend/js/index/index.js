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

        await cargarVista('dashboard');

    }


// TITULO 3 CARGA DE VISTAS

    // función para cargar la vista seleccionada desde el menú lateral
    async function cargarVista(vista) {

        const rutasVistas = {
            dashboard: './html/dashboard/dashboard.html',
            inventario: './html/inventario/inventario.html',
            productos: './html/productos/productos.html',
            ventas: './html/ventas/ventas.html',
            proveedores: './html/proveedores/proveedores.html',
            importacion: './html/importacion/importacion.html',
            alertas: './html/alertas_vencimientos/alertas_vencimientos.html',
            analisis: './html/reportes_analitica/reportes_analitica.html',
            administracion: './html/usuarios/usuarios.html'
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

        const rutaVista = rutasVistas[vista];

        if (!rutaVista) {
            return;
        }

        await cargarComponente(
            rutaVista,
            'contenedor_contenido'
        );

        const tituloVistaCabecera = document.getElementById('titulo_vista_cabecera');

        if (tituloVistaCabecera) {
            tituloVistaCabecera.textContent = titulosVistas[vista];
        }

    }


// TITULO 4 INICIO DEL SISTEMA

    // llama a la función principal al cargar el index
    cargarSistema();