// indica a la libreria donde esta el archivo .wasm
BarcodeDetectionAPI.prepareZXingModule({
    overrides: {
        locateFile: function(ruta, prefijo) {
            if (ruta.endsWith('.wasm')) {
                return './js/bibliotecas/lector_codigos/zxing_reader.wasm';
            }

            return prefijo + ruta;
        }
    }
});


// variables para controlar el escaner
let detectorProducto = null;
let flujoCamara = null;
let escaneandoProducto = false;

// identifica cada intento de abrir la camara
let idInicioEscaner = 0;

// almacena el codigo y el producto seleccionado
let codigoProductoEscaneado = null;
let productoEscaneado = null;

// almacena el producto seleccionado para asociar el codigo
let productoSeleccionadoAsociar = null;

// identifica cada busqueda para evitar mostrar resultados antiguos
let idBusquedaProductosAsociar = 0;

// Muestra enteros sin ceros decimales y conserva los decimales que sí existen.
function formatearCantidadEscaner(valor, esBalanza = false) {
    const cantidad = Number(valor);
    if (!Number.isFinite(cantidad)) return '—';

    const cantidadFormateada = cantidad.toLocaleString('es-CL', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 4
    });

    return esBalanza ? `${cantidadFormateada} (KG)` : cantidadFormateada;
}

function obtenerFechaMinimaLoteEscaner() {
    const hoy = new Date();
    hoy.setMinutes(hoy.getMinutes() - hoy.getTimezoneOffset());
    return hoy.toISOString().slice(0, 10);
}


// TITULO 1 MODAL DE MENSAJES Y CONFIRMACIONES DEL ESCANER
// mismo diseño de los avisos personalizados de Productos
let resolverDialogoEscaner = null;
let focoAnteriorDialogoEscaner = null;

// conecta los botones del modal una sola vez
function configurarDialogoEscaner() {
    const fondo = document.getElementById('contenedor_alerta_escaner');
    const aceptar = document.getElementById('boton_aceptar_alerta_escaner');
    const cancelar = document.getElementById('boton_cancelar_alerta_escaner');

    if (!fondo || !aceptar || !cancelar || fondo.dataset.configurado === 'si') return;
    fondo.dataset.configurado = 'si';

    aceptar.addEventListener('click', () => cerrarDialogoEscaner(true));
    cancelar.addEventListener('click', () => cerrarDialogoEscaner(false));

    fondo.addEventListener('click', function(evento) {
        if (evento.target === fondo) cerrarDialogoEscaner(false);
    });

    // Escape cierra el aviso, sin cerrar también el formulario de ajuste
    fondo.addEventListener('keydown', function(evento) {
        if (evento.key === 'Escape') {
            evento.preventDefault();
            evento.stopPropagation();
            cerrarDialogoEscaner(false);
            return;
        }

        if (evento.key !== 'Tab') return;

        const botones = [cancelar, aceptar].filter(boton => !boton.hidden);
        const primero = botones[0];
        const ultimo = botones[botones.length - 1];

        if (evento.shiftKey && document.activeElement === primero) {
            evento.preventDefault();
            ultimo.focus();
        } else if (!evento.shiftKey && document.activeElement === ultimo) {
            evento.preventDefault();
            primero.focus();
        }
    });
}

// muestra un aviso centrado, con confirmación opcional
function abrirDialogoEscaner({ titulo, mensaje, tipo = 'informacion', confirmar = false,
    textoAceptar = 'Aceptar' }) {

    const fondo = document.getElementById('contenedor_alerta_escaner');
    const ventana = fondo?.querySelector('.modal_alerta_escaner');
    const tituloElemento = document.getElementById('titulo_alerta_escaner');
    const mensajeElemento = document.getElementById('mensaje_alerta_escaner');
    const icono = document.getElementById('icono_alerta_escaner');
    const cancelar = document.getElementById('boton_cancelar_alerta_escaner');
    const aceptar = document.getElementById('boton_aceptar_alerta_escaner');

    if (!fondo || !ventana || !tituloElemento || !mensajeElemento || !icono || !aceptar || !cancelar) {
        console.error('No está disponible el modal de mensajes del Escáner.');
        return Promise.resolve(false);
    }

    if (resolverDialogoEscaner) return Promise.resolve(false);

    configurarDialogoEscaner();

    const tipoValido = ['correcto', 'error', 'advertencia', 'informacion'].includes(tipo)
        ? tipo : 'informacion';

    tituloElemento.textContent = String(titulo || 'Aviso');
    mensajeElemento.textContent = String(mensaje || '');
    ventana.dataset.tipo = tipoValido;
    icono.textContent = {
        correcto: '✓', error: '×', advertencia: '!', informacion: 'i'
    }[tipoValido];

    cancelar.hidden = !confirmar;
    aceptar.textContent = textoAceptar;
    focoAnteriorDialogoEscaner = document.activeElement;

    return new Promise(function(resolve) {
        resolverDialogoEscaner = resolve;
        fondo.hidden = false;
        (confirmar ? cancelar : aceptar).focus();
    });
}

// cierra el aviso y devuelve el foco al control que lo abrió
function cerrarDialogoEscaner(aceptado) {
    const fondo = document.getElementById('contenedor_alerta_escaner');
    if (!fondo || fondo.hidden) return;

    fondo.hidden = true;
    const resolver = resolverDialogoEscaner;
    resolverDialogoEscaner = null;

    const elemento = focoAnteriorDialogoEscaner;
    focoAnteriorDialogoEscaner = null;
    if (elemento?.isConnected && typeof elemento.focus === 'function') elemento.focus();

    if (resolver) resolver(Boolean(aceptado));
}

// avisa si una operación fue correcta, falló o requiere atención
function mostrarMensajeEscaner(titulo, mensaje, tipo = 'informacion') {
    return abrirDialogoEscaner({ titulo, mensaje, tipo });
}

// solicita autorización antes de cambiar datos
function confirmarAccionEscaner(titulo, mensaje, textoAceptar = 'Confirmar') {
    return abrirDialogoEscaner({
        titulo, mensaje, tipo: 'advertencia', confirmar: true, textoAceptar
    });
}

// formatos de codigos de barras admitidos
const formatosCodigoBarras = [
    'code_128',
    'code_39',
    'ean_13',
    'ean_8',
    'upc_a',
    'upc_e'
];


