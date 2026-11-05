// arreglo para almacenar los proveedores obtenidos desde la base de datos
let proveedoresCargados = [];

// guarda el id del proveedor que se está editando
let idProveedorEditando = null;

// estado del formulario y controles contra solicitudes repetidas
let modoFormularioProveedor = 'nuevo';
let guardandoProveedor = false;
let cambiandoEstadoProveedor = false;

// conserva filtros y muestra por defecto los proveedores activos
const opcionesFiltrosProveedores = {
    estado: [
        { valor: 'activos', nombre: 'Activos' },
        { valor: 'inactivos', nombre: 'Inactivos' },
        { valor: 'todos', nombre: 'Todos' }
    ],
    informacion: [
        { valor: 'todos', nombre: 'Todos' },
        { valor: 'completa', nombre: 'Completa' },
        { valor: 'incompleta', nombre: 'Incompleta' }
    ]
};

// controla las ventanas centradas de información y confirmación
let resolverDialogoProveedor = null;
let focoAnteriorDialogoProveedor = null;



// TITULO 1 FORMULARIO PROVEEDOR

    // función para mostrar el formulario de registro de un nuevo proveedor
    function abrirFormularioProveedor() {

        const contenedorFormularioProveedor =
            document.getElementById('contenedor_formulario_proveedor');

        const tituloFormularioProveedor =
            document.getElementById('titulo_formulario_proveedor');


        // indica que se creará un nuevo proveedor
        idProveedorEditando = null;
        modoFormularioProveedor = 'nuevo';


        if (tituloFormularioProveedor) {

            tituloFormularioProveedor.textContent =
                'Nuevo proveedor';

        }


        limpiarFormularioProveedor();
        configurarModoFormularioProveedor();


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

            const respuesta = await fetchConCsrf(
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


            // conserva los filtros seleccionados tras crear, editar o cambiar estado
            filtrarProveedores();





        } catch (error) {

            console.error(
                'Error de conexión al obtener proveedores:',
                error
            );

        }

    }


