// importa el servicio de inventario
const inventarioServicio =
    require('../../servicios/inventario/inventario_servicio');


// FUNCION 1 OBTENER INVENTARIO
const obtenerInventario = async (req, res) => {

    try {

        // obtiene el inventario
        const inventario =
            await inventarioServicio.obtenerInventario();


        // envia el inventario
        res.json(inventario);


    } catch (error) {

        // muestra el error en la consola
        console.error(
            'Error al obtener inventario:',
            error
        );


        // envia el error
        res.status(500).json({
            mensaje: 'Error al obtener inventario'
        });

    }

};


// FUNCION 2 OBTENER RESUMEN INVENTARIO
const obtenerResumenInventario = async (req, res) => {

    try {

        // obtiene los indicadores del inventario
        const resumen =
            await inventarioServicio.obtenerResumenInventario();


        // envia los indicadores
        res.json(resumen);


    } catch (error) {

        // muestra el error en la consola
        console.error(
            'Error al obtener resumen de inventario:',
            error
        );


        // envia el error
        res.status(500).json({
            mensaje: 'Error al obtener resumen de inventario'
        });

    }

};


// FUNCION 3 OBTENER FAMILIAS
const obtenerFamilias = async (req, res) => {

    try {

        // obtiene las familias
        const familias =
            await inventarioServicio.obtenerFamilias();


        // envia las familias
        res.json(familias);


    } catch (error) {

        // muestra el error en la consola
        console.error(
            'Error al obtener familias:',
            error
        );


        // envia el error
        res.status(500).json({
            mensaje: 'Error al obtener familias'
        });

    }

};


// FUNCION 4 ACTUALIZAR STOCK MINIMO
const actualizarStockMinimo = async (req, res) => {

    try {

        // obtiene el codigo del producto
        const { codigo } = req.params;


        // obtiene el stock minimo
        const {
            stock_minimo
        } = req.body;


        const stockMinimo =
            Number(stock_minimo);


        // verifica el stock minimo
        if (
            Number.isNaN(stockMinimo) ||
            stockMinimo < 0
        ) {

            return res.status(400).json({
                mensaje:
                    'El stock mínimo debe ser un valor igual o mayor a 0'
            });

        }


        // actualiza el stock minimo
        const inventario =
            await inventarioServicio.actualizarStockMinimo(
                codigo,
                stockMinimo
            );


        // envia el inventario actualizado
        res.json(inventario);


    } catch (error) {

        // muestra el error en la consola
        console.error(
            'Error al actualizar stock mínimo:',
            error
        );


        // verifica si el producto no existe
        if (error.code === '23503') {

            return res.status(404).json({
                mensaje: 'Producto no encontrado'
            });

        }


        // envia el error
        res.status(500).json({
            mensaje: 'Error al actualizar stock mínimo'
        });

    }

};

// FUNCION RECALCULAR STOCK MINIMO

const recalcularStockMinimo = async (req, res) => {

    try {

        const resultado =
            await inventarioServicio
                .recalcularStockMinimo();


        res.json(
            resultado
        );


    } catch (error) {

        console.error(
            'Error al recalcular stock mínimo:',
            error
        );


        res.status(500).json(
            {
                mensaje:
                    'No se pudo recalcular el stock mínimo'
            }
        );

    }

};


// exporta las funciones
module.exports = {
    obtenerInventario,
    obtenerResumenInventario,
    obtenerFamilias,
    actualizarStockMinimo,
    recalcularStockMinimo
};