// muestra una vista dentro del contenedor principal
function mostrarVistaProducto(idVista) {
    const vistas = [
        'vista_lector_producto',
        'vista_gestion_producto',
        'vista_asociar_producto'
    ];

    vistas.forEach(function(id) {
        const vista = document.getElementById(id);

        if (vista) {
            vista.hidden = id !== idVista;
        }
    });
}


// oculta el boton de eliminar codigo asociado
function ocultarBotonEliminarCodigoAsociado() {
    const botonEliminarCodigoAsociado = document.getElementById(
        'boton_eliminar_codigo_asociado'
    );

    if (botonEliminarCodigoAsociado) {
        botonEliminarCodigoAsociado.hidden = true;
        botonEliminarCodigoAsociado.disabled = false;
    }
}


// determina si el codigo escaneado es un codigo asociado
function esCodigoAsociado(codigo, producto) {
    // sin producto el codigo no esta registrado
    if (!producto || !codigo) {
        return false;
    }

    // si el backend informa el tipo de codigo se utiliza ese dato
    if (typeof producto.es_codigo_asociado === 'boolean') {
        return producto.es_codigo_asociado;
    }

    // si no se compara con el codigo y el codigo de barras principal
    const codigoEscaneado = String(codigo).trim();
    const codigoPrincipal = String(producto.codigo ?? '').trim();
    const codigoBarrasPrincipal = String(producto.cod_barra ?? '').trim();

    return codigoEscaneado !== codigoPrincipal &&
        codigoEscaneado !== codigoBarrasPrincipal;
}


// apaga todo stream de camara que este activo
function detenerCamara() {
    escaneandoProducto = false;

    if (flujoCamara) {
        flujoCamara.getTracks().forEach(function(pista) {
            pista.stop();
        });

        flujoCamara = null;
    }

    const video = document.getElementById('lector_codigo_barras');

    if (video) {
        if (video.srcObject) {
            video.srcObject.getTracks().forEach(function(pista) {
                pista.stop();
            });
        }

        video.srcObject = null;
    }

    detectorProducto = null;
}


// inicia el escaner de productos
async function inicializarEscaner() {
    detenerCamara();

    // oculta el boton de eliminar al volver a escanear
    ocultarBotonEliminarCodigoAsociado();

    const contenedorContenido = document.querySelector(
        '.contenedor_contenido'
    );

    if (contenedorContenido) {
        contenedorContenido.classList.add(
            'contenedor_contenido_escaner'
        );
    }

    const miId = ++idInicioEscaner;

    const contenedor = document.getElementById(
        'contenedor_escaner_producto'
    );

    const video = document.getElementById('lector_codigo_barras');

    if (!contenedor || !video) {
        console.error('No se encontraron los elementos del escaner');
        return;
    }

    // muestra el contenedor y la vista del lector
    contenedor.classList.remove(
        'contenedor_escaner_producto_oculto'
    );

    mostrarVistaProducto('vista_lector_producto');

    try {
        // comprueba si el navegador admite BarcodeDetector
        if (!('BarcodeDetector' in window)) {
            throw new Error(
                'El navegador no admite BarcodeDetector'
            );
        }

        const detector = new BarcodeDetector({
            formats: formatosCodigoBarras
        });

        const flujo = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: {
                    ideal: 'environment'
                },
                width: {
                    ideal: 1280
                },
                height: {
                    ideal: 720
                }
            },
            audio: false
        });

        // cancela la apertura si el escaner ya se cerro
        if (miId !== idInicioEscaner) {
            flujo.getTracks().forEach(function(pista) {
                pista.stop();
            });

            return;
        }

        detectorProducto = detector;
        flujoCamara = flujo;

        video.srcObject = flujoCamara;

        // evita que el video sobrepase el ancho de su contenedor
        video.style.display = 'block';
        video.style.width = '100%';
        video.style.maxWidth = '100%';
        video.style.height = '100%';
        video.style.boxSizing = 'border-box';
        video.style.objectFit = 'cover';

        await video.play();

        // comprueba nuevamente que el intento siga vigente
        if (miId !== idInicioEscaner) {
            detenerCamara();
            return;
        }

        escaneandoProducto = true;

        buscarCodigoProducto(video, miId);

    } catch (error) {
        if (miId !== idInicioEscaner) {
            return;
        }

        console.error('Error al iniciar el escaner:', error);

        await mostrarMensajeEscaner('Cámara no disponible', 'No se pudo iniciar el escáner: ' + error.message, 'error');

        cerrarEscanerProducto();
    }
}


// busca codigos en la imagen de la camara
async function buscarCodigoProducto(video, miId) {
    while (escaneandoProducto && miId === idInicioEscaner) {
        try {
            const codigos = await detectorProducto.detect(video);

            if (codigos.length > 0) {
                const codigo = codigos[0].rawValue;

                if (!codigo) {
                    continue;
                }

                console.log('Codigo detectado:', codigo);

                // guarda el codigo para utilizarlo en las otras vistas
                codigoProductoEscaneado = codigo;
                productoEscaneado = null;

                // detiene la camara sin ocultar el contenedor principal
                detenerCamara();

                // consulta el producto en el backend
                await consultarProductoEscaneado(codigo);

                return;
            }
        } catch (error) {
            // el detector puede fallar entre cuadros
        }

        await new Promise(function(resolver) {
            setTimeout(resolver, 150);
        });
    }
}


// consulta el producto correspondiente al codigo escaneado
async function consultarProductoEscaneado(codigo) {
    try {
        const respuesta = await fetchConCsrf(
            `${URL_API}/api/escaneo/producto/${encodeURIComponent(codigo)}`,
            {
                credentials: 'include'
            }
        );

        // el codigo no esta registrado
        if (respuesta.status === 404) {
            abrirMenuProducto(codigo, null);
            return;
        }

        if (!respuesta.ok) {
            throw new Error('Respuesta ' + respuesta.status);
        }

        const datos = await respuesta.json();

        // conserva el producto devuelto por el backend
        productoEscaneado = datos.producto;

        // muestra el producto en la vista de gestion
        abrirMenuProducto(codigo, productoEscaneado);

    } catch (error) {
        console.error('Error al consultar el producto:', error);

        mostrarMensajeEscaner('Error al consultar', 'No se pudo consultar el producto', 'error');
    }
}


