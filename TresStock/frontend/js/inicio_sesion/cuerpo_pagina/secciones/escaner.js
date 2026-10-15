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
                facingMode: { ideal: 'environment' },
                width: { ideal: 1280 },
                height: { ideal: 720 }
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

        alert('No se pudo iniciar el escaner: ' + error.message);

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

        const respuesta = await fetch(
            `${URL_API}/api/escaneo/producto/${encodeURIComponent(codigo)}`,
            { credentials: 'include' }
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

        alert('No se pudo consultar el producto');
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

    if (!elementoCodigo) {
        console.error('No se encontro el elemento del codigo escaneado');
        return;
    }

    // guarda los datos actuales
    codigoProductoEscaneado = codigo;
    productoEscaneado = producto;

    // obtiene la cantidad de unidades que representa el codigo
    const cantidadUnidades = producto
        ? Number(producto.factor ?? 1)
        : 1;

    // determina el formato del codigo
    const tipoCodigo = cantidadUnidades === 1
        ? 'Unidad x1'
        : 'Caja x' + cantidadUnidades;

    // muestra el codigo escaneado y su formato
    elementoCodigo.textContent =
        'Codigo escaneado: ' + codigo + ' - ' + tipoCodigo;

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

    // oculta el menu de ajuste al mostrar otro producto
    if (menuAjuste) {
        menuAjuste.hidden = true;
    }

    // cambia a la vista de gestion sin cerrar el contenedor
    mostrarVistaProducto('vista_gestion_producto');
}


// muestra los datos recibidos del backend
function mostrarProductoEscaneado(producto) {

    const contenedorDatos = document.getElementById(
        'datos_producto_escaneado'
    );

    if (!contenedorDatos) {
        return;
    }

    // limpia los datos de una consulta anterior
    contenedorDatos.replaceChildren();

    if (!producto) {

        const mensaje = document.createElement('p');

        mensaje.textContent =
            'Este codigo no esta asociado a ningun producto.';

        contenedorDatos.appendChild(mensaje);

        return;
    }

    // crea una fila por cada dato sencillo del producto
    Object.entries(producto).forEach(function([campo, valor]) {

        if (valor !== null && typeof valor === 'object') {
            return;
        }

        const fila = document.createElement('p');
        const etiqueta = document.createElement('strong');

        etiqueta.textContent = campo + ': ';

        fila.appendChild(etiqueta);
        fila.appendChild(
            document.createTextNode(
                valor === null ? '' : String(valor)
            )
        );

        contenedorDatos.appendChild(fila);
    });
}


