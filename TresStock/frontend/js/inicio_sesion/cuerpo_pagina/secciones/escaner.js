// indica a la libreria donde esta el archivo .wasm (se ejecuta una sola vez)
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

// identifica cada intento de abrir la camara, para cancelar los que quedaron viejos
let idInicioEscaner = 0;

// solo codigos de barra
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

        // por si quedo un stream asignado que no estaba en flujoCamara
        if (video.srcObject) {

            video.srcObject.getTracks().forEach(function(pista) {
                pista.stop();
            });

        }

        video.srcObject = null;
    }

    detectorProducto = null;
}


// inicia el escaner de productos (el HTML ya fue cargado por cargarVista)
async function inicializarEscaner() {

    // si habia una camara abierta, se apaga antes de abrir otra
    detenerCamara();

    const miId = ++idInicioEscaner;

    const contenedor = document.getElementById('contenedor_escaner_producto');
    const video = document.getElementById('lector_codigo_barras');

    if (!contenedor || !video) {
        console.error('Faltan elementos del escáner:', contenedor, video);
        return;
    }

    contenedor.classList.remove('contenedor_escaner_producto_oculto');

    try {

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

        // si el usuario salio mientras esperaba el permiso, se apaga y se termina
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

        // si ya se cancelo este intento, no hay nada que avisar
        if (miId !== idInicioEscaner) {
            return;
        }

        console.error('Error al iniciar la camara:', error);
        alert('Error de cámara: ' + error.message);

        cerrarEscanerProducto();
    }
}


// revisa la imagen de la camara cada cierto tiempo buscando un codigo
async function buscarCodigoProducto(video, miId) {

    while (escaneandoProducto && miId === idInicioEscaner) {

        try {

            const codigos = await detectorProducto.detect(video);

            if (codigos.length > 0) {

                const codigo = codigos[0].rawValue;

                console.log('Codigo detectado:', codigo);

                cerrarEscanerProducto();

                // busca en el backend el producto con ese codigo
                consultarProductoEscaneado(codigo);

                return;
            }

        } catch (error) {

            // sin accion: el detector falla de vez en cuando entre cuadros

        }

        await new Promise(function(resolver) {
            setTimeout(resolver, 150);
        });
    }
}


// consulta al backend el producto que corresponde al codigo escaneado
async function consultarProductoEscaneado(codigo) {

    try {

        const respuesta = await fetch(
            `${URL_API}/api/escaneo/producto/${encodeURIComponent(codigo)}`,
            { credentials: 'include' }
        );

        if (respuesta.status === 404) {

            alert('No se encontró un producto con el código ' + codigo);

            return;
        }

        if (!respuesta.ok) {

            throw new Error('Respuesta ' + respuesta.status);

        }

        const datos = await respuesta.json();

        mostrarProductoEscaneado(datos.producto);

    } catch (error) {

        console.error('Error al consultar el producto:', error);

        alert('No se pudo consultar el producto');
    }
}


// por ahora solo muestra el resultado en consola; aqui va la vista del producto
function mostrarProductoEscaneado(producto) {

    console.log('Producto escaneado:', producto);
}


// cierra el escaner de productos
function cerrarEscanerProducto() {

    // invalida cualquier apertura o busqueda que este pendiente
    idInicioEscaner++;

    detenerCamara();

    const contenedorEscaner = document.getElementById(
        'contenedor_escaner_producto'
    );

    if (contenedorEscaner) {

        contenedorEscaner.classList.add(
            'contenedor_escaner_producto_oculto'
        );

    }
}
