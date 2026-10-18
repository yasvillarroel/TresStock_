// importa el pool de conexiones
const pool = require('../../configuracion/base_datos');


// BUSCAR PRODUCTO POR CODIGO ESCANEADO
// busca en este orden: codigo del producto, codigo de barras y codigos asociados
const buscarProductoPorCodigo = async (codigo) => {

    const resultado = await pool.query(
        `
        WITH encontrado AS (
            SELECT codigo, factor
            FROM (
                SELECT
                    p.codigo AS codigo,
                    1::numeric AS factor,
                    1 AS prioridad
                FROM base_datos.productos p
                WHERE p.codigo = $1
                   OR p.cod_barra = $1

                UNION ALL

                SELECT
                    ca.codigo_producto AS codigo,
                    ca.cantidad_unidades AS factor,
                    2 AS prioridad
                FROM base_datos.codigos_asociados ca
                WHERE ca.codigo_barras = $1
            ) t
            ORDER BY prioridad
            LIMIT 1
        )
        SELECT
            p.codigo,
            p.cod_barra,
            p.descripcion,
            p.familia,
            p.precio_publico,
            p.imagen,
            e.factor,
            COALESCE(i.stock_actual, 0) AS stock_actual,
            COALESCE(i.stock_minimo, 0) AS stock_minimo
        FROM encontrado e
        JOIN base_datos.productos p
            ON p.codigo = e.codigo
        LEFT JOIN base_datos.inventario i
            ON i.codigo = p.codigo
        `,
        [codigo]
    );

    if (resultado.rows.length === 0) {
        return null;
    }

    return resultado.rows[0];

};

// BUSCAR PRODUCTOS PARA ASOCIAR UN CODIGO
const buscarProductosParaAsociar = async (termino) => {

    const resultado = await pool.query(
        `
        SELECT
            p.codigo,
            p.cod_barra,
            p.descripcion,
            p.familia,
            p.precio_publico
        FROM base_datos.productos p
        WHERE
            p.codigo ILIKE $1
            OR p.descripcion ILIKE $1
            OR p.cod_barra ILIKE $1
        ORDER BY p.descripcion
        LIMIT 20
        `,
        [`%${termino}%`]
    );

    return resultado.rows;

};


// ASOCIAR CODIGO DE BARRAS A UN PRODUCTO
const asociarCodigoProducto = async (
    codigoProducto,
    codigoBarras,
    tipoFormato,
    cantidadUnidades
) => {

    // comprueba si el codigo ya esta registrado
    const existente = await pool.query(
        `
        SELECT codigo
        FROM base_datos.productos
        WHERE cod_barra = $1

        UNION ALL

        SELECT codigo_producto AS codigo
        FROM base_datos.codigos_asociados
        WHERE codigo_barras = $1

        LIMIT 1
        `,
        [codigoBarras]
    );

    if (existente.rows.length > 0) {

        const error = new Error(
            'El codigo de barras ya esta registrado'
        );

        error.codigo = 'CODIGO_DUPLICADO';

        throw error;

    }

    // registra la asociacion
    const resultado = await pool.query(
        `
        INSERT INTO base_datos.codigos_asociados (
            codigo_producto,
            codigo_barras,
            tipo_formato,
            cantidad_unidades
        )
        VALUES ($1, $2, $3, $4)
        RETURNING
            id_codigo,
            codigo_producto,
            codigo_barras,
            tipo_formato,
            cantidad_unidades
        `,
        [
            codigoProducto,
            codigoBarras,
            tipoFormato,
            cantidadUnidades
        ]
    );

    return resultado.rows[0];

};

// FUNCION ELIMINAR CODIGO ASOCIADO
const eliminarCodigoAsociado = async (codigoBarras) => {

    // verifica que el codigo no pertenezca a un producto principal
    const producto = await pool.query(
        `SELECT codigo
         FROM base_datos.productos
         WHERE codigo = $1
            OR cod_barra = $1`,
        [codigoBarras]
    );

    // impide eliminar codigos principales
    if (producto.rowCount > 0) {
        const error = new Error(
            'No se pueden eliminar códigos de productos principales'
        );

        error.status = 400;

        throw error;
    }

    // elimina exclusivamente el registro del codigo asociado
    const resultado = await pool.query(
        `DELETE FROM base_datos.codigos_asociados
         WHERE codigo_barras = $1
         RETURNING
             id_codigo,
             codigo_producto,
             codigo_barras,
             tipo_formato,
             cantidad_unidades`,
        [codigoBarras]
    );

    // verifica que el codigo asociado exista
    if (resultado.rowCount === 0) {
        const error = new Error(
            'El código asociado no existe'
        );

        error.status = 404;

        throw error;
    }

    // devuelve los datos del registro eliminado
    return resultado.rows[0];

};


// exporta las funciones
module.exports = {
    buscarProductoPorCodigo,
    buscarProductosParaAsociar,
    asociarCodigoProducto,
    eliminarCodigoAsociado
};
