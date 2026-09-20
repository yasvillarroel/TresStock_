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


        // elimina el estado activo de todas las opciones
        opcionesMenu.forEach(function(idOpcion) {

            const elementoOpcion = document.getElementById(idOpcion);

            if (elementoOpcion) {
                elementoOpcion.classList.remove('opcion_menu_activa');
            }

        });


        // obtiene la opción seleccionada
        const opcionSeleccionada = document.getElementById(
            'opcion_' + opcion + '_menu'
        );


        // agrega el estado activo a la opción seleccionada
        if (opcionSeleccionada) {

            opcionSeleccionada.classList.add(
                'opcion_menu_activa'
            );

        }


        // carga la vista correspondiente
        if (typeof cargarVista === 'function') {

            cargarVista(opcion);

        }


        // cierra el menú lateral después de seleccionar una opción
        // solamente en tablets y dispositivos móviles
        if (window.innerWidth <= 1024) {

            const menuLateral = document.getElementById(
                'contenedor_menu_lateral'
            );

            if (menuLateral) {

                menuLateral.classList.remove(
                    'contenedor_menu_lateral_abierto'
                );

            }

        }

    }


// TITULO 2 FUNCIONAMIENTO OPCIONES MENU LATERAL

    // función para activar los clics de las opciones del menú lateral
    function inicializarMenuLateral() {

        const opcionesMenu = {
            opcion_dashboard_menu: 'dashboard',
            opcion_inventario_menu: 'inventario',
            opcion_productos_menu: 'productos',
            opcion_ventas_menu: 'ventas',
            opcion_proveedores_menu: 'proveedores',
            opcion_importacion_menu: 'importacion',
            opcion_alertas_menu: 'alertas',
            opcion_analisis_menu: 'analisis',
            opcion_administracion_menu: 'administracion'
        };


        // asigna el funcionamiento a cada opción del menú
        Object.keys(opcionesMenu).forEach(function(idOpcion) {

            const elementoOpcion = document.getElementById(idOpcion);

            if (elementoOpcion) {

                elementoOpcion.addEventListener(
                    'click',
                    function () {

                        seleccionarOpcionMenu(
                            opcionesMenu[idOpcion]
                        );

                    }
                );

            }

        });


        // obtiene el botón hamburguesa de la cabecera
        const botonMenuCabecera = document.getElementById(
            'boton_menu_cabecera'
        );


        // obtiene el menú lateral
        const menuLateral = document.getElementById(
            'contenedor_menu_lateral'
        );


        // muestra u oculta el menú lateral al presionar
        // el botón hamburguesa
        if (botonMenuCabecera && menuLateral) {

            botonMenuCabecera.addEventListener(
                'click',
                function () {

                    menuLateral.classList.toggle(
                        'contenedor_menu_lateral_abierto'
                    );

                }
            );

        }

    }