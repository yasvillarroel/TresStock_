

// TITULO 1 SELECCION DE OPCIONES DEL MENU LATERAL

    // función para cambiar visualmente la opción activa del menú lateral
    function seleccionarOpcionMenu(opcion) {

        const opcionesMenu = [
            'opcion_dashboard_menu',
            'opcion_inventario_menu',
            'opcion_productos_menu',
            'opcion_ventas_menu',
            'opcion_proveedores_menu',
            'opcion_importacion_menu',
            'opcion_alertas_menu',
            'opcion_analisis_menu',
            'opcion_administracion_menu'
        ];

        opcionesMenu.forEach(function(idOpcion) {

            const elementoOpcion = document.getElementById(idOpcion);

            if (elementoOpcion) {
                elementoOpcion.classList.remove('opcion_menu_activa');
            }

        });

        const opcionSeleccionada = document.getElementById(
            'opcion_' + opcion + '_menu'
        );

        if (opcionSeleccionada) {
            opcionSeleccionada.classList.add('opcion_menu_activa');
        }

        if (typeof cargarVista === 'function') {
            cargarVista(opcion);
        }

    }