// TITULO 4 MOSTRAR PROVEEDORES

    // función para mostrar los proveedores sin insertar datos externos como HTML
    function mostrarProveedores(proveedores) {
        const cuerpoTabla = document.getElementById('cuerpo_tabla_proveedores');
        if (!cuerpoTabla) return;

        cuerpoTabla.replaceChildren();

        // muestra mensaje cuando no existen resultados del filtrado
        if (!proveedores.length) {
            const fila = document.createElement('tr');
            fila.className = 'fila_sin_proveedores';
            const celda = document.createElement('td');
            celda.className = 'dato_sin_proveedores';
            celda.colSpan = 9;
            celda.textContent = proveedoresCargados.length
                ? 'No se encontraron proveedores con los filtros seleccionados.'
                : 'No hay proveedores cargados para mostrar.';
            fila.appendChild(celda);
            cuerpoTabla.appendChild(fila);
            return;
        }

        // iconos en el mismo estilo de las acciones de Productos
        const iconoVer = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/>
            <circle cx="12" cy="12" r="3"/></svg>`;
        const iconoEditar = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L9 17l-4 1 1-4Z"/></svg>`;
        const iconoDesactivar = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="9"/><path d="M5.6 5.6 18.4 18.4"/></svg>`;
        const iconoActivar = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="9"/><path d="m7.5 12 3.2 3.2 6-6.4"/></svg>`;

        proveedores.forEach(function(proveedor) {
            const activo = proveedor.activo !== false;
            const fila = document.createElement('tr');
            fila.className = activo ? 'fila_proveedor' : 'fila_proveedor fila_proveedor_inactivo';

            // genera celdas usando textContent para evitar código HTML inyectado
            function agregarDato(valor, clase) {
                const celda = document.createElement('td');
                celda.className = clase;
                celda.textContent = valor == null || valor === '' ? '-' : String(valor);
                celda.title = celda.textContent;
                fila.appendChild(celda);
            }

            agregarDato(proveedor.nombre_comercial, 'dato_nombre_proveedores');
            agregarDato(proveedor.razon_social, 'dato_razon_social_proveedores');
            agregarDato(proveedor.rut, 'dato_rut_proveedores');
            agregarDato(proveedor.telefono, 'dato_telefono_proveedores');
            agregarDato(proveedor.email, 'dato_email_proveedores');
            agregarDato(proveedor.direccion, 'dato_direccion_proveedores');
            agregarDato(proveedor.tiempo_entrega_dias == null
                ? 'Sin configurar'
                : proveedor.tiempo_entrega_dias + ' días', 'dato_tiempo_entrega_proveedores');

            // estado independiente, igual que en la tabla de Productos
            const datoEstado = document.createElement('td');
            datoEstado.className = 'dato_estado_proveedores';
            const etiquetaEstado = document.createElement('span');
            etiquetaEstado.className = 'etiqueta_estado_proveedor ' +
                (activo ? 'etiqueta_proveedor_activo' : 'etiqueta_proveedor_inactivo');
            etiquetaEstado.textContent = activo ? 'Activo' : 'Inactivo';
            datoEstado.appendChild(etiquetaEstado);
            fila.appendChild(datoEstado);

            // botones para consultar, editar y activar/desactivar
            const datoAcciones = document.createElement('td');
            datoAcciones.className = 'dato_acciones_proveedores';
            const acciones = document.createElement('div');
            acciones.className = 'contenedor_acciones_proveedores';

            function agregarAccion(clase, titulo, icono, callback) {
                const boton = document.createElement('button');
                boton.type = 'button';
                boton.className = clase;
                boton.title = titulo;
                boton.setAttribute('aria-label', titulo);
                boton.innerHTML = icono;
                boton.addEventListener('click', callback);
                acciones.appendChild(boton);
            }

            agregarAccion('boton_ver_proveedor', 'Ver proveedor', iconoVer,
                () => verProveedor(proveedor.id_proveedor));
            agregarAccion('boton_editar_proveedor', 'Editar proveedor', iconoEditar,
                () => editarProveedor(proveedor.id_proveedor));
            agregarAccion(activo ? 'boton_desactivar_proveedor' : 'boton_activar_proveedor',
                activo ? 'Desactivar proveedor' : 'Activar proveedor',
                activo ? iconoDesactivar : iconoActivar,
                () => cambiarEstadoProveedor(proveedor.id_proveedor));

            datoAcciones.appendChild(acciones);
            fila.appendChild(datoAcciones);
            cuerpoTabla.appendChild(fila);
        });
    }


