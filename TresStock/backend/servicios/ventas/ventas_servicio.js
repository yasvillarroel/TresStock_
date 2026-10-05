// importa el lector de CSV
const {
    parse
} = require('csv-parse/sync');

// importa el pool de conexiones
const pool = require('../../configuracion/base_datos');


// FUNCION 1 OBTENER VENTAS

const obtenerVentas = async (
    pagina,
    limite,
    buscar,
    desde,
    hasta
) => {

    const condiciones = [];
    const valores = [];


    if (buscar) {

        valores.push(
            `%${buscar}%`
        );

        condiciones.push(
            `v.boleta ILIKE $${valores.length}`
        );

    }


    if (desde) {

        valores.push(
            desde
        );

        condiciones.push(
            `v.fecha_hora::date >= $${valores.length}`
        );

    }


    if (hasta) {

        valores.push(
            hasta
        );

        condiciones.push(
            `v.fecha_hora::date <= $${valores.length}`
        );

    }


    let where = '';


    if (condiciones.length > 0) {

        where =
            'WHERE ' +
            condiciones.join(' AND ');

    }


    const resultadoCantidad =
        await pool.query(
            `
            SELECT COUNT(*) AS total
            FROM base_datos.ventas v
            ${where}
            `,
            valores
        );


    const totalVentas =
        Number(
            resultadoCantidad.rows[0].total
        );


    const totalPaginas =
        Math.max(
            1,
            Math.ceil(
                totalVentas /
                limite
            )
        );


    const desplazamiento =
        (pagina - 1) *
        limite;


    const valoresConsulta =
        [...valores];


    valoresConsulta.push(
        limite
    );


    const posicionLimite =
        valoresConsulta.length;


    valoresConsulta.push(
        desplazamiento
    );


    const posicionDesplazamiento =
        valoresConsulta.length;


    const resultado =
        await pool.query(
            `
            SELECT
                v.id_venta,
                v.boleta,
                TO_CHAR(
                    v.fecha_hora,
                    'DD/MM/YYYY'
                ) AS fecha,
                TO_CHAR(
                    v.fecha_hora,
                    'HH24:MI'
                ) AS hora,
                v.total
            FROM base_datos.ventas v
            ${where}
            ORDER BY
                v.fecha_hora DESC,
                v.id_venta DESC
            LIMIT $${posicionLimite}
            OFFSET $${posicionDesplazamiento}
            `,
            valoresConsulta
        );


    return {
        ventas: resultado.rows,
        paginacion: {
            pagina_actual: pagina,
            total_paginas: totalPaginas,
            total_ventas: totalVentas,
            limite: limite
        }
    };

};


// FUNCION 2 OBTENER RESUMEN VENTAS

const obtenerResumenVentas = async () => {

    const resultado =
        await pool.query(
            `
            SELECT
                COUNT(*) AS total_ventas,

                COUNT(*) FILTER (
                    WHERE fecha_hora::date =
                    CURRENT_DATE
                ) AS ventas_dia,

                COALESCE(
                    SUM(total),
                    0
                ) AS total_vendido

            FROM base_datos.ventas
            `
        );


    return resultado.rows[0];

};


// FUNCION 3 OBTENER DETALLE VENTA

const obtenerDetalleVenta =
    async (idVenta) => {

        const resultadoVenta =
            await pool.query(
                `
                SELECT
                    id_venta,
                    boleta,
                    TO_CHAR(
                        fecha_hora,
                        'DD/MM/YYYY'
                    ) AS fecha,
                    TO_CHAR(
                        fecha_hora,
                        'HH24:MI'
                    ) AS hora,
                    total
                FROM base_datos.ventas
                WHERE id_venta = $1
                `,
                [
                    idVenta
                ]
            );


        if (
            resultadoVenta.rows.length === 0
        ) {

            return null;

        }


        const resultadoDetalles =
            await pool.query(
                `
                SELECT
                    dv.id_detalle,
                    dv.codigo,
                    p.descripcion,
                    dv.precio,
                    dv.cantidad,
                    dv.valorizado

                FROM base_datos.detalle_venta dv

                LEFT JOIN base_datos.productos p
                    ON p.codigo = dv.codigo

                WHERE dv.id_venta = $1

                ORDER BY dv.id_detalle
                `,
                [
                    idVenta
                ]
            );


        return {
            venta:
                resultadoVenta.rows[0],

            detalles:
                resultadoDetalles.rows
        };

    };


