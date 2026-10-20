// arreglo para almacenar los proveedores obtenidos desde la base de datos
let proveedoresCargados = [];

// guarda el id del proveedor que se está editando
let idProveedorEditando = null;


// TITULO 1 FORMULARIO PROVEEDOR

    // función para mostrar el formulario de registro de un nuevo proveedor
    function abrirFormularioProveedor() {

        const contenedorFormularioProveedor =
            document.getElementById('contenedor_formulario_proveedor');

        const tituloFormularioProveedor =
            document.getElementById('titulo_formulario_proveedor');


        // indica que se creará un nuevo proveedor
        idProveedorEditando = null;


        if (tituloFormularioProveedor) {

            tituloFormularioProveedor.textContent =
                'Nuevo proveedor';

        }


        limpiarFormularioProveedor();


        if (contenedorFormularioProveedor) {

            contenedorFormularioProveedor.classList.remove(
                'contenedor_formulario_proveedor_oculto'
            );

        }

    }


    // función para ocultar el formulario de proveedor
    function cerrarFormularioProveedor() {

        const contenedorFormularioProveedor =
            document.getElementById('contenedor_formulario_proveedor');


        if (contenedorFormularioProveedor) {

            contenedorFormularioProveedor.classList.add(
                'contenedor_formulario_proveedor_oculto'
            );

        }


        idProveedorEditando = null;

    }


// TITULO 2 LIMPIEZA FORMULARIO PROVEEDOR

    // función para limpiar los campos del formulario de proveedor
    function limpiarFormularioProveedor() {

        const inputNombreProveedor =
            document.getElementById('input_nombre_proveedor');

        const inputRazonSocialProveedor =
            document.getElementById('input_razon_social_proveedor');

        const inputRutProveedor =
            document.getElementById('input_rut_proveedor');

        const inputTelefonoProveedor =
            document.getElementById('input_telefono_proveedor');

        const inputEmailProveedor =
            document.getElementById('input_email_proveedor');

        const inputDireccionProveedor =
            document.getElementById('input_direccion_proveedor');

        const inputTiempoEntregaProveedor =
            document.getElementById('input_tiempo_entrega_proveedor');


        if (inputNombreProveedor) {
            inputNombreProveedor.value = '';
        }

        if (inputRazonSocialProveedor) {
            inputRazonSocialProveedor.value = '';
        }

        if (inputRutProveedor) {
            inputRutProveedor.value = '';
        }

        if (inputTelefonoProveedor) {
            inputTelefonoProveedor.value = '';
        }

        if (inputEmailProveedor) {
            inputEmailProveedor.value = '';
        }

        if (inputDireccionProveedor) {
            inputDireccionProveedor.value = '';
        }

        if (inputTiempoEntregaProveedor) {
            inputTiempoEntregaProveedor.value = '7';
        }

    }


// TITULO 3 OBTENER PROVEEDORES

    // función para obtener todos los proveedores desde la API
    async function cargarProveedores() {

        try {

            const respuesta = await fetch(
                'http://127.0.0.1:3000/api/proveedores',
                {
                    method: 'GET',
                    credentials: 'include'
                }
            );


            const resultado = await respuesta.json();


            if (!respuesta.ok) {

                console.error(
                    'Error al obtener proveedores:',
                    resultado
                );

                return;

            }


            proveedoresCargados =
                Array.isArray(resultado)
                    ? resultado
                    : [];


            mostrarProveedores(
                proveedoresCargados
            );





        } catch (error) {

            console.error(
                'Error de conexión al obtener proveedores:',
                error
            );

        }

    }


