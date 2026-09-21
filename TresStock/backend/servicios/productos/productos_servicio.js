// importar libreria para leer xlsx
const XLSX = require('@keep-lts/xlsx');

// importa el pool de conexiones
const pool = require('../../configuracion/base_datos');


// FUNCION 1 CREAR PRODUCTO
const crearProducto = async (
    codigo,
    codigo_barra,
    descripcion,
    familia,
    precio_publico,
    imagen
) => {

    const resultado = await pool.query(
        `INSERT INTO base_datos.productos
        (codigo, cod_barra, descripcion, familia, precio_publico, imagen)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING
            codigo,
            cod_barra,
            descripcion,
            familia,
            precio_publico,
            imagen`,
        [
            codigo,
            codigo_barra,
            descripcion,
            familia,
            precio_publico,
            imagen
        ]
    );

    return resultado.rows[0];
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
            i.stock_minimo
        FROM base_datos.productos p
        LEFT JOIN base_datos.inventario i
        ON p.codigo = i.codigo
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
    imagen
) => {

    const resultado = await pool.query(
        `UPDATE base_datos.productos
        SET
            codigo = $1,
            cod_barra = $2,
            descripcion = $3,
            familia = $4,
            precio_publico = $5,
            imagen = $6
        WHERE codigo = $7
        RETURNING
            codigo,
            cod_barra,
            descripcion,
            familia,
            precio_publico,
            imagen`,
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

    return resultado.rows[0];
};


// FUNCION 5 ELIMINAR PRODUCTO
const eliminarProducto = async (id) => {

    const resultado = await pool.query(
        `DELETE FROM base_datos.productos
        WHERE codigo = $1
        RETURNING
            codigo,
            cod_barra,
            descripcion,
            familia,
            precio_publico,
            imagen`,
        [id]
    );

    return resultado.rows[0];
};

// FUNCION 6 IMPORTAR PRODUCTOS
const importarProductos = async (archivo) => {

    // lee el archivo excel desde memoria
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
    const productos = XLSX.utils.sheet_to_json(hoja);

    // verifica que existan productos
    if (!productos.length) {
        throw new Error('El archivo no contiene productos');
    }

    // columnas obligatorias
    const columnasObligatorias = [
        'CODIGO',
        'COD. BARRA',
        'DESCRIPCION',
        'FAMILIA',
        'P.Publico'
    ];

    // obtiene las columnas del archivo
    const columnasArchivo = Object.keys(productos[0]);

    // verifica las columnas
    for (const columna of columnasObligatorias) {

        if (!columnasArchivo.includes(columna)) {
            throw new Error(
                `Falta la columna obligatoria: ${columna}`
            );
        }

    }

    // arreglos para guardar problemas
    const codigosNulos = [];
    const codigosBarraNulos = [];
    const codigosExtranos = [];
    const preciosInvalidos = [];

    // productos que se van a insertar
    const productosValidos = [];

    // analiza cada fila
    for (let i = 0; i < productos.length; i++) {

        const producto = productos[i];

        // numero real de fila del excel
        const fila = i + 2;

        const codigo =
            producto['CODIGO'] !== undefined &&
            producto['CODIGO'] !== null
                ? String(producto['CODIGO']).trim()
                : '';

        const codigoBarra =
            producto['COD. BARRA'] !== undefined &&
            producto['COD. BARRA'] !== null
                ? String(producto['COD. BARRA']).trim()
                : '';

        const descripcion =
            producto['DESCRIPCION'] !== undefined &&
            producto['DESCRIPCION'] !== null
                ? String(producto['DESCRIPCION']).trim()
                : '';

        const familia =
            producto['FAMILIA'] !== undefined &&
            producto['FAMILIA'] !== null
                ? String(producto['FAMILIA']).trim()
                : '';

        const precio = producto['P.Publico'];

        // verifica codigo nulo
        if (!codigo) {

            codigosNulos.push({
                fila: fila,
                descripcion: descripcion
            });

            continue;
        }

        // verifica codigo de barra nulo
        if (!codigoBarra) {

            codigosBarraNulos.push({
                fila: fila,
                descripcion: descripcion
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
                fila: fila,
                codigo: codigo
            });

            continue;
        }

        // verifica precio
        const precioNumero = Number(precio);

        if (
            precio === undefined ||
            precio === null ||
            precio === '' ||
            !Number.isFinite(precioNumero) ||
            precioNumero < 0
        ) {

            preciosInvalidos.push({
                fila: fila,
                valor: precio
            });

            continue;
        }

        // agrega producto valido
        productosValidos.push({
            codigo: codigo,
            codigoBarra: codigoBarra,
            descripcion: descripcion,
            familia: familia || null,
            precio: precioNumero
        });

    }

    // verifica errores de validacion
    if (
        codigosNulos.length > 0 ||
        codigosBarraNulos.length > 0 ||
        codigosExtranos.length > 0 ||
        preciosInvalidos.length > 0
    ) {

        throw new Error(
            'El archivo contiene datos invalidos que deben revisarse'
        );

    }

    // obtiene una conexion del pool
    const cliente = await pool.connect();

    let productosImportados = 0;
    let productosExistentes = 0;

    try {

        // inicia la transaccion
        await cliente.query('BEGIN');

        // inserta los productos validos
        for (const producto of productosValidos) {

            const resultado = await cliente.query(
                `INSERT INTO base_datos.productos
                (
                    codigo,
                    cod_barra,
                    descripcion,
                    familia,
                    precio_publico
                )
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (codigo) DO NOTHING`,
                [
                    producto.codigo,
                    producto.codigoBarra,
                    producto.descripcion,
                    producto.familia,
                    producto.precio
                ]
            );

            // verifica si se inserto
            if (resultado.rowCount === 1) {
                productosImportados++;
            } else {
                productosExistentes++;
            }

        }

        // confirma la transaccion
        await cliente.query('COMMIT');

        // devuelve el resultado
        return {
            mensaje: 'Importacion completada',
            resumen: {
                total_filas: productos.length,
                productos_importados: productosImportados,
                productos_existentes: productosExistentes
            }
        };

    } catch (error) {

        // deshace todos los cambios
        await cliente.query('ROLLBACK');

        throw error;

    } finally {

        // devuelve la conexion al pool
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

// exporta las funciones
module.exports = {
    crearProducto,
    obtenerProductos,
    obtenerProducto,
    actualizarProducto,
    eliminarProducto,
    importarProductos,
    obtenerFamilias
};