// FUNCION 4 CONVERTIR NUMERO CHILENO

const convertirNumeroChileno =
    (valor) => {

        if (
            valor === undefined ||
            valor === null
        ) {

            return NaN;

        }


        const texto =
            String(
                valor
            )
                .trim()
                .replace(/\s/g, '')
                .replace(/\./g, '')
                .replace(',', '.');


        if (!texto) {

            return NaN;

        }


        return Number(
            texto
        );

    };


// FUNCION 5 OBTENER BOLETA

const obtenerNumeroBoleta =
    (texto) => {

        const coincidencia =
            String(
                texto || ''
            ).match(
                /BOL\s*N(?:º|°|O)?\s*(\d+)/i
            );


        if (!coincidencia) {

            return null;

        }


        return coincidencia[1];

    };


// FUNCION 6 CONVERTIR FECHA Y HORA

const convertirFechaHora =
    (
        fechaTexto,
        horaTexto
    ) => {

        const fecha =
            String(
                fechaTexto || ''
            ).trim();


        const partesFecha =
            fecha.match(
                /^(\d{2})\/(\d{2})\/(\d{4})$/
            );


        if (!partesFecha) {

            return null;

        }


        let hora =
            String(
                horaTexto || ''
            )
                .replace(
                    /HORA:/i,
                    ''
                )
                .trim();


        const partesHora =
            hora.match(
                /^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i
            );


        if (!partesHora) {

            return null;

        }


        let horas =
            Number(
                partesHora[1]
            );


        const minutos =
            Number(
                partesHora[2]
            );


        const periodo =
            partesHora[3]
                ? partesHora[3].toUpperCase()
                : null;


        if (
            periodo === 'PM' &&
            horas < 12
        ) {

            horas += 12;

        }


        if (
            periodo === 'AM' &&
            horas === 12
        ) {

            horas = 0;

        }


        const anio =
            partesFecha[3];

        const mes =
            partesFecha[2];

        const dia =
            partesFecha[1];


        return (
            anio +
            '-' +
            mes +
            '-' +
            dia +
            ' ' +
            String(horas).padStart(
                2,
                '0'
            ) +
            ':' +
            String(minutos).padStart(
                2,
                '0'
            ) +
            ':00'
        );

    };


// FUNCION 7 INSERTAR VENTAS EN BLOQUES

const insertarVentasEnBloques =
    async (
        cliente,
        ventas
    ) => {

        const mapaIds =
            new Map();


        const tamanoBloque =
            1000;


        for (
            let inicio = 0;
            inicio < ventas.length;
            inicio += tamanoBloque
        ) {

            const bloque =
                ventas.slice(
                    inicio,
                    inicio +
                    tamanoBloque
                );


            const valores = [];

            const parametros = [];

            let posicion = 1;


            bloque.forEach(
                function(venta) {

                    valores.push(
                        `(
                            $${posicion},
                            $${posicion + 1},
                            $${posicion + 2}
                        )`
                    );


                    parametros.push(
                        venta.boleta,
                        venta.fecha_hora,
                        venta.total
                    );


                    posicion += 3;

                }
            );


            const resultado =
                await cliente.query(
                    `
                    INSERT INTO base_datos.ventas
                    (
                        boleta,
                        fecha_hora,
                        total
                    )
                    VALUES
                    ${valores.join(',')}

                    ON CONFLICT (boleta)
                    DO NOTHING

                    RETURNING
                        id_venta,
                        boleta
                    `,
                    parametros
                );


            resultado.rows.forEach(
                function(fila) {

                    mapaIds.set(
                        fila.boleta,
                        fila.id_venta
                    );

                }
            );

        }


        return mapaIds;

    };


