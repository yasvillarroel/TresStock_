// TITULO 1 SELECCION DE OPCIONES DEL MENU LATERAL

    // función para cambiar visualmente la opción activa del menú lateral
    function seleccionarOpcionMenu(opcion, cargar = true) {

        const opcionesMenu = [
            'opcion_dashboard_menu',
            'opcion_inventario_menu',
            'opcion_productos_menu',
            'opcion_ventas_menu',
            'opcion_proveedores_menu',
            'opcion_alertas_menu',
            'opcion_analisis_menu',
            'opcion_administracion_menu'
        ];

        // elimina el estado activo de todas las opciones
        opcionesMenu.forEach(function(idOpcion) {

            const elementoOpcion = document.getElementById(idOpcion);

            if (elementoOpcion) {

                elementoOpcion.classList.remove(
                    'opcion_menu_activa'
                );

            }

        });

        // obtiene la opción actual
        const opcionSeleccionada = document.getElementById(
            'opcion_' + opcion + '_menu'
        );

        // agrega el estado activo (el escaner no se marca para no alterar sus estilos)
        if (opcionSeleccionada && opcion !== 'escaner') {

            opcionSeleccionada.classList.add(
                'opcion_menu_activa'
            );

        }

        // carga la vista correspondiente
        if (cargar && typeof cargarVista === 'function') {

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
    function inicializarMenuLateral(vistaActual) {

        const opcionesMenu = {
            opcion_dashboard_menu: 'dashboard',
            opcion_inventario_menu: 'inventario',
            opcion_productos_menu: 'productos',
            opcion_ventas_menu: 'ventas',
            opcion_proveedores_menu: 'proveedores',
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


        // el escaner usa el boton interno para no alterar los estilos del contenedor
        const botonEscanear = document.getElementById(
            'boton_escanear_producto'
        );

        if (botonEscanear) {

            botonEscanear.addEventListener(
                'click',
                function () {

                    seleccionarOpcionMenu('escaner');

                }
            );

        }


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

        // marca la vista actual en el menu
        if (vistaActual) {

            seleccionarOpcionMenu(vistaActual, false);

        }

    }