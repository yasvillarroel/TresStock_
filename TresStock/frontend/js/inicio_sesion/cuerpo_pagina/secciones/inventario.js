// TITULO 1 CONTENEDOR CONTENIDO INVENTARIO

    // Sin funcion

    // SUBTITULO 2 CONTENEDOR DE OPCIONES DE INVENTARIO

        // Sin funcion

        // SUB-SUBTITULO 1 BOTON ESCANEAR PRODUCTOS

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

            // solo codigos de barra
            const formatosCodigoBarras = [
                'code_128',
                'code_39',
                'ean_13',
                'ean_8',
                'upc_a',
                'upc_e'
            ];

            // abre el escaner de productos
            async function abrirEscanerProducto() {

                const contenedorEscaner = document.getElementById(
                    'contenedor_escaner_producto'
                );

                const video = document.getElementById(
                    'lector_codigo_barras'
                );

                if (!contenedorEscaner || !video) {
                    return;
                }

                contenedorEscaner.classList.remove(
                    'contenedor_escaner_producto_oculto'
                );

                try {

                    detectorProducto = new BarcodeDetector({
                        formats: formatosCodigoBarras
                    });

                    flujoCamara = await navigator.mediaDevices.getUserMedia({
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

                    video.srcObject = flujoCamara;

                    await video.play();

                    escaneandoProducto = true;

                    buscarCodigoProducto(video);

                } catch (error) {

                    console.error(
                        'Error al iniciar la camara:',
                        error
                    );
                    alert('Error de cámara: ' + error.message);

                    cerrarEscanerProducto();

                }
            }

            // revisa la imagen de la camara cada cierto tiempo buscando un codigo
            async function buscarCodigoProducto(video) {

                while (escaneandoProducto) {

                    try {

                        const codigos = await detectorProducto.detect(video);

                        if (codigos.length > 0) {

                            console.log(
                                'Codigo detectado:',
                                codigos[0].rawValue
                            );

                            // aqui despues se buscara el producto con ese codigo

                            cerrarEscanerProducto();

                            return;
                        }

                    } catch (error) {

                        // wun nada 

                    }

                    await new Promise(function(resolver) {
                        setTimeout(resolver, 150);
                    });
                }
            }

            // cierra el escaner de productos
            function cerrarEscanerProducto() {

                escaneandoProducto = false;

                if (flujoCamara) {

                    flujoCamara.getTracks().forEach(function(pista) {
                        pista.stop();
                    });

                    flujoCamara = null;
                }

                const video = document.getElementById(
                    'lector_codigo_barras'
                );

                if (video) {
                    video.srcObject = null;
                }

                detectorProducto = null;

                const contenedorEscaner = document.getElementById(
                    'contenedor_escaner_producto'
                );

                if (!contenedorEscaner) {
                    return;
                }

                contenedorEscaner.classList.add(
                    'contenedor_escaner_producto_oculto'
                );
            }