// FUNCION 8 INSERTAR DETALLES EN BLOQUES

const insertarDetallesEnBloques =
    async (
        cliente,
        detalles
    ) => {

        const tamanoBloque =
            1000;


        let detallesImportados =
            0;


        for (
            let inicio = 0;
            inicio < detalles.length;
            inicio += tamanoBloque
        ) {

            const bloque =
                detalles.slice(
                    inicio,
                    inicio +
                    tamanoBloque
                );


            const valores = [];

            const parametros = [];

            let posicion = 1;


            bloque.forEach(
                function(detalle) {

                    valores.push(
                        `(
                            $${posicion},
                            $${posicion + 1},
                            $${posicion + 2},
                            $${posicion + 3},
                            $${posicion + 4}
                        )`
                    );


                    parametros.push(
                        detalle.id_venta,
                        detalle.codigo,
                        detalle.precio,
                        detalle.cantidad,
                        detalle.valorizado
                    );


                    posicion += 5;

                }
            );


            const resultado =
                await cliente.query(
                    `
                    INSERT INTO base_datos.detalle_venta
                    (
                        id_venta,
                        codigo,
                        precio,
                        cantidad,
                        valorizado
                    )
                    VALUES
                    ${valores.join(',')}
                    `,
                    parametros
                );


            detallesImportados +=
                resultado.rowCount;

        }


        return detallesImportados;

    };


// FUNCION 9 IMPORTAR VENTAS