// TITULO 4 MOSTRAR PROVEEDORES

    // función para mostrar los proveedores en la tabla
    function mostrarProveedores(proveedores) {

        const cuerpoTabla =
            document.getElementById(
                'cuerpo_tabla_proveedores'
            );


        if (!cuerpoTabla) {
            return;
        }


        cuerpoTabla.innerHTML = '';


        // verifica si existen proveedores
        if (!proveedores.length) {

            const fila =
                document.createElement('tr');

            fila.className =
                'fila_sin_proveedores';


            const dato =
                document.createElement('td');

            dato.className =
                'dato_sin_proveedores';

            dato.colSpan = 8;

            dato.textContent =
                'No hay proveedores cargados para mostrar.';


            fila.appendChild(dato);

            cuerpoTabla.appendChild(fila);

            return;

        }


        // recorre los proveedores
        proveedores.forEach(
            proveedor => {

                const fila =
                    document.createElement('tr');

                fila.className =
                    'fila_proveedor';


                // nombre comercial
                const datoNombre =
                    document.createElement('td');

                datoNombre.className =
                    'dato_nombre_proveedores';

                datoNombre.textContent =
                    proveedor.nombre_comercial || '-';


                // razón social
                const datoRazonSocial =
                    document.createElement('td');

                datoRazonSocial.className =
                    'dato_razon_social_proveedores';

                datoRazonSocial.textContent =
                    proveedor.razon_social || '-';


                // RUT
                const datoRut =
                    document.createElement('td');

                datoRut.className =
                    'dato_rut_proveedores';

                datoRut.textContent =
                    proveedor.rut || '-';


                // teléfono
                const datoTelefono =
                    document.createElement('td');

                datoTelefono.className =
                    'dato_telefono_proveedores';

                datoTelefono.textContent =
                    proveedor.telefono || '-';


                // email
                const datoEmail =
                    document.createElement('td');

                datoEmail.className =
                    'dato_email_proveedores';

                datoEmail.textContent =
                    proveedor.email || '-';


                // dirección
                const datoDireccion =
                    document.createElement('td');

                datoDireccion.className =
                    'dato_direccion_proveedores';

                datoDireccion.textContent =
                    proveedor.direccion || '-';


                // tiempo de entrega
                const datoTiempoEntrega =
                    document.createElement('td');

                datoTiempoEntrega.className =
                    'dato_tiempo_entrega_proveedores';

                datoTiempoEntrega.textContent =
                    proveedor.tiempo_entrega_dias == null
                        ? 'Sin configurar'
                        : `${proveedor.tiempo_entrega_dias} días`;


                // acciones
                const datoAcciones =
                    document.createElement('td');

                datoAcciones.className =
                    'dato_acciones_proveedores';


                // contenedor para mostrar las acciones en una fila
                const contenedorAcciones =
                    document.createElement('div');

                contenedorAcciones.className =
                    'contenedor_acciones_proveedores';


                // opción editar, con el mismo icono de productos
                const botonEditar =
                    document.createElement('button');

                botonEditar.type = 'button';
                botonEditar.className =
                    'boton_editar_proveedor';
                botonEditar.title = 'Editar proveedor';
                botonEditar.setAttribute(
                    'aria-label',
                    'Editar proveedor'
                );

                botonEditar.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2"
                        stroke-linecap="round" stroke-linejoin="round"
                        aria-hidden="true">
                        <path d="M12 20h9"/>
                        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L9 17l-4 1 1-4Z"/>
                    </svg>
                `;

                botonEditar.addEventListener(
                    'click',
                    () => {
                        editarProveedor(
                            proveedor.id_proveedor
                        );
                    }
                );


                // opción eliminar, con el mismo icono de productos
                const botonEliminar =
                    document.createElement('button');

                botonEliminar.type = 'button';
                botonEliminar.className =
                    'boton_eliminar_proveedor';
                botonEliminar.title = 'Eliminar proveedor';
                botonEliminar.setAttribute(
                    'aria-label',
                    'Eliminar proveedor'
                );

                botonEliminar.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2"
                        stroke-linecap="round" stroke-linejoin="round"
                        aria-hidden="true">
                        <path d="M3 6h18"/>
                        <path d="M8 6V4h8v2"/>
                        <path d="M5 6l1 14h12l1-14"/>
                        <path d="M10 10v7"/>
                        <path d="M14 10v7"/>
                    </svg>
                `;

                botonEliminar.addEventListener(
                    'click',
                    () => {
                        eliminarProveedor(
                            proveedor.id_proveedor
                        );
                    }
                );


                contenedorAcciones.appendChild(
                    botonEditar
                );

                contenedorAcciones.appendChild(
                    botonEliminar
                );

                datoAcciones.appendChild(
                    contenedorAcciones
                );


                fila.appendChild(
                    datoNombre
                );

                fila.appendChild(
                    datoRazonSocial
                );

                fila.appendChild(
                    datoRut
                );

                fila.appendChild(
                    datoTelefono
                );

                fila.appendChild(
                    datoEmail
                );

                fila.appendChild(
                    datoDireccion
                );

                fila.appendChild(
                    datoTiempoEntrega
                );

                fila.appendChild(
                    datoAcciones
                );


                cuerpoTabla.appendChild(
                    fila
                );

            }
        );

    }


