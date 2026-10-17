// importar libreria para leer xlsx
const XLSX = require('@keep-lts/xlsx');

// importa el pool de conexiones
const pool = require('../../configuracion/base_datos');



// FUNCION AUXILIAR GUARDAR PROVEEDOR DEL PRODUCTO
const guardarProveedorProducto = async (
    cliente,
    codigo,
    proveedor
) => {

    // elimina las asociaciones anteriores del producto
    await cliente.query(
        `DELETE FROM base_datos.producto_proveedor
         WHERE codigo = $1`,
        [codigo]
    );

    // permite dejar un producto sin proveedor
    if (!proveedor) {
        return;
    }

    // registra el proveedor seleccionado
    const resultado = await cliente.query(
        `INSERT INTO base_datos.producto_proveedor
            (codigo, id_proveedor)
         SELECT
            $1,
            id_proveedor
         FROM base_datos.proveedores
         WHERE nombre_comercial = $2
         RETURNING codigo`,
        [codigo, proveedor]
    );

    if (resultado.rowCount === 0) {

        throw new Error(
            'El proveedor seleccionado no existe: ' + proveedor
        );
    }
};




// FUNCION 1 CREAR PRODUCTO
const crearProducto = async (
    codigo,
    codigo_barra,
    descripcion,
    familia,
    precio_publico,
    imagen,
    proveedor
) => {

    const cliente = await pool.connect();

    try {

        await cliente.query('BEGIN');

        const resultado = await cliente.query(
            `INSERT INTO base_datos.productos
                (
                    codigo,
                    cod_barra,
                    descripcion,
                    familia,
                    precio_publico,
                    imagen
                )
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [
                codigo,
                codigo_barra,
                descripcion,
                familia,
                precio_publico,
                imagen
            ]
        );

        // guarda el proveedor del nuevo producto
        await guardarProveedorProducto(
            cliente,
            codigo,
            proveedor
        );

        await cliente.query('COMMIT');

        return resultado.rows[0];

    } catch (error) {

        await cliente.query('ROLLBACK');
        throw error;

    } finally {

        cliente.release();
    }
};


// FUNCION 2 OBTENER TODOS LOS PRODUCTOS
const obtenerProductos = async () => {

    const resultado = await pool.query(
        `SELECT
            p.codigo,
            p.cod_barra,
            p.descripcion,
            p.familia,
            p.precio_publico,
            p.imagen,
            i.stock_actual,
            i.stock_minimo,
            proveedores_producto.proveedor

        FROM base_datos.productos p

        LEFT JOIN base_datos.inventario i
            ON p.codigo = i.codigo

        LEFT JOIN (
            SELECT
                pp.codigo,

                STRING_AGG(
                    DISTINCT pr.nombre_comercial,
                    ', '
                    ORDER BY pr.nombre_comercial
                ) AS proveedor

            FROM base_datos.producto_proveedor pp

            INNER JOIN base_datos.proveedores pr
                ON pr.id_proveedor = pp.id_proveedor

            GROUP BY pp.codigo

        ) proveedores_producto
            ON proveedores_producto.codigo = p.codigo

        ORDER BY p.codigo`
    );

    return resultado.rows;
};

// FUNCION 3 OBTENER PRODUCTO POR ID
const obtenerProducto = async (id) => {

    const resultado = await pool.query(
        `SELECT
            codigo,
            cod_barra,
            descripcion,
            familia,
            precio_publico,
            imagen
        FROM base_datos.productos
        WHERE codigo = $1`,
        [id]
    );

    return resultado.rows[0];
};



// FUNCION 4 ACTUALIZAR PRODUCTO
const actualizarProducto = async (
    id,
    codigo,
    codigo_barra,
    descripcion,
    familia,
    precio_publico,
    imagen,
    proveedor
) => {

    const cliente = await pool.connect();

    try {

        await cliente.query('BEGIN');

        // actualiza los datos del producto
        const resultado = await cliente.query(
            `UPDATE base_datos.productos
             SET
                codigo = $1,
                cod_barra = $2,
                descripcion = $3,
                familia = $4,
                precio_publico = $5,
                imagen = $6
             WHERE codigo = $7
             RETURNING *`,
            [
                codigo,
                codigo_barra,
                descripcion,
                familia,
                precio_publico,
                imagen,
                id
            ]
        );

        if (resultado.rowCount === 0) {
            throw new Error('El producto ya no existe');
        }

        // actualiza el proveedor del producto
        await guardarProveedorProducto(
            cliente,
            codigo,
            proveedor
        );

        await cliente.query('COMMIT');

        return resultado.rows[0];

    } catch (error) {

        await cliente.query('ROLLBACK');
        throw error;

    } finally {

        cliente.release();
    }
};




// FUNCION 5 ELIMINAR PRODUCTO
const eliminarProducto = async (id) => {

    // elimina solamente productos sin stock ni historial
    const resultado = await pool.query(
        `DELETE FROM base_datos.productos AS p

         WHERE p.codigo = $1

         AND NOT EXISTS (
             SELECT 1
             FROM base_datos.inventario AS i
             WHERE i.codigo = p.codigo
             AND i.stock_actual > 0
         )

         AND NOT EXISTS (
             SELECT 1
             FROM base_datos.detalle_venta AS dv
             WHERE dv.codigo = p.codigo
         )

         AND NOT EXISTS (
             SELECT 1
             FROM base_datos.movimientos_inventario AS mi
             WHERE mi.codigo = p.codigo
         )

         AND NOT EXISTS (
             SELECT 1
             FROM base_datos.lotes_vencimiento AS lv
             WHERE lv.codigo = p.codigo
         )

         RETURNING p.codigo`,
        [id]
    );

    return resultado.rows[0] || null;
};


 // FUNCION 6 IMPORTAR PRODUCTOS
const importarProductos = async (archivo) => {

    // lee el archivo Excel desde memoria
    const libro = XLSX.read(archivo.buffer, {
        type: 'buffer'
    });

    // verifica que exista al menos una hoja
    if (!libro.SheetNames.length) {
        throw new Error('El archivo no contiene hojas');
    }

    // obtiene la primera hoja
    const nombreHoja = libro.SheetNames[0];
    const hoja = libro.Sheets[nombreHoja];

    // convierte la hoja en objetos
    // defval permite reconocer columnas con celdas vacias
    const productos = XLSX.utils.sheet_to_json(hoja, {
        defval: ''
    });

    // verifica que existan productos
    if (!productos.length) {
        throw new Error('El archivo no contiene productos');
    }

    // columnas obligatorias del archivo
    const columnasObligatorias = [
        'CODIGO',
        'COD. BARRA',
        'DESCRIPCION',
        'FAMILIA',
        'P.Publico'
    ];

    // obtiene las columnas del Excel
    const columnasArchivo = Object.keys(productos[0]);

    // verifica las columnas obligatorias
    for (const columna of columnasObligatorias) {

        if (!columnasArchivo.includes(columna)) {
            throw new Error(
                `Falta la columna obligatoria: ${columna}`
            );
        }

    }

    // verifica si el archivo incluye proveedores
    const tieneColumnaProveedor =
        columnasArchivo.includes('PROVEEDOR');

    // normaliza los nombres para comparar proveedores
    const normalizarProveedor = (nombre) => {

        return String(nombre ?? '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
            .replace(/\s+/g, ' ')
            .toLowerCase();

    };

    // arreglos para registrar problemas
    const codigosNulos = [];
    const codigosBarraNulos = [];
    const codigosExtranos = [];
    const preciosInvalidos = [];
    const codigosDuplicados = [];

    const codigosVistos = new Set();

    // productos que cumplen las validaciones
    const productosValidos = [];

    // revisa cada fila del archivo
    for (let i = 0; i < productos.length; i++) {

        const producto = productos[i];

        // numero de fila en el Excel
        const fila = i + 2;

        // obtiene codigo
        const codigo = String(
            producto['CODIGO'] ?? ''
        ).trim();

        // obtiene codigo de barras
        const codigoBarra = String(
            producto['COD. BARRA'] ?? ''
        ).trim();

        // obtiene descripcion
        const descripcion = String(
            producto['DESCRIPCION'] ?? ''
        ).trim();

        // obtiene familia
        const familia = String(
            producto['FAMILIA'] ?? ''
        ).trim();

        // obtiene proveedor si existe la columna
        const proveedor = tieneColumnaProveedor
            ? String(producto['PROVEEDOR'] ?? '').trim()
            : '';

        // obtiene precio
        const precio = producto['P.Publico'];

        // verifica codigo vacio
        if (!codigo) {

            codigosNulos.push({
                fila,
                descripcion
            });

            continue;
        }

        // verifica codigo de barras vacio
        if (!codigoBarra) {

            codigosBarraNulos.push({
                fila,
                descripcion
            });

            continue;
        }

        // verifica codigo extraño
        if (
            codigo.startsWith('.') ||
            codigo.endsWith('.') ||
            codigo.includes(' ')
        ) {

            codigosExtranos.push({
                fila,
                codigo
            });

            continue;
        }

        // convierte el precio a numero
        const precioNumero = Number(precio);

        // verifica precio invalido
        if (
            precio === undefined ||
            precio === null ||
            precio === '' ||
            !Number.isFinite(precioNumero) ||
            precioNumero < 0
        ) {

            preciosInvalidos.push({
                fila,
                valor: precio
            });

            continue;
        }

        // evita codigos duplicados dentro del Excel
        if (codigosVistos.has(codigo)) {

            codigosDuplicados.push({
                fila,
                codigo
            });

            continue;
        }

        codigosVistos.add(codigo);

        // agrega producto valido
        productosValidos.push({
            codigo,
            codigoBarra,
            descripcion,
            familia: familia || null,
            precio: precioNumero,
            proveedor,
            fila
        });

    }

    // verifica errores de validacion
    if (
        codigosNulos.length > 0 ||
        codigosBarraNulos.length > 0 ||
        codigosExtranos.length > 0 ||
        preciosInvalidos.length > 0 ||
        codigosDuplicados.length > 0
    ) {

        throw new Error(
            'El archivo contiene datos invalidos: ' +
            `${codigosNulos.length} codigos vacios, ` +
            `${codigosBarraNulos.length} codigos de barra vacios, ` +
            `${codigosExtranos.length} codigos invalidos, ` +
            `${preciosInvalidos.length} precios invalidos y ` +
            `${codigosDuplicados.length} codigos duplicados.`
        );

    }

    // obtiene una conexion del pool
    const cliente = await pool.connect();

    // contadores de importacion
    let productosImportados = 0;
    let productosExistentes = 0;
    let productosConProveedor = 0;
    let productosSinProveedor = 0;

    try {

        // inicia la transaccion
        await cliente.query('BEGIN');

        // almacena los proveedores registrados
        const idsPorNombre = new Map();

        if (tieneColumnaProveedor) {

            // consulta los proveedores de PostgreSQL
            const resultadoProveedores = await cliente.query(
                `SELECT
                    id_proveedor,
                    nombre_comercial
                 FROM base_datos.proveedores`
            );

            // guarda los nombres y sus identificadores
            for (const proveedor of resultadoProveedores.rows) {

                idsPorNombre.set(
                    normalizarProveedor(
                        proveedor.nombre_comercial
                    ),
                    proveedor.id_proveedor
                );

            }

            // revisa proveedores que no existen
            const proveedoresNoEncontrados = [];

            for (const producto of productosValidos) {

                // producto sin proveedor en el Excel
                if (!producto.proveedor) {

                    producto.idProveedor = null;
                    productosSinProveedor++;

                    continue;
                }

                // busca el proveedor por nombre
                const idProveedor = idsPorNombre.get(
                    normalizarProveedor(producto.proveedor)
                );

                // verifica si existe en PostgreSQL
                if (idProveedor === undefined) {

                    proveedoresNoEncontrados.push(
                        `fila ${producto.fila}: ${producto.proveedor}`
                    );

                    continue;
                }

                // asigna el identificador del proveedor
                producto.idProveedor = idProveedor;

                productosConProveedor++;

            }

            // detiene la importacion si faltan proveedores
            if (proveedoresNoEncontrados.length > 0) {

                throw new Error(
                    `Hay ${proveedoresNoEncontrados.length} filas con ` +
                    'proveedores que no estan registrados. ' +
                    'Ejemplos: ' +
                    proveedoresNoEncontrados.slice(0, 8).join('; ')
                );

            }

        }

        // procesa productos en lotes de 500
        const tamanoLote = 500;

        for (
            let inicio = 0;
            inicio < productosValidos.length;
            inicio += tamanoLote
        ) {

            const lote = productosValidos.slice(
                inicio,
                inicio + tamanoLote
            );

            // inserta solamente los productos nuevos
            const resultado = await cliente.query(
                `INSERT INTO base_datos.productos
                    (
                        codigo,
                        cod_barra,
                        descripcion,
                        familia,
                        precio_publico
                    )
                 SELECT
                    datos.codigo,
                    datos."codigoBarra",
                    datos.descripcion,
                    datos.familia,
                    datos.precio
                 FROM jsonb_to_recordset($1::jsonb) AS datos(
                    codigo TEXT,
                    "codigoBarra" TEXT,
                    descripcion TEXT,
                    familia TEXT,
                    precio NUMERIC
                 )
                 ON CONFLICT (codigo) DO NOTHING`,
                [
                    JSON.stringify(lote)
                ]
            );

            // actualiza contadores
            productosImportados += resultado.rowCount;

            productosExistentes +=
                lote.length - resultado.rowCount;

            // procesa proveedores solamente si existe la columna
            if (tieneColumnaProveedor) {

                // elimina las asociaciones anteriores de esos productos
                await cliente.query(
                    `DELETE FROM base_datos.producto_proveedor AS pp
                     USING jsonb_to_recordset($1::jsonb)
                         AS datos(
                             codigo TEXT,
                             "idProveedor" INTEGER
                         )
                     WHERE pp.codigo = datos.codigo`,
                    [
                        JSON.stringify(lote)
                    ]
                );

                // agrega el proveedor indicado en el Excel
                await cliente.query(
                    `INSERT INTO base_datos.producto_proveedor
                        (
                            codigo,
                            id_proveedor
                        )
                     SELECT
                        datos.codigo,
                        datos."idProveedor"
                     FROM jsonb_to_recordset($1::jsonb)
                         AS datos(
                             codigo TEXT,
                             "idProveedor" INTEGER
                         )
                     WHERE datos."idProveedor" IS NOT NULL
                     ON CONFLICT (codigo, id_proveedor)
                     DO NOTHING`,
                    [
                        JSON.stringify(lote)
                    ]
                );

            }

        }

        // confirma todos los cambios
        await cliente.query('COMMIT');

        // devuelve el resumen de importacion
        return {
            mensaje: 'Importacion completada',
            resumen: {
                total_filas: productos.length,
                productos_importados: productosImportados,
                productos_existentes: productosExistentes,
                proveedores_procesados: tieneColumnaProveedor,
                productos_con_proveedor: productosConProveedor,
                productos_sin_proveedor: productosSinProveedor
            }
        };

    } catch (error) {

        // deshace todos los cambios si ocurre un error
        await cliente.query('ROLLBACK');

        throw error;

    } finally {

        // libera la conexion
        cliente.release();

    }

};


// FUNCION 7 OBTENER FAMILIAS
const obtenerFamilias = async () => {

    const resultado = await pool.query(
        `SELECT DISTINCT familia
        FROM base_datos.productos
        WHERE familia IS NOT NULL
        AND TRIM(familia) <> ''
        ORDER BY familia`
    );

    return resultado.rows;
};  



// FUNCION 8 BUSCAR IMAGEN DE PRODUCTO EN OPEN FOOD FACTS

// evita consultas repetidas y protege el limite publico de la API
const cacheImagenesProductos = new Map();
const historialConsultasImagenes = [];

const buscarImagenProducto = async (codigoBarra) => {

    // solo se aceptan codigos de barras numericos (EAN/UPC, entre 8 y 14 digitos)
    const codigo = String(codigoBarra ?? '').trim();

    if (!/^\d{8,14}$/.test(codigo)) {
        const error = new Error('El codigo de barras debe tener entre 8 y 14 digitos numericos.');
        error.statusCode = 400;
        throw error;
    }

    // Open Food Facts solicita identificar la aplicacion con un contacto real
    const contacto = String(process.env.OPENFOODFACTS_CONTACTO ?? '').trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contacto)) {
        const error = new Error('Configura OPENFOODFACTS_CONTACTO con un correo real antes de consultar la API.');
        error.statusCode = 503;
        throw error;
    }

    // reutiliza resultados recientes para no repetir la consulta
    const ahora = Date.now();
    const guardado = cacheImagenesProductos.get(codigo);

    if (guardado && ahora - guardado.fecha < 15 * 60 * 1000) {
        return guardado.datos;
    }

    // limita a 12 consultas por minuto desde este proceso (la API permite 15)
    while (
        historialConsultasImagenes.length > 0 &&
        ahora - historialConsultasImagenes[0] >= 60 * 1000
    ) {
        historialConsultasImagenes.shift();
    }

    if (historialConsultasImagenes.length >= 12) {
        const error = new Error('Se alcanzo el limite temporal de busquedas. Espera un minuto e intenta nuevamente.');
        error.statusCode = 429;
        throw error;
    }

    historialConsultasImagenes.push(ahora);

    // consulta la fotografia frontal del producto, sin descargarla ni guardarla
    const url =
        'https://world.openfoodfacts.org/api/v2/product/' +
        codigo +
        '?fields=code,product_name,brands,image_front_url';

    let respuesta;

    try {
        respuesta = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'User-Agent': `TresStock/1.0 (${contacto})`
            },
            signal: AbortSignal.timeout(10000)
        });
    } catch (error) {
        const fallo = new Error(
            error.name === 'TimeoutError'
                ? 'Open Food Facts demoro demasiado en responder.'
                : 'No fue posible conectar con Open Food Facts.'
        );
        fallo.statusCode = error.name === 'TimeoutError' ? 504 : 502;
        throw fallo;
    }


    // verifica la respuesta de Open Food Facts
    if (!respuesta.ok) {

        // muestra el codigo HTTP real en la consola del backend
        console.error(
            'Open Food Facts HTTP:',
            respuesta.status,
            'Codigo de barras:',
            codigo
        );

        // producto no registrado en Open Food Facts
        if (respuesta.status === 404) {

            return {
                encontrado: false,
                codigo_barra: codigo,
                nombre: null,
                marca: null,
                imagen_url: null,
                mensaje: 'El producto no está registrado en Open Food Facts.'
            };

        }

        // identifica cuando el servicio esta temporalmente ocupado
        const errorTemporal = [
            429, 500, 502, 503, 504
        ].includes(respuesta.status);

        const error = new Error(
            errorTemporal
                ? 'Open Food Facts está temporalmente ocupado. ' +
                  'Intenta nuevamente más tarde. HTTP ' + respuesta.status
                : 'No se pudo completar la consulta. HTTP ' +
                  respuesta.status
        );

        error.statusCode = respuesta.status === 429 ? 429 : 502;

        throw error;
    }


    const datos = await respuesta.json();
    const producto = datos.status === 1 ? datos.product : null;

    // comprueba que la fotografia venga de la fuente esperada
    let imagenUrl = null;

    if (producto?.image_front_url) {
        try {
            const urlImagen = new URL(producto.image_front_url);

            if (
                urlImagen.protocol === 'https:' &&
                ['images.openfoodfacts.org', 'static.openfoodfacts.org'].includes(urlImagen.hostname)
            ) {
                imagenUrl = urlImagen.href;
            }
        } catch (error) {
            // ignora fotografias con enlaces invalidos
        }
    }

    const resultado = {
        encontrado: Boolean(imagenUrl),
        codigo_barra: codigo,
        nombre: producto?.product_name || null,
        marca: producto?.brands || null,
        imagen_url: imagenUrl,
        fuente: 'Open Food Facts',
        pagina_producto: 'https://world.openfoodfacts.org/product/' + codigo,
        mensaje: !producto
            ? 'El codigo no esta registrado en Open Food Facts.'
            : imagenUrl
                ? 'Imagen encontrada. Verifica que corresponda al producto.'
                : 'El producto esta registrado, pero no tiene una imagen frontal disponible.'
    };

    // guarda temporalmente el resultado en memoria, no en PostgreSQL
    if (cacheImagenesProductos.size >= 300) {
        cacheImagenesProductos.delete(cacheImagenesProductos.keys().next().value);
    }

    cacheImagenesProductos.set(codigo, {
        fecha: Date.now(),
        datos: resultado
    });

    return resultado;
};

// exporta las funciones
module.exports = {
    crearProducto,
    obtenerProductos,
    obtenerProducto,
    actualizarProducto,
    eliminarProducto,
    importarProductos,
    obtenerFamilias,
    buscarImagenProducto
};