// muestra los datos del producto en la vista de gestion
function abrirMenuProducto(codigo, producto = null) {
    const elementoCodigo = document.getElementById(
        'codigo_producto_escaneado'
    );

    const botonAsociar = document.getElementById(
        'boton_asociar_codigo'
    );

    const botonAjustar = document.getElementById(
        'boton_ajustar_producto'
    );

    const menuAjuste = document.getElementById(
        'menu_ajustar_producto'
    );

    const botonEliminarCodigoAsociado = document.getElementById(
        'boton_eliminar_codigo_asociado'
    );

    // oculta el boton mientras no se determine el tipo de codigo
    ocultarBotonEliminarCodigoAsociado();

    if (!elementoCodigo) {
        console.error('No se encontro el elemento del codigo escaneado');
        return;
    }

    // guarda los datos actuales
    codigoProductoEscaneado = codigo;
    productoEscaneado = producto;

    if (producto) {

        // obtiene las unidades que representa el codigo
        const cantidadUnidades = Number(producto.factor ?? 1);

        // determina el formato del codigo
        const cantidadUnidadesFormateada = formatearCantidadEscaner(cantidadUnidades);
        const tipoCodigo = cantidadUnidades === 1
            ? `Unidad x${cantidadUnidadesFormateada}`
            : `Caja x${cantidadUnidadesFormateada}`;

        // muestra el codigo escaneado y su formato
        elementoCodigo.textContent =
            'Codigo escaneado: ' + codigo + ' - ' + tipoCodigo;

        elementoCodigo.hidden = false;

    } else {

        // mantiene visible el codigo que aun no esta asociado
        elementoCodigo.textContent = 'Código escaneado: ' + codigo + ' · No registrado';
        elementoCodigo.hidden = false;

    }

    // muestra los datos del producto o el mensaje correspondiente
    mostrarProductoEscaneado(producto);

    // permite asociar solamente cuando el codigo no esta registrado
    if (botonAsociar) {
        botonAsociar.hidden = producto !== null;
    }

    // permite ajustar solamente si se encontro un producto
    if (botonAjustar) {
        botonAjustar.hidden = producto === null;
    }

    // permite eliminar solamente cuando el codigo es asociado
    if (botonEliminarCodigoAsociado) {
        botonEliminarCodigoAsociado.hidden =
            !esCodigoAsociado(codigo, producto);
    }

    // oculta el menu de ajuste al mostrar otro producto
    if (menuAjuste) {
        menuAjuste.hidden = true;
    }

    // cambia a la vista de gestion sin cerrar el contenedor
    mostrarVistaProducto('vista_gestion_producto');
}


// muestra los datos del producto con las etiquetas de TresStock
function mostrarProductoEscaneado(producto) {
    const contenedorDatos = document.getElementById('datos_producto_escaneado');
    if (!contenedorDatos) return;

    contenedorDatos.replaceChildren();

    if (!producto) {
        const mensaje = document.createElement('div');
        mensaje.className = 'mensaje_sin_producto_escaner';
        mensaje.textContent = 'Este código no está registrado. Puedes asociarlo a un producto existente.';
        contenedorDatos.appendChild(mensaje);
        return;
    }

    // estructura principal con imagen y datos del producto
    const ficha = document.createElement('div');
    ficha.className = 'ficha_producto_escaner';

    const contenedorImagen = document.createElement('div');
    contenedorImagen.className = 'imagen_ficha_escaner';

    const mostrarSinImagen = function() {
        contenedorImagen.replaceChildren();
        const texto = document.createElement('div');
        texto.className = 'sin_imagen_ficha_escaner';
        texto.textContent = 'Sin imagen';
        contenedorImagen.appendChild(texto);
    };

    const rutaImagen = String(producto.imagen || '').trim();
    if (rutaImagen) {
        const imagen = document.createElement('img');
        imagen.alt = 'Fotografía de ' + (producto.descripcion || 'producto');
        imagen.loading = 'lazy';
        imagen.onerror = mostrarSinImagen;

        // admite URL de Open Food Facts y rutas locales servidas por el backend
        if (/^https?:\/\//i.test(rutaImagen)) {
            imagen.src = rutaImagen;
        } else if (rutaImagen.startsWith('/')) {
            imagen.src = URL_API + rutaImagen;
        } else {
            imagen.src = URL_API + '/' + rutaImagen;
        }
        contenedorImagen.appendChild(imagen);
    } else {
        mostrarSinImagen();
    }

    const detalles = document.createElement('div');
    detalles.className = 'detalles_ficha_escaner';

    const nombre = document.createElement('div');
    nombre.className = 'nombre_ficha_escaner';
    nombre.textContent = producto.descripcion || 'Producto sin descripción';
    detalles.appendChild(nombre);

    function agregarDato(etiqueta, valor) {
        const linea = document.createElement('div');
        linea.className = 'dato_ficha_escaner';
        const texto = document.createElement('strong');
        texto.textContent = etiqueta + ': ';
        linea.appendChild(texto);
        linea.appendChild(document.createTextNode(String(valor ?? '—')));
        detalles.appendChild(linea);
    }

    agregarDato('Código', producto.codigo);
    agregarDato('Código de barras', producto.cod_barra || 'Sin registrar');
    agregarDato('Familia', producto.familia || 'Sin familia');

    const precio = document.createElement('div');
    precio.className = 'precio_ficha_escaner';
    const monto = Number(producto.precio_publico);
    precio.textContent = Number.isFinite(monto)
        ? monto.toLocaleString('es-CL', {style: 'currency', currency: 'CLP', maximumFractionDigits: 0})
        : 'Precio no disponible';
    detalles.appendChild(precio);

    // atribución cuando la imagen proviene de Open Food Facts
    if (/^https?:\/\/images\.openfoodfacts\.org\//i.test(rutaImagen)) {
        const atribucion = document.createElement('div');
        atribucion.className = 'atribucion_ficha_escaner';
        atribucion.textContent = 'Fotografía: Open Food Facts (CC BY-SA)';
        detalles.appendChild(atribucion);
    }

    ficha.appendChild(contenedorImagen);
    ficha.appendChild(detalles);
    contenedorDatos.appendChild(ficha);

    // indicadores del inventario y del formato de código leído
    const indicadores = document.createElement('div');
    indicadores.className = 'indicadores_ficha_escaner';

    const agregarIndicador = function(etiqueta, valor) {
        const cuadro = document.createElement('div');
        cuadro.className = 'indicador_ficha_escaner';
        const leyenda = document.createElement('div');
        leyenda.className = 'etiqueta_indicador_ficha';
        leyenda.textContent = etiqueta;
        const cifra = document.createElement('div');
        cifra.className = 'valor_indicador_ficha';
        cifra.textContent = String(valor ?? 0);
        cuadro.appendChild(leyenda);
        cuadro.appendChild(cifra);
        indicadores.appendChild(cuadro);
    };

    const esBalanza = Boolean(producto.es_producto_balanza);
    agregarIndicador('Stock actual', formatearCantidadEscaner(producto.stock_actual, esBalanza));
    agregarIndicador('Stock mínimo', formatearCantidadEscaner(producto.stock_minimo, esBalanza));
    agregarIndicador('Unidades por código (actual)', formatearCantidadEscaner(producto.factor ?? 1, esBalanza));
    contenedorDatos.appendChild(indicadores);
}