// TITULO 5 INDICADORES PROVEEDORES

    // función para obtener los indicadores de abastecimiento
    async function cargarResumenProveedores() {

        try {

            const respuesta = await fetchConCsrf(
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


// TITULO 6 FILTROS PERSONALIZADOS DE PROVEEDORES

    // permite buscar sin distinguir tildes, mayúsculas ni guiones
    function normalizarTextoFiltroProveedor(valor) {
        return String(valor ?? '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, ' ')
            .trim()
            .replace(/\s+/g, ' ');
    }

    // considera los mismos campos que el indicador Información incompleta
    function tieneInformacionCompletaProveedor(proveedor) {
        return Boolean(
            String(proveedor.rut ?? '').trim() &&
            String(proveedor.direccion ?? '').trim() &&
            (String(proveedor.telefono ?? '').trim() || String(proveedor.email ?? '').trim())
        );
    }

    // obtiene los elementos del filtro Estado o Información
    function elementosFiltroProveedor(tipo) {
        return {
            campo: document.getElementById('select_' + tipo + '_proveedores'),
            boton: document.getElementById('boton_filtro_' + tipo + '_proveedores'),
            panel: document.getElementById('panel_filtro_' + tipo + '_proveedores'),
            texto: document.getElementById('texto_filtro_' + tipo + '_proveedores'),
            lista: document.getElementById('lista_filtro_' + tipo + '_proveedores')
        };
    }

    // cierra los desplegables sin modificar la opción elegida
    function cerrarFiltrosProveedores(excepto = '') {
        ['estado', 'informacion'].forEach(function(tipo) {
            if (tipo === excepto) return;
            const elementos = elementosFiltroProveedor(tipo);
            if (elementos.panel) elementos.panel.hidden = true;
            if (elementos.boton) elementos.boton.setAttribute('aria-expanded', 'false');
        });
    }

    // construye las opciones y destaca la seleccionada en turquesa
    function actualizarSelectorProveedor(tipo) {
        const elementos = elementosFiltroProveedor(tipo);
        if (!elementos.campo || !elementos.lista || !elementos.texto) return;

        const seleccion = opcionesFiltrosProveedores[tipo].find(op => op.valor === elementos.campo.value);
        elementos.texto.textContent = seleccion?.nombre || 'Todos';
        elementos.lista.replaceChildren();

        opcionesFiltrosProveedores[tipo].forEach(function(opcion) {
            const boton = document.createElement('button');
            boton.type = 'button';
            boton.className = 'opcion_selector_proveedores';
            boton.textContent = opcion.nombre;
            boton.setAttribute('role', 'option');
            boton.setAttribute('aria-selected', String(opcion.valor === elementos.campo.value));
            boton.addEventListener('click', function() {
                elementos.campo.value = opcion.valor;
                cerrarFiltrosProveedores();
                actualizarSelectorProveedor(tipo);
                filtrarProveedores();
                elementos.boton.focus();
            });
            elementos.lista.appendChild(boton);
        });
    }

    // mantiene el mismo comportamiento de desplegables que Productos
    function configurarFiltrosProveedores() {
        const input = document.getElementById('input_busqueda_proveedores');
        if (input) input.addEventListener('input', filtrarProveedores);

        ['estado', 'informacion'].forEach(function(tipo) {
            const elementos = elementosFiltroProveedor(tipo);
            if (!elementos.boton || !elementos.panel || !elementos.lista) return;
            actualizarSelectorProveedor(tipo);

            elementos.boton.addEventListener('click', function() {
                const estabaCerrado = elementos.panel.hidden;
                cerrarFiltrosProveedores();
                elementos.panel.hidden = !estabaCerrado;
                elementos.boton.setAttribute('aria-expanded', String(estabaCerrado));
            });

            elementos.boton.addEventListener('keydown', function(evento) {
                if (evento.key === 'ArrowDown' || evento.key === 'ArrowUp') {
                    evento.preventDefault();
                    cerrarFiltrosProveedores();
                    elementos.panel.hidden = false;
                    elementos.boton.setAttribute('aria-expanded', 'true');
                    elementos.lista.querySelector('[aria-selected="true"]')?.focus();
                }
            });

            elementos.lista.addEventListener('keydown', function(evento) {
                const opciones = Array.from(elementos.lista.querySelectorAll('button'));
                const indice = opciones.indexOf(document.activeElement);
                if (evento.key === 'Escape') {
                    cerrarFiltrosProveedores();
                    elementos.boton.focus();
                } else if (evento.key === 'ArrowDown' || evento.key === 'ArrowUp') {
                    evento.preventDefault();
                    const siguiente = evento.key === 'ArrowDown' ? indice + 1 : indice - 1;
                    opciones[Math.max(0, Math.min(siguiente, opciones.length - 1))]?.focus();
                }
            });
        });

        const limpiar = document.getElementById('boton_limpiar_filtros_proveedores');
        if (limpiar) limpiar.addEventListener('click', limpiarFiltrosProveedores);

        // se asigna una vez; funciona con el HTML de cada vista cargada
        if (!window.__cierreFiltrosProveedoresConfigurado) {
            document.addEventListener('pointerdown', function(evento) {
                if (!evento.target.closest?.('.campo_filtro_proveedores')) cerrarFiltrosProveedores();
            });
            window.__cierreFiltrosProveedoresConfigurado = true;
        }
    }

    // restablece los filtros sin cambiar otras vistas
    function limpiarFiltrosProveedores() {
        const input = document.getElementById('input_busqueda_proveedores');
        const estado = document.getElementById('select_estado_proveedores');
        const informacion = document.getElementById('select_informacion_proveedores');
        if (input) input.value = '';
        if (estado) estado.value = 'activos';
        if (informacion) informacion.value = 'todos';
        cerrarFiltrosProveedores();
        actualizarSelectorProveedor('estado');
        actualizarSelectorProveedor('informacion');
        filtrarProveedores();
    }

    // combina la búsqueda, el estado y la información del proveedor
    function filtrarProveedores() {
        const entrada = document.getElementById('input_busqueda_proveedores');
        const estado = document.getElementById('select_estado_proveedores');
        const informacion = document.getElementById('select_informacion_proveedores');
        if (!entrada || !estado || !informacion) return;

        const busqueda = normalizarTextoFiltroProveedor(entrada.value);
        const compacta = busqueda.replace(/\s+/g, '');
        const resultado = proveedoresCargados.filter(function(proveedor) {
            const campos = [proveedor.nombre_comercial, proveedor.razon_social,
                proveedor.rut, proveedor.telefono, proveedor.email, proveedor.direccion];
            const coincideBusqueda = !busqueda || campos.some(function(campo) {
                const normalizado = normalizarTextoFiltroProveedor(campo);
                return normalizado.includes(busqueda) ||
                    normalizado.replace(/\s+/g, '').includes(compacta);
            });

            const activo = proveedor.activo !== false;
            const coincideEstado = estado.value === 'todos' ||
                (estado.value === 'activos' && activo) ||
                (estado.value === 'inactivos' && !activo);

            const completa = tieneInformacionCompletaProveedor(proveedor);
            const coincideInformacion = informacion.value === 'todos' ||
                (informacion.value === 'completa' && completa) ||
                (informacion.value === 'incompleta' && !completa);

            return coincideBusqueda && coincideEstado && coincideInformacion;
        });

        mostrarProveedores(resultado);
    }


// TITULO 7 GUARDAR PROVEEDOR

    // función para crear o actualizar un proveedor
    async function guardarProveedor() {

        if (guardandoProveedor || modoFormularioProveedor === 'ver') return;

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

            await mostrarMensajeProveedor('Datos incompletos',
                'Debe ingresar el nombre comercial del proveedor.', 'advertencia');

            return;

        }


        // valida los días de entrega
        if (
            tiempoEntregaTexto === '' ||
            !Number.isInteger(tiempoEntregaDias) ||
            tiempoEntregaDias < 7
        ) {

            await mostrarMensajeProveedor('Tiempo de entrega inválido',
                'El tiempo de entrega debe ser un número entero de al menos 7 días.', 'advertencia');

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


        guardandoProveedor = true;

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


            const respuesta = await fetchConCsrf(
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

                await mostrarMensajeProveedor('No se pudo guardar',
                    resultado.mensaje || 'No se pudo guardar el proveedor.', 'error');

                return;

            }


            const fueEdicion = idProveedorEditando !== null;
            cerrarFormularioProveedor();

            await Promise.all([
                cargarProveedores(),
                cargarResumenProveedores()
            ]);

            await mostrarMensajeProveedor(
                fueEdicion ? 'Proveedor actualizado' : 'Proveedor creado',
                fueEdicion ? 'Los cambios se guardaron correctamente.' : 'El proveedor se registró correctamente.',
                'correcto'
            );

        } catch (error) {

            console.error(
                'Error al guardar proveedor:',
                error
            );


            await mostrarMensajeProveedor('Error de conexión',
                'No se pudo conectar con el servidor.', 'error');

        } finally {
            guardandoProveedor = false;
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


        idProveedorEditando = proveedor.id_proveedor;
        modoFormularioProveedor = 'editar';


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


        configurarModoFormularioProveedor();

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


// TITULO 9 ACTIVAR Y DESACTIVAR PROVEEDORES

    // mantiene al proveedor y sus relaciones con productos en PostgreSQL
    async function cambiarEstadoProveedor(idProveedor) {
        if (cambiandoEstadoProveedor) return;

        const proveedor = proveedoresCargados.find(p =>
            Number(p.id_proveedor) === Number(idProveedor)
        );
        if (!proveedor) return;

        const estaActivo = proveedor.activo !== false;
        const nuevoEstado = !estaActivo;
        const accion = nuevoEstado ? 'activar' : 'desactivar';

        const confirmado = await confirmarAccionProveedor(
            nuevoEstado ? 'Activar proveedor' : 'Desactivar proveedor',
            '¿Estás seguro de ' + accion + ' a ' + proveedor.nombre_comercial + '?\n\n' +
            'El proveedor y sus asociaciones con productos se conservarán.',
            nuevoEstado ? 'Activar' : 'Desactivar'
        );
        if (!confirmado) return;

        cambiandoEstadoProveedor = true;
        try {
            const respuesta = await fetchConCsrf(
                'http://127.0.0.1:3000/api/proveedores/' +
                    encodeURIComponent(idProveedor) + '/estado', {
                    method: 'PATCH',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ activo: nuevoEstado })
                }
            );

            const resultado = await respuesta.json();
            if (!respuesta.ok) throw new Error(resultado.mensaje || 'No se pudo cambiar el estado.');

            await Promise.all([cargarProveedores(), cargarResumenProveedores()]);
            await mostrarMensajeProveedor(
                nuevoEstado ? 'Proveedor activado' : 'Proveedor desactivado',
                'El estado del proveedor se actualizó correctamente.', 'correcto'
            );
        } catch (error) {
            await mostrarMensajeProveedor('No se pudo completar la operación',
                error.message || 'Ocurrió un error inesperado.', 'error');
        } finally {
            cambiandoEstadoProveedor = false;
        }
    }


// TITULO 10 CONSULTAR PROVEEDOR

    // permite ver todos los datos del proveedor sin modificarlos
    function verProveedor(idProveedor) {
        editarProveedor(idProveedor);
        modoFormularioProveedor = 'ver';
        configurarModoFormularioProveedor();
    }

    // alterna el modal entre Nuevo, Editar y Ver, sin cambiar el HTML del formulario
    function configurarModoFormularioProveedor() {
        const soloLectura = modoFormularioProveedor === 'ver';
        const campos = [
            'input_nombre_proveedor', 'input_razon_social_proveedor',
            'input_rut_proveedor', 'input_telefono_proveedor',
            'input_email_proveedor', 'input_direccion_proveedor',
            'input_tiempo_entrega_proveedor'
        ];

        campos.forEach(function(id) {
            const campo = document.getElementById(id);
            if (campo) campo.disabled = soloLectura;
        });

        const titulo = document.getElementById('titulo_formulario_proveedor');
        const guardar = document.getElementById('boton_guardar_proveedor');
        const cancelar = document.getElementById('boton_cancelar_proveedor');

        if (titulo) titulo.textContent = soloLectura ? 'Detalle del proveedor' :
            (modoFormularioProveedor === 'editar' ? 'Editar proveedor' : 'Nuevo proveedor');
        if (guardar) {
            guardar.hidden = soloLectura;
            guardar.textContent = modoFormularioProveedor === 'editar'
                ? 'Guardar cambios' : 'Guardar proveedor';
        }
        if (cancelar) cancelar.textContent = soloLectura ? 'Cerrar' : 'Cancelar';
    }


// TITULO 11 MODAL DE MENSAJES Y CONFIRMACIONES

    // controla la confirmación sin usar alert() ni confirm() del navegador
    function configurarDialogoProveedores() {
        const fondo = document.getElementById('contenedor_alerta_proveedores');
        const aceptar = document.getElementById('boton_aceptar_alerta_proveedores');
        const cancelar = document.getElementById('boton_cancelar_alerta_proveedores');
        if (!fondo || !aceptar || !cancelar || fondo.dataset.configurado === 'si') return;
        fondo.dataset.configurado = 'si';

        aceptar.addEventListener('click', () => cerrarDialogoProveedor(true));
        cancelar.addEventListener('click', () => cerrarDialogoProveedor(false));
        fondo.addEventListener('click', function(evento) {
            if (evento.target === fondo) cerrarDialogoProveedor(false);
        });
        fondo.addEventListener('keydown', function(evento) {
            if (evento.key === 'Escape') {
                evento.preventDefault();
                cerrarDialogoProveedor(false);
            } else if (evento.key === 'Tab') {
                const botones = [cancelar, aceptar].filter(b => !b.hidden);
                const primero = botones[0];
                const ultimo = botones[botones.length - 1];
                if (evento.shiftKey && document.activeElement === primero) {
                    evento.preventDefault();
                    ultimo.focus();
                } else if (!evento.shiftKey && document.activeElement === ultimo) {
                    evento.preventDefault();
                    primero.focus();
                }
            }
        });
    }

    function abrirDialogoProveedor(titulo, mensaje, tipo = 'informacion', confirmar = false, textoAceptar = 'Aceptar') {
        const fondo = document.getElementById('contenedor_alerta_proveedores');
        const ventana = fondo?.querySelector('.modal_alerta_proveedores');
        const tituloElemento = document.getElementById('titulo_alerta_proveedores');
        const mensajeElemento = document.getElementById('mensaje_alerta_proveedores');
        const icono = document.getElementById('icono_alerta_proveedores');
        const cancelar = document.getElementById('boton_cancelar_alerta_proveedores');
        const aceptar = document.getElementById('boton_aceptar_alerta_proveedores');
        if (!fondo || !ventana || !tituloElemento || !mensajeElemento || !icono || !cancelar || !aceptar) {
            console.error('No se encontró el modal de Proveedores.');
            return Promise.resolve(false);
        }
        if (resolverDialogoProveedor) return Promise.resolve(false);

        configurarDialogoProveedores();
        tituloElemento.textContent = titulo;
        mensajeElemento.textContent = mensaje;
        ventana.dataset.tipo = tipo;
        icono.textContent = { correcto: '✓', error: '×', advertencia: '!', informacion: 'i' }[tipo] || 'i';
        cancelar.hidden = !confirmar;
        aceptar.textContent = textoAceptar;
        focoAnteriorDialogoProveedor = document.activeElement;

        return new Promise(function(resolve) {
            resolverDialogoProveedor = resolve;
            fondo.hidden = false;
            (confirmar ? cancelar : aceptar).focus();
        });
    }

    function cerrarDialogoProveedor(confirmado) {
        const fondo = document.getElementById('contenedor_alerta_proveedores');
        if (!fondo || fondo.hidden) return;
        fondo.hidden = true;
        const resolver = resolverDialogoProveedor;
        resolverDialogoProveedor = null;
        const anterior = focoAnteriorDialogoProveedor;
        focoAnteriorDialogoProveedor = null;
        if (anterior?.isConnected && typeof anterior.focus === 'function') anterior.focus();
        if (resolver) resolver(Boolean(confirmado));
    }

    function mostrarMensajeProveedor(titulo, mensaje, tipo = 'informacion') {
        return abrirDialogoProveedor(titulo, mensaje, tipo);
    }

    function confirmarAccionProveedor(titulo, mensaje, textoAceptar = 'Confirmar') {
        return abrirDialogoProveedor(titulo, mensaje, 'advertencia', true, textoAceptar);
    }


// TITULO 10 INICIALIZAR PROVEEDORES

    // función para inicializar la vista de proveedores
    async function inicializarProveedores() {

        configurarDialogoProveedores();
        configurarFiltrosProveedores();


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