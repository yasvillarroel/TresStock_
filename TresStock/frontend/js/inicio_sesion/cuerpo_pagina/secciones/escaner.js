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


// formatos de codigos de barras admitidos
const formatosCodigoBarras = [
    'code_128',
    'code_39',
    'ean_13',
    'ean_8',
    'upc_a',
    'upc_e'
];


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

    document.querySelector('.contenedor_contenido')
    .classList.add('contenedor_contenido_escaner');

    const miId = ++idInicioEscaner;

    const contenedor = document.getElementById(
        'contenedor_escaner_producto'
    );

    const video = document.getElementById('lector_codigo_barras');

    if (!contenedor || !video) {
        console.error('No se encontraron los elementos del escaner');
        return;
    }

    // oculta el menu y muestra el escaner
    cerrarMenuProducto();

    contenedor.classList.remove(
        'contenedor_escaner_producto_oculto'
    );

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
        if (
            miId !== idInicioEscaner ||
            !document.getElementById('lector_codigo_barras')
        ) {

            flujo.getTracks().forEach(function(pista) {
                pista.stop();
            });

            return;
        }

        detectorProducto = detector;
        flujoCamara = flujo;

        video.srcObject = flujoCamara;

        await video.play();

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

                // guarda el codigo para utilizarlo en el menu
                codigoProductoEscaneado = codigo;
                productoEscaneado = null;

                // detiene y oculta solamente el escaner
                cerrarEscanerProducto();

                // consulta el producto en el backend
                consultarProductoEscaneado(codigo);

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

        // muestra el producto en el menu
        abrirMenuProducto(codigo, productoEscaneado);

    } catch (error) {

        console.error('Error al consultar el producto:', error);

        alert('No se pudo consultar el producto');

    }
}


// abre el menu independiente del escaner
function abrirMenuProducto(codigo, producto = null) {

    const contenedor = document.getElementById(
        'contenedor_menu_producto'
    );

    const elementoCodigo = document.getElementById(
        'codigo_producto_escaneado'
    );

    const botonAsociar = document.getElementById(
        'boton_asociar_codigo'
    );

    const botonAjustar = document.getElementById(
        'boton_ajustar_producto'
    );

    if (!contenedor || !elementoCodigo) {
        console.error('No se encontraron los elementos del menu');
        return;
    }

    // guarda los datos actuales
    codigoProductoEscaneado = codigo;
    productoEscaneado = producto;

    // muestra el codigo sin interpretar su contenido como HTML
    elementoCodigo.textContent = 'Codigo escaneado: ' + codigo;

    // muestra los datos del producto o el estado sin coincidencias
    mostrarProductoEscaneado(producto);

    // permite asociar solamente cuando el codigo no esta registrado
    if (botonAsociar) {
        botonAsociar.hidden = producto !== null;
    }

    // permite ajustar solamente si se encontro un producto
    if (botonAjustar) {
        botonAjustar.hidden = producto === null;
    }

    // muestra el menu
    contenedor.classList.remove(
        'contenedor_menu_producto_oculto'
    );
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

        if (
            valor !== null &&
            typeof valor === 'object'
        ) {
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

    console.log('Producto escaneado:', producto);
}


// prepara la asociacion del codigo a un producto existente
function mostrarProductosParaAsociar() {

    if (!codigoProductoEscaneado) {
        alert('No hay un codigo escaneado para asociar');
        return;
    }

    const resultados = document.getElementById(
        'resultados_productos_asociar'
    );

    if (resultados) {
        resultados.hidden = false;
    }

    // aqui conectaremos la busqueda de productos del backend
    alert('Falta conectar la busqueda de productos para asociar.');
}


// prepara la edicion del producto encontrado
function ajustarProductoEscaneado() {

    if (!productoEscaneado) {
        alert('No hay un producto para ajustar');
        return;
    }

    // aqui conectaremos el formulario de edicion del producto
    alert('Falta conectar el formulario de ajuste del producto.');
}


// vuelve al escaner para leer otro codigo
function volverAlEscanerProducto() {

    cerrarMenuProducto();

    inicializarEscaner();
}


// cierra solamente el menu de gestion
function cerrarMenuProducto() {

    const contenedor = document.getElementById(
        'contenedor_menu_producto'
    );

    if (contenedor) {

        contenedor.classList.add(
            'contenedor_menu_producto_oculto'
        );
    }
}


// cierra solamente el escaner
function cerrarEscanerProducto() {

    // invalida cualquier apertura o lectura pendiente
    idInicioEscaner++;

    detenerCamara();

    document.querySelector('.contenedor_contenido')
    .classList.remove('contenedor_contenido_escaner');


    const contenedor = document.getElementById(
        'contenedor_escaner_producto'
    );

    if (contenedor) {

        contenedor.classList.add(
            'contenedor_escaner_producto_oculto'
        );
    }
}