// cierra el modal de ajuste sin cancelar la ficha del producto
function cerrarModalAjusteEscaner() {
    const menu = document.getElementById('menu_ajustar_producto');
    if (menu) menu.hidden = true;
    const botonLote = document.getElementById('boton_toggle_vencimiento_escaner');
    const estadoLote = document.getElementById('estado_toggle_vencimiento_escaner');
    const campoFecha = document.getElementById('campo_fecha_vencimiento_escaner');
    const fecha = document.getElementById('fecha_vencimiento_escaner');
    if (botonLote) botonLote.setAttribute('aria-pressed', 'false');
    if (estadoLote) estadoLote.textContent = 'No';
    if (campoFecha) campoFecha.hidden = true;
    if (fecha) {
        fecha.value = '';
        fecha.disabled = true;
        fecha.required = false;
    }
}

// cierra el modal al presionar Escape
if (typeof document !== 'undefined') {
    document.addEventListener('keydown', function(evento) {
        if (evento.key === 'Escape') {
            const alerta = document.getElementById('contenedor_alerta_escaner');
            if (alerta && !alerta.hidden) return;

            const menu = document.getElementById('menu_ajustar_producto');
            if (menu && !menu.hidden) cerrarModalAjusteEscaner();
        }
    });
}


// elimina el codigo asociado que se esta mostrando
async function eliminarCodigoAsociado() {
    // verifica que exista un codigo escaneado
    if (!codigoProductoEscaneado) {
        mostrarMensajeEscaner('Código no disponible', 'No hay un código escaneado para eliminar', 'advertencia');
        return;
    }

    // verifica que el codigo sea realmente un codigo asociado
    if (!esCodigoAsociado(codigoProductoEscaneado, productoEscaneado)) {
        mostrarMensajeEscaner('Código principal', 'Este código no es un código asociado', 'advertencia');
        return;
    }

    const botonEliminarCodigoAsociado = document.getElementById(
        'boton_eliminar_codigo_asociado'
    );

    // guarda el codigo para usarlo aunque cambie la variable global
    const codigoEliminar = codigoProductoEscaneado;

    // solicita confirmacion antes de eliminar
    const confirmarEliminacion = await confirmarAccionEscaner(
        'Eliminar código asociado',
        '¿Eliminar el código asociado ' + codigoEliminar + ' y sus datos?',
        'Eliminar'
    );

    if (!confirmarEliminacion) return;

    // evita enviar varias solicitudes al mismo tiempo
    if (botonEliminarCodigoAsociado) {
        botonEliminarCodigoAsociado.disabled = true;
    }

    try {
        const respuesta = await fetchConCsrf(
            `${URL_API}/api/escaneo/codigo-asociado/${encodeURIComponent(codigoEliminar)}`,
            {
                method: 'DELETE',
                credentials: 'include'
            }
        );

        const datos = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                datos.mensaje || 'No se pudo eliminar el codigo asociado'
            );
        }

        await mostrarMensajeEscaner('Código eliminado', datos.mensaje || 'Código asociado eliminado correctamente', 'correcto');

        // vuelve a consultar el codigo para mostrar que ya no esta registrado
        await consultarProductoEscaneado(codigoEliminar);

    } catch (error) {
        console.error('Error al eliminar el codigo asociado:', error);

        mostrarMensajeEscaner('Error al eliminar', error.message || 'No se pudo eliminar el código asociado', 'error');

        // vuelve a habilitar el boton para reintentar
        if (botonEliminarCodigoAsociado) {
            botonEliminarCodigoAsociado.disabled = false;
        }
    }
}


// muestra la vista para asociar el codigo a un producto
function mostrarProductosParaAsociar() {
    if (!codigoProductoEscaneado) {
        mostrarMensajeEscaner('Código no disponible', 'No hay un código escaneado para asociar', 'advertencia');
        return;
    }

    const elementoCodigo = document.getElementById(
        'codigo_producto_asociar'
    );

    const busqueda = document.getElementById(
        'busqueda_producto_asociar'
    );

    const cantidadUnidades = document.getElementById(
        'cantidad_unidades_asociar'
    );

    const resultados = document.getElementById(
        'resultados_productos_asociar'
    );

    const botonConfirmar = document.getElementById(
        'boton_confirmar_asociacion'
    );

    const contenedorSeleccionado = document.getElementById(
        'producto_seleccionado_asociar'
    );

    // invalida busquedas anteriores
    idBusquedaProductosAsociar++;

    // muestra el codigo que se desea asociar
    if (elementoCodigo) {
        elementoCodigo.textContent =
            'Codigo por asociar: ' + codigoProductoEscaneado;
    }

    // limpia la busqueda anterior
    if (busqueda) {
        busqueda.value = '';

        // conecta la busqueda de productos
        busqueda.oninput = function() {
            buscarProductosParaAsociar(busqueda.value);
        };
    }

    // establece una cantidad inicial
    if (cantidadUnidades) {
        cantidadUnidades.value = '1';
    }

    // limpia los resultados anteriores
    if (resultados) {
        resultados.replaceChildren();
    }

    // limpia la seleccion anterior
    productoSeleccionadoAsociar = null;

    if (contenedorSeleccionado) {
        contenedorSeleccionado.hidden = true;
    }

    if (botonConfirmar) {
        botonConfirmar.disabled = true;

        // conecta el boton para guardar la asociacion
        botonConfirmar.onclick = asociarCodigoSeleccionado;
    }

    // cambia a la vista de asociacion
    mostrarVistaProducto('vista_asociar_producto');

    if (busqueda) {
        busqueda.focus();
    }
}


