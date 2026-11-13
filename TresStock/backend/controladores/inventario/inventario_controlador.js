// importa el servicio de inventario
const inventarioServicio =
    require('../../servicios/inventario/inventario_servicio');
const { obtenerFechaActualChile } = require('../../utilidades/fechas');


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

// entrega la serie diaria usada para explicar el pronóstico de un producto
const obtenerVentasDiariasPronostico = async (req, res) => {
    const codigo = String(req.params.codigo || '').trim();
    if (!codigo || codigo.length > 50) {
        return res.status(400).json({ mensaje: 'El código del producto no es válido.' });
    }

    try {
        const dias = await inventarioServicio.obtenerVentasDiariasPronostico(codigo);
        return res.json({ codigo, dias });
    } catch (error) {
        console.error('Error al obtener las ventas diarias del pronóstico:', error);
        return res.status(500).json({ mensaje: 'No se pudieron cargar las ventas por día.' });
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
// FUNCION 5 OBTENER HISTORIAL DE MOVIMIENTOS
const obtenerMovimientosInventario = async (req, res) => {

    try {
        const resultado = await inventarioServicio.obtenerMovimientosInventario({
            codigo: req.query.codigo,
            tipo: req.query.tipo,
            buscar: req.query.buscar,
            desde: req.query.desde,
            hasta: req.query.hasta,
            orden: req.query.orden,
            pagina: req.query.pagina,
            limite: req.query.limite
        });

        return res.json(resultado);
    } catch (error) {
        console.error('Error al obtener movimientos de inventario:', error);
        return res.status(500).json({
            mensaje: 'No se pudo obtener el historial de inventario'
        });
    }
};


// FUNCION 6 AJUSTAR INVENTARIO
const ajustarInventario = async (req, res) => {

    try {
        const codigo = String(req.body.codigo || '').trim();
        const operacion = String(req.body.operacion || '').trim();
        const cantidad = Number(req.body.cantidad);
        const motivo = String(req.body.motivo || '').trim();
        const fechaVencimiento = String(req.body.fecha_vencimiento || '').trim() || null;

        if (!codigo || codigo.length > 50) {
            return res.status(400).json({mensaje: 'El código del producto no es válido'});
        }
        if (!['sumar', 'restar', 'fijar'].includes(operacion)) {
            return res.status(400).json({mensaje: 'La operación debe ser sumar, restar o fijar'});
        }
        if (!Number.isFinite(cantidad) || cantidad > 99999999.9999 ||
            (operacion === 'fijar' ? cantidad < 0 : cantidad <= 0) ||
            Math.abs(cantidad - Math.round(cantidad * 10000) / 10000) >= 1e-9) {
            return res.status(400).json({
                mensaje: 'Ingresa una cantidad válida de hasta cuatro decimales'
            });
        }
        if (!motivo || motivo.length > 100) {
            return res.status(400).json({mensaje: 'Selecciona un motivo válido'});
        }
        if (fechaVencimiento) {
            const fechaParseada = new Date(`${fechaVencimiento}T00:00:00Z`);
            if (operacion !== 'sumar' || !/^\d{4}-\d{2}-\d{2}$/.test(fechaVencimiento) ||
                Number.isNaN(fechaParseada.getTime()) || fechaParseada.toISOString().slice(0, 10) !== fechaVencimiento ||
                fechaVencimiento < obtenerFechaActualChile()) {
                return res.status(400).json({mensaje: 'Indica una fecha válida para el lote. Debe ser hoy o posterior y solo aplica al sumar stock.'});
            }
        }

        const inventario = await inventarioServicio.ajustarInventario(
            codigo,
            cantidad,
            operacion,
            Number(req.usuario?.id),
            motivo,
            fechaVencimiento
        );

        return res.json({mensaje: 'Inventario actualizado correctamente', inventario});

    } catch (error) {
        if ([400, 401, 404].includes(error.status)) {
            return res.status(error.status).json({mensaje: error.message});
        }
        console.error('Error al ajustar inventario:', error);
        return res.status(500).json({mensaje: 'Error al ajustar inventario'});
    }
};


// exporta las funciones
module.exports = {
    obtenerInventario,
    obtenerVentasDiariasPronostico,
    obtenerResumenInventario,
    obtenerFamilias,
    recalcularStockMinimo,
    obtenerMovimientosInventario,
    ajustarInventario
};