// muestra la vista para asociar el codigo a un producto
function mostrarProductosParaAsociar() {

    if (!codigoProductoEscaneado) {
        alert('No hay un codigo escaneado para asociar');
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

        const respuesta = await fetch(
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
        alert('No hay un codigo escaneado para asociar');
        return;
    }

    if (!productoSeleccionadoAsociar) {
        alert('Selecciona un producto antes de continuar');
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
        !Number.isFinite(cantidadUnidades) ||
        cantidadUnidades <= 0
    ) {

        alert('Ingresa una cantidad de unidades valida');

        if (botonConfirmar) {
            botonConfirmar.disabled = false;
        }

        return;
    }

    if (botonConfirmar) {
        botonConfirmar.disabled = true;
    }

    try {

        const respuesta = await fetch(
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

        alert(datos.mensaje || 'Codigo asociado correctamente');

        // vuelve a consultar el codigo para mostrar el producto asociado
        await consultarProductoEscaneado(codigoProductoEscaneado);

    } catch (error) {

        console.error('Error al asociar el codigo:', error);

        alert(error.message || 'No se pudo asociar el codigo');

        if (botonConfirmar) {
            botonConfirmar.disabled = false;
        }
    }
}


// vuelve a la vista de gestion del producto
function volverGestionProducto() {

    mostrarVistaProducto('vista_gestion_producto');
}


// muestra u oculta el menu de ajuste del inventario
function ajustarProductoEscaneado() {

    if (!productoEscaneado) {
        alert('No hay un producto para ajustar');
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

    // carga el inventario actual del producto
    // se revisaran los nombres definitivos del campo del inventario
    const inventario = Number(
        productoEscaneado.stock ??
        productoEscaneado.inventario ??
        productoEscaneado.cantidad ??
        0
    );

    // establece los valores iniciales del ajuste
    campoCantidad.value = '1';
    campoUnidades.value = Number.isFinite(factor) && factor >= 1
        ? factor
        : 1;

    campoInventario.textContent = Number.isFinite(inventario)
        ? inventario
        : 0;

    // selecciona inicialmente el codigo actual
    const opcionCodigoActual = document.getElementById(
        'cantidad_codigo_actual'
    );

    const opcionCodigoSingular = document.getElementById(
        'cantidad_codigo_singular'
    );

    if (opcionCodigoActual) {
        opcionCodigoActual.checked = true;
    }

    if (opcionCodigoSingular) {
        opcionCodigoSingular.checked = false;
    }

    // conecta los campos con la actualizacion de resultados
    campoCantidad.oninput = actualizarCalculoAjuste;

    if (opcionCodigoActual) {
        opcionCodigoActual.onchange = actualizarCalculoAjuste;
    }

    if (opcionCodigoSingular) {
        opcionCodigoSingular.onchange = actualizarCalculoAjuste;
    }

    // calcula los valores iniciales y muestra el menu
    actualizarCalculoAjuste();

    menu.hidden = false;
}


// actualiza los resultados que se muestran en el menu de ajuste
function actualizarCalculoAjuste() {

    const campoCantidad = document.getElementById(
        'cantidad_ingresada_ajuste'
    );

    const campoUnidades = document.getElementById(
        'unidades_por_codigo_ajuste'
    );

    const campoInventario = document.getElementById(
        'inventario_actual_producto'
    );

    const resultadoAnadir = document.getElementById(
        'cantidad_anadir_inventario'
    );

    const resultadoInventario = document.getElementById(
        'inventario_resultante_producto'
    );

    const opcionCodigoActual = document.getElementById(
        'cantidad_codigo_actual'
    );

    if (
        !campoCantidad ||
        !campoUnidades ||
        !campoInventario ||
        !resultadoAnadir ||
        !resultadoInventario
    ) {
        return;
    }

    // determina si se utiliza el codigo actual o el codigo singular
    const usarCodigoActual = opcionCodigoActual
        ? opcionCodigoActual.checked
        : true;

    // obtiene el factor del codigo escaneado
    const factorProducto = Number(productoEscaneado?.factor ?? 1);

    // el codigo singular siempre representa una unidad
    const factor = usarCodigoActual
        ? (
            Number.isFinite(factorProducto) && factorProducto >= 1
                ? factorProducto
                : 1
        )
        : 1;

    // muestra el factor correspondiente a la opcion seleccionada
    campoUnidades.value = factor;

    // obtiene la cantidad ingresada por el usuario
    const cantidad = Number(campoCantidad.value);

    // obtiene el inventario actual mostrado en pantalla
    const inventario = Number(campoInventario.textContent) || 0;

    // valida la cantidad para evitar resultados incorrectos
    if (
        campoCantidad.value.trim() === '' ||
        !Number.isFinite(cantidad) ||
        cantidad < 1 ||
        !Number.isInteger(cantidad)
    ) {

        resultadoAnadir.textContent = '0';
        resultadoInventario.textContent = inventario;

        return;
    }

    // calcula las unidades que se añadiran al inventario
    const cantidadAnadir = cantidad * factor;

    // calcula el inventario resultante
    const inventarioResultante = inventario + cantidadAnadir;

    // muestra la cantidad que se añadira
    resultadoAnadir.textContent = cantidadAnadir;

    // muestra el inventario resultante
    resultadoInventario.textContent = inventarioResultante;
}


// FUNCION ACEPTAR AJUSTE DE PRODUCTO
async function aceptarAjusteProducto() {

    // verifica que exista un producto seleccionado
    if (!productoEscaneado) {

        alert('No hay un producto seleccionado');

        return;

    }

    // obtiene el codigo del producto
    const codigo = productoEscaneado.codigo;

    // obtiene la cantidad calculada
    const cantidad = Number(
        document.getElementById(
            'cantidad_anadir_inventario'
        ).textContent
    );

    // verifica la cantidad
    if (
        !Number.isSafeInteger(cantidad) ||
        cantidad < 1
    ) {

        alert('La cantidad a añadir no es válida');

        return;

    }

    // solicita confirmacion del ajuste
    const confirmar = confirm(
        `¿Añadir ${cantidad} unidades al inventario?`
    );

    // cancela el ajuste si no se confirma
    if (!confirmar) {

        return;

    }

    try {

        // envia el ajuste al backend
        const respuesta = await fetch(
            `${URL_API}/api/inventario/ajustar`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    codigo,
                    cantidad
                })
            }
        );

        // obtiene la respuesta del backend
        const resultado = await respuesta.json();

        // verifica si ocurrio un error
        if (!respuesta.ok) {

            throw new Error(
                resultado.mensaje ||
                'No se pudo actualizar el inventario'
            );

        }

        // actualiza el inventario mostrado
        document.getElementById(
            'inventario_actual_producto'
        ).textContent =
            resultado.inventario.stock_actual;

        // actualiza el inventario resultante
        document.getElementById(
            'inventario_resultante_producto'
        ).textContent =
            resultado.inventario.stock_actual;

        // informa que el ajuste fue exitoso
        alert(
            resultado.mensaje ||
            'Inventario actualizado correctamente'
        );

        // cierra el menu de ajuste
        document.getElementById(
            'menu_ajustar_producto'
        ).hidden = true;

    } catch (error) {

        // informa el error del ajuste
        console.error(
            'Error al ajustar inventario:',
            error
        );

        alert(
            error.message ||
            'Ocurrió un error al actualizar el inventario'
        );

    }

}


// vuelve al escaner para leer otro codigo
function volverAlEscanerProducto() {

    inicializarEscaner();
}


// cierra el contenedor completo del escaner y sus vistas
function cerrarEscanerProducto() {

    // invalida cualquier apertura o lectura pendiente
    idInicioEscaner++;

    // invalida las busquedas de productos pendientes
    idBusquedaProductosAsociar++;

    detenerCamara();

    // limpia la seleccion actual
    productoSeleccionadoAsociar = null;

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