// busca productos existentes mediante el backend
async function buscarProductosParaAsociar(termino) {
    const resultados = document.getElementById(
        'resultados_productos_asociar'
    );

    const botonConfirmar = document.getElementById(
        'boton_confirmar_asociacion'
    );

    const contenedorSeleccionado = document.getElementById(
        'producto_seleccionado_asociar'
    );

    const descripcionSeleccionada = document.getElementById(
        'descripcion_producto_seleccionado'
    );

    const codigoSeleccionado = document.getElementById(
        'codigo_producto_seleccionado'
    );

    const barraSeleccionada = document.getElementById(
        'barra_producto_seleccionado'
    );

    const idBusqueda = ++idBusquedaProductosAsociar;

    // limpia la seleccion cuando cambia el termino de busqueda
    productoSeleccionadoAsociar = null;

    if (botonConfirmar) {
        botonConfirmar.disabled = true;
    }

    if (contenedorSeleccionado) {
        contenedorSeleccionado.hidden = true;
    }

    if (!resultados) {
        return;
    }

    resultados.replaceChildren();

    termino = termino.trim();

    if (!termino) {
        return;
    }

    const mensajeCarga = document.createElement('p');

    mensajeCarga.textContent = 'Buscando productos...';

    resultados.appendChild(mensajeCarga);

    try {
        const respuesta = await fetchConCsrf(
            `${URL_API}/api/escaneo/productos-asociar?busqueda=${encodeURIComponent(termino)}`,
            {
                method: 'GET',
                credentials: 'include'
            }
        );

        if (!respuesta.ok) {
            throw new Error('Respuesta ' + respuesta.status);
        }

        const datos = await respuesta.json();

        // descarta resultados de busquedas anteriores
        if (idBusqueda !== idBusquedaProductosAsociar) {
            return;
        }

        resultados.replaceChildren();

        if (!datos.productos || datos.productos.length === 0) {
            const mensaje = document.createElement('p');

            mensaje.textContent = 'No se encontraron productos.';

            resultados.appendChild(mensaje);

            return;
        }

        // crea una opcion por cada producto encontrado
        datos.productos.forEach(function(producto) {
            const opcion = document.createElement('button');

            opcion.type = 'button';

            opcion.textContent =
                producto.descripcion +
                ' | Codigo: ' + producto.codigo +
                ' | Barra: ' + producto.cod_barra;

            // permite seleccionar el producto y mostrar su informacion
            opcion.addEventListener('click', function() {
                productoSeleccionadoAsociar = producto;

                // actualiza el estado visual de las opciones
                resultados.querySelectorAll('button').forEach(
                    function(boton) {
                        boton.removeAttribute('aria-pressed');
                    }
                );

                opcion.setAttribute('aria-pressed', 'true');

                // muestra la informacion del producto seleccionado
                if (contenedorSeleccionado) {
                    contenedorSeleccionado.hidden = false;
                }

                if (descripcionSeleccionada) {
                    descripcionSeleccionada.textContent =
                        producto.descripcion || 'Sin descripcion';
                }

                if (codigoSeleccionado) {
                    codigoSeleccionado.textContent =
                        producto.codigo || 'Sin codigo';
                }

                if (barraSeleccionada) {
                    barraSeleccionada.textContent =
                        producto.cod_barra || 'Sin codigo de barras';
                }

                // habilita la confirmacion
                if (botonConfirmar) {
                    botonConfirmar.disabled = false;
                }
            });

            resultados.appendChild(opcion);
        });

    } catch (error) {
        if (idBusqueda !== idBusquedaProductosAsociar) {
            return;
        }

        console.error('Error al buscar productos para asociar:', error);

        resultados.replaceChildren();

        const mensaje = document.createElement('p');

        mensaje.textContent = 'No se pudieron cargar los productos.';

        resultados.appendChild(mensaje);
    }
}


// guarda la asociacion entre el codigo escaneado y el producto seleccionado
async function asociarCodigoSeleccionado() {
    if (!codigoProductoEscaneado) {
        mostrarMensajeEscaner('Código no disponible', 'No hay un código escaneado para asociar', 'advertencia');
        return;
    }

    if (!productoSeleccionadoAsociar) {
        mostrarMensajeEscaner('Selecciona un producto', 'Selecciona un producto antes de continuar', 'advertencia');
        return;
    }

    const botonConfirmar = document.getElementById(
        'boton_confirmar_asociacion'
    );

    const campoCantidad = document.getElementById(
        'cantidad_unidades_asociar'
    );

    // obtiene la cantidad de unidades que representa el codigo
    const cantidadUnidades = Number(campoCantidad?.value);

    if (
        !Number.isSafeInteger(cantidadUnidades) ||
        cantidadUnidades <= 0
    ) {
        mostrarMensajeEscaner('Cantidad no válida', 'Ingresa una cantidad de unidades válida', 'advertencia');

        if (botonConfirmar) {
            botonConfirmar.disabled = false;
        }

        return;
    }

    if (botonConfirmar) {
        botonConfirmar.disabled = true;
    }

    try {
        const respuesta = await fetchConCsrf(
            `${URL_API}/api/escaneo/asociar-codigo`,
            {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    codigo_producto: productoSeleccionadoAsociar.codigo,
                    codigo_barras: codigoProductoEscaneado,
                    tipo_formato: 'unidad',
                    cantidad_unidades: cantidadUnidades
                })
            }
        );

        const datos = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                datos.mensaje || 'No se pudo asociar el codigo'
            );
        }

        await mostrarMensajeEscaner('Código asociado', datos.mensaje || 'Código asociado correctamente', 'correcto');

        // vuelve a consultar el codigo para mostrar el producto asociado
        await consultarProductoEscaneado(codigoProductoEscaneado);

    } catch (error) {
        console.error('Error al asociar el codigo:', error);

        mostrarMensajeEscaner('Error al asociar', error.message || 'No se pudo asociar el código', 'error');

        if (botonConfirmar) {
            botonConfirmar.disabled = false;
        }
    }
}


