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


// FUNCION 4 RECALCULAR STOCK MINIMO

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
// FUNCION 5 AJUSTAR INVENTARIO
const ajustarInventario = async (req, res) => {

    try {

        // obtiene el codigo del producto
        const { codigo, operacion } = req.body;

        // obtiene la cantidad a ajustar
        const cantidad = Number(
            req.body.cantidad
        );

        // verifica el codigo del producto
        if (
            typeof codigo !== 'string' ||
            codigo.trim() === ''
        ) {

            return res.status(400).json({
                mensaje: 'El código del producto es obligatorio'
            });

        }

        // verifica la cantidad a ajustar
        if (
            !Number.isSafeInteger(cantidad) ||
            cantidad < 1
        ) {

            return res.status(400).json({
                mensaje: 'La cantidad debe ser un entero mayor que 0'
            });

        }

        // verifica la operacion del ajuste
        if (
            !['sumar', 'restar'].includes(operacion)
        ) {

            return res.status(400).json({
                mensaje: 'La operación debe ser sumar o restar'
            });

        }

        // ajusta el inventario segun la operacion seleccionada
        const inventario =
            await inventarioServicio.ajustarInventario(
                codigo.trim(),
                cantidad,
                operacion
            );

        // envia el resultado del ajuste
        return res.json({
            mensaje: 'Inventario actualizado correctamente',
            inventario
        });

    } catch (error) {

        // verifica si el producto no existe
        if (error.status === 404) {

            return res.status(404).json({
                mensaje: error.message
            });

        }

        // verifica si no existe inventario suficiente para restar
        if (error.status === 400) {

            return res.status(400).json({
                mensaje: error.message
            });

        }

        // muestra el error en la consola
        console.error(
            'Error al ajustar inventario:',
            error
        );

        // envia el error
        return res.status(500).json({
            mensaje: 'Error al ajustar inventario'
        });

    }

};


// exporta las funciones
module.exports = {
    obtenerInventario,
    obtenerResumenInventario,
    obtenerFamilias,
    recalcularStockMinimo,
    ajustarInventario
};