// TITULO 5 INDICADORES PROVEEDORES

    // función para obtener los indicadores de abastecimiento
    async function cargarResumenProveedores() {

        try {

            const respuesta = await fetch(
                'http://127.0.0.1:3000/api/proveedores/resumen',
                {
                    method: 'GET',
                    credentials: 'include'
                }
            );

            const resumen = await respuesta.json();

            if (!respuesta.ok) {

                console.error(
                    'Error al obtener indicadores de proveedores:',
                    resumen
                );

                return;

            }


            const totalProveedores =
                document.getElementById('valor_total_proveedores');

            const valorMasProductos =
                document.getElementById('valor_proveedor_mas_productos');

            const nombreMasProductos =
                document.getElementById('nombre_proveedor_mas_productos');

            const valorIncompletos =
                document.getElementById('valor_proveedores_incompletos');

            const valorSinStock =
                document.getElementById('valor_proveedores_sin_stock');


            if (totalProveedores) {
                totalProveedores.textContent =
                    Number(resumen.total_proveedores || 0).toLocaleString('es-CL');
            }

            if (valorMasProductos) {
                valorMasProductos.textContent =
                    Number(resumen.cantidad_productos_proveedor || 0)
                        .toLocaleString('es-CL');
            }

            if (nombreMasProductos) {
                nombreMasProductos.textContent =
                    resumen.nombre_proveedor_mas_productos ||
                    'Sin productos asociados';
            }

            if (valorIncompletos) {
                valorIncompletos.textContent =
                    Number(resumen.proveedores_info_incompleta || 0)
                        .toLocaleString('es-CL');
            }

            if (valorSinStock) {
                valorSinStock.textContent =
                    Number(resumen.proveedores_con_productos_sin_stock || 0)
                        .toLocaleString('es-CL');
            }

        } catch (error) {

            console.error(
                'Error de conexión al obtener indicadores de proveedores:',
                error
            );

        }

    }


// TITULO 6 BUSQUEDA PROVEEDORES

    // función para configurar el buscador
    function configurarBusquedaProveedores() {

        const inputBusqueda =
            document.getElementById(
                'input_busqueda_proveedores'
            );


        if (!inputBusqueda) {
            return;
        }


        inputBusqueda.addEventListener(
            'input',
            filtrarProveedores
        );

    }


    // función para filtrar los proveedores
    function filtrarProveedores() {

        const inputBusqueda =
            document.getElementById(
                'input_busqueda_proveedores'
            );


        if (!inputBusqueda) {
            return;
        }


        const textoBusqueda =
            inputBusqueda.value
                .trim()
                .toLowerCase();


        const proveedoresFiltrados =
            proveedoresCargados.filter(
                proveedor => {

                    const nombre =
                        (
                            proveedor.nombre_comercial ||
                            ''
                        ).toLowerCase();

                    const razonSocial =
                        (
                            proveedor.razon_social ||
                            ''
                        ).toLowerCase();

                    const rut =
                        (
                            proveedor.rut ||
                            ''
                        ).toLowerCase();

                    const telefono =
                        (
                            proveedor.telefono ||
                            ''
                        ).toLowerCase();

                    const email =
                        (
                            proveedor.email ||
                            ''
                        ).toLowerCase();

                    const direccion =
                        (
                            proveedor.direccion ||
                            ''
                        ).toLowerCase();


                    return (
                        nombre.includes(textoBusqueda) ||
                        razonSocial.includes(textoBusqueda) ||
                        rut.includes(textoBusqueda) ||
                        telefono.includes(textoBusqueda) ||
                        email.includes(textoBusqueda) ||
                        direccion.includes(textoBusqueda)
                    );

                }
            );


        mostrarProveedores(
            proveedoresFiltrados
        );

    }