// vuelve a la vista de gestion del producto
function volverGestionProducto() {
    mostrarVistaProducto('vista_gestion_producto');
}


// obtiene la operacion seleccionada para ajustar el inventario
function obtenerOperacionAjuste() {
    if (document.getElementById('operacion_fijar')?.checked) return 'fijar';
    if (document.getElementById('operacion_restar')?.checked) return 'restar';
    return 'sumar';
}

// permite cantidades con hasta cuatro decimales (NUMERIC(12,4) en PostgreSQL)
function cantidadValidaEscaner(cantidad, admiteCero = false) {
    if (!Number.isFinite(cantidad)) return false;
    if (admiteCero ? cantidad < 0 : cantidad <= 0) return false;
    if (cantidad > 99999999.9999) return false;
    return Math.abs(cantidad - Math.round(cantidad * 10000) / 10000) < 1e-9;
}

// configura motivos coherentes para cada tipo de movimiento
function actualizarMotivosAjusteEscaner() {
    const campoMotivo = document.getElementById('motivo_ajuste_escaner');
    if (!campoMotivo) return;

    const operacion = obtenerOperacionAjuste();
    const opciones = operacion === 'sumar'
        ? ['Reposición de proveedor', 'Devolución al inventario', 'Corrección manual']
        : operacion === 'restar'
            ? ['Merma o producto dañado', 'Retiro manual', 'Corrección manual']
            : ['Conteo físico', 'Corrección de inventario', 'Stock simulado para demostración'];

    const anterior = campoMotivo.value;
    campoMotivo.replaceChildren();
    opciones.forEach(function(motivo) {
        const opcion = document.createElement('option');
        opcion.value = motivo;
        opcion.textContent = motivo;
        campoMotivo.appendChild(opcion);
    });
    if (opciones.includes(anterior)) campoMotivo.value = anterior;
}


// muestra u oculta el menu de ajuste del inventario
function ajustarProductoEscaneado() {
    if (!productoEscaneado) {
        mostrarMensajeEscaner('Producto no disponible', 'No hay un producto para ajustar', 'advertencia');
        return;
    }

    const menu = document.getElementById(
        'menu_ajustar_producto'
    );

    const campoCantidad = document.getElementById(
        'cantidad_ingresada_ajuste'
    );

    const campoUnidades = document.getElementById(
        'unidades_por_codigo_ajuste'
    );

    const campoInventario = document.getElementById(
        'inventario_actual_producto'
    );

    if (!menu || !campoCantidad || !campoUnidades || !campoInventario) {
        console.error('No se encontraron los elementos del ajuste');
        return;
    }

    // alterna la visibilidad del menu
    if (!menu.hidden) {
        menu.hidden = true;
        return;
    }

    // obtiene el factor correspondiente al codigo escaneado
    const factor = Number(productoEscaneado.factor ?? 1);

    // obtiene el inventario actual recibido desde el backend
    const inventario = Number(
        productoEscaneado.stock_actual ??
        productoEscaneado.stock ??
        productoEscaneado.inventario ??
        productoEscaneado.cantidad ??
        0
    );

    // establece los valores iniciales del ajuste
    campoCantidad.value = '1';

    const botonVencimiento = document.getElementById('boton_toggle_vencimiento_escaner');
    const estadoVencimiento = document.getElementById('estado_toggle_vencimiento_escaner');
    const campoFechaVencimiento = document.getElementById('campo_fecha_vencimiento_escaner');
    const fechaVencimiento = document.getElementById('fecha_vencimiento_escaner');
    if (botonVencimiento) botonVencimiento.setAttribute('aria-pressed', 'false');
    if (estadoVencimiento) estadoVencimiento.textContent = 'No';
    if (campoFechaVencimiento) campoFechaVencimiento.hidden = true;
    if (fechaVencimiento) {
        fechaVencimiento.value = '';
        fechaVencimiento.min = obtenerFechaMinimaLoteEscaner();
        fechaVencimiento.disabled = true;
        fechaVencimiento.required = false;
    }

    campoUnidades.value =
        Number.isSafeInteger(factor) && factor >= 1
            ? factor
            : 1;

    // el stock negativo se muestra tal como lo devuelve PostgreSQL;
    // nunca se reemplaza por cero de manera visual
    campoInventario.textContent = Number.isFinite(inventario)
        ? inventario
        : 0;

    // obtiene las opciones para seleccionar el tipo de cantidad
    const opcionCodigoActual = document.getElementById(
        'cantidad_codigo_actual'
    );

    const opcionCodigoSingular = document.getElementById(
        'cantidad_codigo_singular'
    );

    // obtiene las opciones para sumar o restar
    const opcionSumar = document.getElementById(
        'operacion_sumar'
    );

    const opcionRestar = document.getElementById(
        'operacion_restar'
    );

    const opcionFijar = document.getElementById('operacion_fijar');

    if (botonVencimiento) {
        const alternarVencimiento = () => {
            const activado = botonVencimiento.getAttribute('aria-pressed') !== 'true';
            botonVencimiento.setAttribute('aria-pressed', String(activado));
            if (estadoVencimiento) estadoVencimiento.textContent = activado ? 'Sí' : 'No';
            if (campoFechaVencimiento) campoFechaVencimiento.hidden = !activado;
            if (fechaVencimiento) {
                fechaVencimiento.min = obtenerFechaMinimaLoteEscaner();
                fechaVencimiento.disabled = !activado;
                fechaVencimiento.required = activado;
                if (activado) fechaVencimiento.focus();
                else fechaVencimiento.value = '';
            }
        };
        botonVencimiento.onclick = alternarVencimiento;
        botonVencimiento.onkeydown = evento => {
            if (evento.key === 'Enter' || evento.key === ' ') {
                evento.preventDefault();
                alternarVencimiento();
            }
        };
    }

    // selecciona inicialmente el codigo actual y la suma
    if (opcionCodigoActual) {
        opcionCodigoActual.checked = true;
    }

    if (opcionCodigoSingular) {
        opcionCodigoSingular.checked = false;
    }

    if (opcionSumar) {
        opcionSumar.checked = true;
    }

    if (opcionRestar) {
        opcionRestar.checked = false;
    }

    if (opcionFijar) {
        opcionFijar.checked = false;
    }

    // conecta la cantidad ingresada con el calculo
    campoCantidad.oninput = actualizarCalculoAjuste;

    // conecta las opciones de cantidad con el calculo
    if (opcionCodigoActual) {
        opcionCodigoActual.onchange = actualizarCalculoAjuste;
    }

    if (opcionCodigoSingular) {
        opcionCodigoSingular.onchange = actualizarCalculoAjuste;
    }

    // conecta las opciones de operacion con el calculo
    if (opcionSumar) {
        opcionSumar.onchange = actualizarCalculoAjuste;
    }

    if (opcionRestar) {
        opcionRestar.onchange = function() {
            actualizarMotivosAjusteEscaner();
            actualizarCalculoAjuste();
        };
    }

    if (opcionSumar) {
        opcionSumar.onchange = function() {
            actualizarMotivosAjusteEscaner();
            actualizarCalculoAjuste();
        };
    }

    if (opcionFijar) {
        opcionFijar.onchange = function() {
            actualizarMotivosAjusteEscaner();
            actualizarCalculoAjuste();
        };
    }

    actualizarMotivosAjusteEscaner();

    // calcula los valores iniciales y muestra el menu
    actualizarCalculoAjuste();

    menu.hidden = false;

    // permite salir del modal al hacer clic en el fondo oscuro
    menu.onclick = function(evento) {
        if (evento.target === menu) {
            cerrarModalAjusteEscaner();
        }
    };

    campoCantidad.focus();
}