const importarVentas =
    async (archivo) => {

        if (!archivo) {

            throw new Error(
                'No se ha seleccionado ningún archivo'
            );

        }


        if (
            !archivo.originalname
                .toLowerCase()
                .endsWith('.csv')
        ) {

            throw new Error(
                'El archivo debe estar en formato CSV'
            );

        }


        // lee el archivo utilizando la codificacion del archivo de DimaSoft
        const contenido =
            archivo.buffer.toString(
                'latin1'
            );


        // realiza una primera lectura del archivo CSV
        const filasIniciales =
            parse(
                contenido,
                {
                    bom: true,
                    relax_quotes: true,
                    relax_column_count: true,
                    skip_empty_lines: true
                }
            );


        // arreglo para guardar las filas correctamente separadas
        const filas = [];


        // revisa cada fila obtenida
        filasIniciales.forEach(
            function(fila) {

                /*
                    algunos archivos exportados o guardados nuevamente
                    pueden contener toda la fila dentro de una sola columna
                */
                if (
                    fila.length === 1 &&
                    typeof fila[0] === 'string' &&
                    fila[0].includes(',')
                ) {

                    // vuelve a interpretar el contenido de esa fila
                    const filaSeparada =
                        parse(
                            fila[0],
                            {
                                relax_quotes: true,
                                relax_column_count: true,
                                skip_empty_lines: true
                            }
                        );


                    if (
                        filaSeparada.length > 0
                    ) {

                        filas.push(
                            filaSeparada[0]
                        );

                    }


                    return;

                }


                // si la fila ya viene correctamente separada, se utiliza directamente
                filas.push(
                    fila
                );

            }
        );


        if (!filas.length) {

            throw new Error(
                'El archivo CSV está vacío'
            );

        }


        // obtiene todos los productos
        const resultadoProductos =
            await pool.query(
                `
                SELECT
                    codigo,
                    cod_barra
                FROM base_datos.productos
                `
            );


        // permite buscar un producto tanto por
        // codigo como por codigo de barras
        const mapaProductos =
            new Map();


        resultadoProductos.rows.forEach(
            function(producto) {

                if (producto.codigo) {

                    mapaProductos.set(
                        String(
                            producto.codigo
                        ).trim(),
                        producto.codigo
                    );

                }


                if (producto.cod_barra) {

                    const codigoBarra =
                        String(
                            producto.cod_barra
                        ).trim();


                    if (
                        !mapaProductos.has(
                            codigoBarra
                        )
                    ) {

                        mapaProductos.set(
                            codigoBarra,
                            producto.codigo
                        );

                    }

                }

            }
        );


        const ventasAgrupadas =
            new Map();


        let filasIgnoradas = 0;

        let detallesSinProducto = 0;

        let operacionesNegativas = 0;


        // guarda información para revisar problemas
        const productosNoEncontrados = [];

        const filasIgnoradasDetalle = [];


        for (
            let indice = 0;
            indice < filas.length;
            indice++
        ) {

            const fila =
                filas[indice];


            /*
                ESTRUCTURA UTIL DEL CSV DIMASOFT

                14 = boleta
                16 = hora
                19 = fecha
                20 = codigo
                22 = precio
                23 = precio con descuento
                24 = cantidad
                26 = total de la linea
                28 = total acumulado de la boleta
            */


            if (
                !fila ||
                fila.length < 29
            ) {

                filasIgnoradas++;

                continue;

            }


            const boleta =
                obtenerNumeroBoleta(
                    fila[14]
                );


            const fechaHora =
                convertirFechaHora(
                    fila[19],
                    fila[16]
                );


            const codigoArchivo =
                String(
                    fila[20] || ''
                ).trim();


            const cantidad =
                convertirNumeroChileno(
                    fila[24]
                );


            let precio =
                convertirNumeroChileno(
                    fila[23]
                );


            // si no existe precio con descuento,
            // utiliza el precio normal
            if (
                !Number.isFinite(
                    precio
                )
            ) {

                precio =
                    convertirNumeroChileno(
                        fila[22]
                    );

            }


            const valorizado =
                convertirNumeroChileno(
                    fila[26]
                );


            const totalBoleta =
                convertirNumeroChileno(
                    fila[28]
                );


                if (
                    !boleta ||
                    !fechaHora ||
                    !codigoArchivo ||
                    !Number.isFinite(cantidad) ||
                    cantidad === 0 ||
                    !Number.isFinite(precio) ||
                    precio < 0 ||
                    !Number.isFinite(valorizado)
                ) {

                filasIgnoradas++;

                const erroresFila = [];


                if (!boleta) {

                    erroresFila.push('boleta');

                }


                if (!fechaHora) {

                    erroresFila.push('fecha_hora');

                }


                if (!codigoArchivo) {

                    erroresFila.push('codigo');

                }


                if (
                    !Number.isFinite(cantidad) ||
                    cantidad === 0
                ) {

                    erroresFila.push('cantidad');

                }


                if (
                    !Number.isFinite(precio) ||
                    precio < 0
                ) {

                    erroresFila.push('precio');

                }


                if (
                    !Number.isFinite(valorizado)
                ) {

                    erroresFila.push('valorizado');

                }


                filasIgnoradasDetalle.push(
                    {
                        fila:
                            indice + 1,

                        errores:
                            erroresFila,

                        boleta:
                            fila[14] || '',

                        hora:
                            fila[16] || '',

                        fecha:
                            fila[19] || '',

                        codigo:
                            fila[20] || '',

                        descripcion:
                            fila[21] || '',

                        precio:
                            fila[22] || '',

                        precio_descuento:
                            fila[23] || '',

                        cantidad:
                            fila[24] || '',

                        total:
                            fila[26] || ''
                    }
                );


                continue;
            }

            // cuenta las operaciones que vienen con valores negativos
            if (
                cantidad < 0 ||
                valorizado < 0
            ) {

                operacionesNegativas++;

            }


            // crea la boleta en memoria si todavía no existe
            if (
                !ventasAgrupadas.has(
                    boleta
                )
            ) {

                ventasAgrupadas.set(
                    boleta,
                    {
                        boleta: boleta,
                        fecha_hora: fechaHora,
                        total: Number.isFinite(
                            totalBoleta
                        )
                            ? totalBoleta
                            : 0,
                        detalles: []
                    }
                );

            }


            const venta =
                ventasAgrupadas.get(
                    boleta
                );


            // actualiza fecha y total con la última línea
            venta.fecha_hora =
                fechaHora;


            if (
                Number.isFinite(
                    totalBoleta
                )
            ) {

                venta.total =
                    totalBoleta;

            }


            // busca el producto registrado en TresStock
            const codigoProducto =
                mapaProductos.get(
                    codigoArchivo
                );


            if (!codigoProducto) {

                detallesSinProducto++;


                productosNoEncontrados.push(
                    {
                        fila:
                            indice + 1,

                        codigo:
                            codigoArchivo,

                        descripcion:
                            String(
                                fila[21] || ''
                            ).trim(),

                        boleta:
                            boleta
                    }
                );


                continue;

            }


            venta.detalles.push(
                {
                    codigo:
                        codigoProducto,

                    precio:
                        precio,

                    cantidad:
                        cantidad,

                    valorizado:
                        valorizado
                }
            );

        }


        // obtiene las boletas que ya existen
        const resultadoExistentes =
            await pool.query(
                `
                SELECT boleta
                FROM base_datos.ventas
                `
            );


        const boletasExistentes =
            new Set(
                resultadoExistentes.rows.map(
                    function(fila) {

                        return fila.boleta;

                    }
                )
            );


        let cantidadBoletasExistentes =
            0;


        const ventasNuevas = [];


        ventasAgrupadas.forEach(
            function(venta) {

                // no guarda ventas sin detalles conocidos
                if (
                    venta.detalles.length === 0
                ) {

                    return;

                }


                if (
                    boletasExistentes.has(
                        venta.boleta
                    )
                ) {

                    cantidadBoletasExistentes++;

                    return;

                }


                ventasNuevas.push(
                    venta
                );

            }
        );


        const cliente =
            await pool.connect();


        let detallesImportados =
            0;

        let mapaIdsVentas =
            new Map();


        try {

            await cliente.query(
                'BEGIN'
            );


            mapaIdsVentas =
                await insertarVentasEnBloques(
                    cliente,
                    ventasNuevas
                );


            const detallesInsertar =
                [];


            ventasNuevas.forEach(
                function(venta) {

                    const idVenta =
                        mapaIdsVentas.get(
                            venta.boleta
                        );


                    if (!idVenta) {

                        return;

                    }


                    venta.detalles.forEach(
                        function(detalle) {

                            detallesInsertar.push(
                                {
                                    id_venta:
                                        idVenta,

                                    codigo:
                                        detalle.codigo,

                                    precio:
                                        detalle.precio,

                                    cantidad:
                                        detalle.cantidad,

                                    valorizado:
                                        detalle.valorizado
                                }
                            );

                        }
                    );

                }
            );


            detallesImportados =
                await insertarDetallesEnBloques(
                    cliente,
                    detallesInsertar
                );


            await cliente.query(
                'COMMIT'
            );


        } catch (error) {

            await cliente.query(
                'ROLLBACK'
            );


            throw error;


        } finally {

            cliente.release();

        }


        return {

            mensaje:
                'Importacion de ventas completada',

            resumen: {

                total_filas:
                    filas.length,

                boletas_importadas:
                    mapaIdsVentas.size,

                detalles_importados:
                    detallesImportados,

                boletas_existentes:
                    cantidadBoletasExistentes,

                detalles_sin_producto:
                    detallesSinProducto,

                filas_ignoradas:
                    filasIgnoradas,

                operaciones_negativas:
                    operacionesNegativas

            },

            productos_no_encontrados:
                productosNoEncontrados,

            filas_ignoradas_detalle:
                filasIgnoradasDetalle

        };

    };


// exporta las funciones
module.exports = {
    obtenerVentas,
    obtenerResumenVentas,
    obtenerDetalleVenta,
    importarVentas
};