// TITULO 7 GUARDAR PROVEEDOR

    // función para crear o actualizar un proveedor
    async function guardarProveedor() {

        const inputNombre =
            document.getElementById(
                'input_nombre_proveedor'
            );

        const inputRazonSocial =
            document.getElementById(
                'input_razon_social_proveedor'
            );

        const inputRut =
            document.getElementById(
                'input_rut_proveedor'
            );

        const inputTelefono =
            document.getElementById(
                'input_telefono_proveedor'
            );

        const inputEmail =
            document.getElementById(
                'input_email_proveedor'
            );

        const inputDireccion =
            document.getElementById(
                'input_direccion_proveedor'
            );

        const inputTiempoEntrega =
            document.getElementById(
                'input_tiempo_entrega_proveedor'
            );


        const nombreComercial =
            inputNombre.value.trim();

        const razonSocial =
            inputRazonSocial.value.trim();

        const rut =
            inputRut.value.trim();

        const telefono =
            inputTelefono.value.trim();

        const email =
            inputEmail.value.trim();

        const direccion =
            inputDireccion.value.trim();

        const tiempoEntregaTexto =
            inputTiempoEntrega.value.trim();

        const tiempoEntregaDias =
            Number(tiempoEntregaTexto);


        // valida nombre comercial
        if (!nombreComercial) {

            alert(
                'Debe ingresar el nombre comercial del proveedor.'
            );

            return;

        }


        // valida los días de entrega
        if (
            tiempoEntregaTexto === '' ||
            !Number.isInteger(tiempoEntregaDias) ||
            tiempoEntregaDias < 7
        ) {

            alert(
                'El tiempo de entrega debe ser un número entero de al menos 7 días.'
            );

            return;

        }


        const datosProveedor = {

            nombre_comercial:
                nombreComercial,

            razon_social:
                razonSocial || null,

            rut:
                rut || null,

            telefono:
                telefono || null,

            email:
                email || null,

            direccion:
                direccion || null,

            tiempo_entrega_dias:
                tiempoEntregaDias

        };


        try {

            let url =
                'http://127.0.0.1:3000/api/proveedores';

            let metodo =
                'POST';


            // si existe un id se actualiza
            if (idProveedorEditando !== null) {

                url =
                    `http://127.0.0.1:3000/api/proveedores/${idProveedorEditando}`;

                metodo =
                    'PUT';

            }


            const respuesta = await fetch(
                url,
                {
                    method: metodo,

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    credentials: 'include',

                    body: JSON.stringify(
                        datosProveedor
                    )
                }
            );


            const resultado =
                await respuesta.json();


            if (!respuesta.ok) {

                alert(
                    resultado.mensaje ||
                    'No se pudo guardar el proveedor.'
                );

                return;

            }


            cerrarFormularioProveedor();


            await Promise.all([
                cargarProveedores(),
                cargarResumenProveedores()
            ]);


        } catch (error) {

            console.error(
                'Error al guardar proveedor:',
                error
            );


            alert(
                'No se pudo conectar con el servidor.'
            );

        }

    }


// TITULO 8 EDITAR PROVEEDOR

    // función para cargar un proveedor en el formulario
    function editarProveedor(
        idProveedor
    ) {

        const proveedor =
            proveedoresCargados.find(
                proveedor =>
                    Number(
                        proveedor.id_proveedor
                    ) ===
                    Number(
                        idProveedor
                    )
            );


        if (!proveedor) {
            return;
        }


        idProveedorEditando =
            proveedor.id_proveedor;


        const titulo =
            document.getElementById(
                'titulo_formulario_proveedor'
            );


        if (titulo) {

            titulo.textContent =
                'Editar proveedor';

        }


        document.getElementById(
            'input_nombre_proveedor'
        ).value =
            proveedor.nombre_comercial || '';


        document.getElementById(
            'input_razon_social_proveedor'
        ).value =
            proveedor.razon_social || '';


        document.getElementById(
            'input_rut_proveedor'
        ).value =
            proveedor.rut || '';


        document.getElementById(
            'input_telefono_proveedor'
        ).value =
            proveedor.telefono || '';


        document.getElementById(
            'input_email_proveedor'
        ).value =
            proveedor.email || '';


        document.getElementById(
            'input_direccion_proveedor'
        ).value =
            proveedor.direccion || '';


        document.getElementById(
            'input_tiempo_entrega_proveedor'
        ).value =
            proveedor.tiempo_entrega_dias ?? 7;


        const contenedorFormulario =
            document.getElementById(
                'contenedor_formulario_proveedor'
            );


        if (contenedorFormulario) {

            contenedorFormulario.classList.remove(
                'contenedor_formulario_proveedor_oculto'
            );

        }

    }


// TITULO 9 ELIMINAR PROVEEDOR

    // función para eliminar un proveedor
    async function eliminarProveedor(
        idProveedor
    ) {

        const confirmar =
            confirm(
                '¿Desea eliminar este proveedor?'
            );


        if (!confirmar) {
            return;
        }


        try {

            const respuesta =
                await fetch(
                    `http://127.0.0.1:3000/api/proveedores/${idProveedor}`,
                    {
                        method: 'DELETE',
                        credentials: 'include'
                    }
                );


            const resultado =
                await respuesta.json();


            if (!respuesta.ok) {

                alert(
                    resultado.mensaje ||
                    'No se pudo eliminar el proveedor.'
                );

                return;

            }


            await Promise.all([
                cargarProveedores(),
                cargarResumenProveedores()
            ]);


        } catch (error) {

            console.error(
                'Error al eliminar proveedor:',
                error
            );


            alert(
                'No se pudo conectar con el servidor.'
            );

        }

    }


// TITULO 10 INICIALIZAR PROVEEDORES

    // función para inicializar la vista de proveedores
    async function inicializarProveedores() {

        configurarBusquedaProveedores();


        const botonGuardar =
            document.getElementById(
                'boton_guardar_proveedor'
            );


        if (botonGuardar) {

            botonGuardar.addEventListener(
                'click',
                guardarProveedor
            );

        }


        await Promise.all([
                cargarProveedores(),
                cargarResumenProveedores()
            ]);

    }