// actualiza los resultados que se muestran en el menu de ajuste
function actualizarCalculoAjuste() {

    const campoCantidad = document.getElementById('cantidad_ingresada_ajuste');
    const campoUnidades = document.getElementById('unidades_por_codigo_ajuste');
    const campoInventario = document.getElementById('inventario_actual_producto');
    const resultadoCantidad = document.getElementById('cantidad_anadir_inventario');
    const resultadoInventario = document.getElementById('inventario_resultante_producto');
    const opcionCodigoActual = document.getElementById('cantidad_codigo_actual');
    const opcionesModalidad = document.querySelector('.opciones_tipo_cantidad');
    const tituloModalidad = opcionesModalidad?.previousElementSibling;
    const contenedorUnidades = document.getElementById('contenedor_unidades_codigo');
    const botonAceptar = document.getElementById('boton_aceptar_ajuste');
    const etiquetaCantidad = document.getElementById('texto_cantidad_ajuste');
    const textoUnidadesAjuste = document.getElementById('texto_unidades_ajuste');

    if (!campoCantidad || !campoUnidades || !campoInventario ||
        !resultadoCantidad || !resultadoInventario || !productoEscaneado) return;

    const operacion = obtenerOperacionAjuste();
    const esFijo = operacion === 'fijar';
    const bloqueVencimiento = document.getElementById('opcion_vencimiento_escaner');
    const botonVencimiento = document.getElementById('boton_toggle_vencimiento_escaner');
    const estadoVencimiento = document.getElementById('estado_toggle_vencimiento_escaner');
    const campoFechaVencimiento = document.getElementById('campo_fecha_vencimiento_escaner');
    const fechaVencimiento = document.getElementById('fecha_vencimiento_escaner');
    const seSumaStock = operacion === 'sumar';

    if (bloqueVencimiento) bloqueVencimiento.hidden = !seSumaStock;
    if (!seSumaStock && botonVencimiento?.getAttribute('aria-pressed') === 'true') {
        botonVencimiento.setAttribute('aria-pressed', 'false');
        if (estadoVencimiento) estadoVencimiento.textContent = 'No';
        if (campoFechaVencimiento) campoFechaVencimiento.hidden = true;
        if (fechaVencimiento) {
            fechaVencimiento.value = '';
            fechaVencimiento.disabled = true;
            fechaVencimiento.required = false;
        }
    }
    const factorProducto = Number(productoEscaneado.factor ?? 1);
    const factor = !esFijo && opcionCodigoActual?.checked && cantidadValidaEscaner(factorProducto)
        ? factorProducto
        : 1;

    // establecer stock indica unidades individuales, sin multiplicar por la caja
    if (opcionesModalidad) opcionesModalidad.hidden = esFijo;
    if (tituloModalidad) tituloModalidad.hidden = esFijo;
    if (contenedorUnidades) contenedorUnidades.hidden = esFijo || factor === 1;
    campoUnidades.value = factor;

    if (etiquetaCantidad) etiquetaCantidad.textContent = esFijo
        ? 'Nuevo stock (unidades)'
        : operacion === 'restar' ? 'Cantidad a restar' : 'Cantidad a sumar';
    if (textoUnidadesAjuste) textoUnidadesAjuste.textContent = esFijo
        ? 'Stock que deseas establecer:'
        : operacion === 'restar' ? 'Unidades a restar:' : 'Unidades a sumar:';

    campoCantidad.min = esFijo ? '0' : '0.0001';
    campoCantidad.step = 'any';

    const stockActual = Number(productoEscaneado.stock_actual ?? 0);
    const cantidad = Number(campoCantidad.value);
    const cantidadTotal = esFijo ? cantidad : Number((cantidad * factor).toFixed(4));
    const valido = campoCantidad.value.trim() !== '' &&
        cantidadValidaEscaner(cantidad, esFijo) &&
        cantidadValidaEscaner(cantidadTotal, esFijo) &&
        Number.isFinite(stockActual);

    if (!valido) {
        resultadoCantidad.textContent = '—';
        resultadoInventario.textContent = '—';
        if (botonAceptar) botonAceptar.disabled = true;
        return;
    }

    const nuevoStock = esFijo ? cantidadTotal
        : operacion === 'restar' ? Number((stockActual - cantidadTotal).toFixed(4))
        : Number((stockActual + cantidadTotal).toFixed(4));

    // se admite sumar a un saldo negativo existente para recuperarlo;
    // nunca se permite disminuirlo a un valor negativo nuevo
    const restaNoValida = operacion === 'restar' && nuevoStock < 0;
    const sinCambio = esFijo && Math.abs(nuevoStock - stockActual) < 1e-9;
    resultadoCantidad.textContent = cantidadTotal.toLocaleString('es-CL', {maximumFractionDigits: 4});
    resultadoInventario.textContent = nuevoStock.toLocaleString('es-CL', {maximumFractionDigits: 4});
    if (botonAceptar) botonAceptar.disabled = restaNoValida || sinCambio;
}


// confirma el cambio y utiliza el mismo endpoint de inventario de TresStock
async function aceptarAjusteProducto() {

    if (!productoEscaneado) {
        mostrarMensajeEscaner('Producto no disponible', 'No hay un producto seleccionado', 'advertencia');
        return;
    }

    const botonAceptar = document.getElementById('boton_aceptar_ajuste');
    const campoCantidad = document.getElementById('cantidad_ingresada_ajuste');
    const campoMotivo = document.getElementById('motivo_ajuste_escaner');
    const opcionCodigoActual = document.getElementById('cantidad_codigo_actual');
    const botonVencimiento = document.getElementById('boton_toggle_vencimiento_escaner');
    const fechaVencimiento = document.getElementById('fecha_vencimiento_escaner');
    const operacion = obtenerOperacionAjuste();
    const esFijo = operacion === 'fijar';
    const incluirVencimiento = botonVencimiento?.getAttribute('aria-pressed') === 'true';
    const fechaLote = String(fechaVencimiento?.value || '').trim();
    const cantidadIngresada = Number(campoCantidad?.value);
    const factor = esFijo || !opcionCodigoActual?.checked
        ? 1
        : Number(productoEscaneado.factor ?? 1);
    const cantidad = Number((cantidadIngresada * factor).toFixed(4));
    const motivo = String(campoMotivo?.value || '').trim();

    if (!cantidadValidaEscaner(cantidadIngresada, esFijo) ||
        !cantidadValidaEscaner(factor) ||
        !cantidadValidaEscaner(cantidad, esFijo) ||
        !motivo) {
        mostrarMensajeEscaner('Datos incompletos', 'Revisa la cantidad y el motivo del movimiento', 'advertencia');
        return;
    }

    if (incluirVencimiento && (
        operacion !== 'sumar' ||
        !fechaLote ||
        fechaLote < obtenerFechaMinimaLoteEscaner()
    )) {
        mostrarMensajeEscaner('Fecha no válida', 'Selecciona hoy o una fecha futura para el vencimiento del lote', 'advertencia');
        fechaVencimiento?.focus();
        return;
    }

    const stockActual = Number(productoEscaneado.stock_actual ?? 0);
    const nuevoStock = esFijo ? cantidad
        : operacion === 'sumar' ? Number((stockActual + cantidad).toFixed(4))
        : Number((stockActual - cantidad).toFixed(4));

    if (operacion === 'restar' && nuevoStock < 0) {
        mostrarMensajeEscaner('Stock insuficiente', 'No hay existencias suficientes para realizar esta salida', 'advertencia');
        return;
    }

    if (esFijo && Math.abs(nuevoStock - stockActual) < 1e-9) {
        mostrarMensajeEscaner('Sin cambios', 'El nuevo stock debe ser diferente del actual', 'advertencia');
        return;
    }

    const pregunta = esFijo
        ? `¿Establecer el stock de ${productoEscaneado.descripcion} en ${cantidad} unidades?`
        : operacion === 'sumar'
            ? `¿Sumar ${cantidad} unidades al inventario${incluirVencimiento ? ` con vencimiento el ${fechaLote}` : ''}?`
            : `¿Restar ${cantidad} unidades del inventario?`;

    const confirmado = await confirmarAccionEscaner(
        'Confirmar ajuste de inventario',
        pregunta,
        'Confirmar ajuste'
    );

    if (!confirmado) return;
    if (botonAceptar) botonAceptar.disabled = true;

    try {
        const respuesta = await fetchConCsrf(
            `${URL_API}/api/inventario/ajustar`,
            {
                method: 'POST',
                credentials: 'include',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    codigo: productoEscaneado.codigo,
                    cantidad,
                    operacion,
                    motivo: `${motivo} (Escáner)`,
                    fecha_vencimiento: incluirVencimiento ? fechaLote : null
                })
            }
        );

        const datos = await respuesta.json();
        if (!respuesta.ok) {
            throw new Error(datos.mensaje || 'No se pudo actualizar el inventario');
        }

        const nuevoInventario = Number(datos.inventario?.stock_actual);
        if (!Number.isFinite(nuevoInventario)) {
            throw new Error('El backend no devolvió el nuevo inventario');
        }

        productoEscaneado.stock_actual = nuevoInventario;
        mostrarProductoEscaneado(productoEscaneado);
        cerrarModalAjusteEscaner();
        await mostrarMensajeEscaner('Inventario actualizado', datos.mensaje || 'Inventario actualizado correctamente', 'correcto');

    } catch (error) {
        console.error('Error al ajustar inventario:', error);
        mostrarMensajeEscaner('Error al ajustar inventario', error.message || 'No se pudo actualizar el inventario', 'error');
    } finally {
        if (botonAceptar) botonAceptar.disabled = false;
    }
}


// vuelve al escaner para leer otro codigo
function volverAlEscanerProducto() {
    inicializarEscaner();
}


// cierra el contenedor completo del escaner y sus vistas
function cerrarEscanerProducto() {
    // evita dejar abierto un ajuste al salir de la vista
    cerrarModalAjusteEscaner();

    // invalida cualquier apertura o lectura pendiente
    idInicioEscaner++;

    // invalida las busquedas de productos pendientes
    idBusquedaProductosAsociar++;

    detenerCamara();

    // limpia la seleccion actual
    productoSeleccionadoAsociar = null;

    // oculta el boton de eliminar codigo asociado
    ocultarBotonEliminarCodigoAsociado();

    const contenedorContenido = document.querySelector(
        '.contenedor_contenido'
    );

    if (contenedorContenido) {
        contenedorContenido.classList.remove(
            'contenedor_contenido_escaner'
        );
    }

    const contenedor = document.getElementById(
        'contenedor_escaner_producto'
    );

    if (contenedor) {
        contenedor.classList.add(
            'contenedor_escaner_producto_oculto'
        );
    }
}
