const alertasServicio = require('../../servicios/alertas/alertas_servicio');

const obtenerLotesVencimiento = async (req, res) => {
    try {
        const estado = ['activos', 'inactivos'].includes(req.query.estado)
            ? req.query.estado
            : 'activos';
        const resultado = await alertasServicio.obtenerLotesVencimiento(estado, req.query.pagina, {
            busqueda: req.query.busqueda,
            estado: req.query.filtro_estado,
            orden: req.query.orden,
            fecha_desde: req.query.fecha_desde,
            fecha_hasta: req.query.fecha_hasta
        });
        return res.json(resultado);
    } catch (error) {
        console.error('Error al obtener lotes de vencimiento:', error);
        return res.status(500).json({mensaje: 'No se pudo cargar la lista de vencimientos'});
    }
};

const obtenerAlertasVencimiento = async (req, res) => {
    try {
        const alertas = await alertasServicio.obtenerAlertasVencimiento();
        return res.json(alertas);
    } catch (error) {
        console.error('Error al obtener alertas de vencimiento:', error);
        return res.status(500).json({mensaje: 'No se pudieron cargar las alertas de vencimiento'});
    }
};

const actualizarFechaVencimiento = async (req, res) => {
    try {
        const idLote = Number(req.params.id);
        const fechaVencimiento = String(req.body.fecha_vencimiento || '').trim();
        const lote = await alertasServicio.actualizarFechaVencimiento(idLote, fechaVencimiento);
        return res.json({mensaje: 'Fecha de vencimiento actualizada.', lote});
    } catch (error) {
        if (error.status) return res.status(error.status).json({mensaje: error.message});
        console.error('Error al actualizar la fecha de vencimiento:', error);
        return res.status(500).json({mensaje: 'No se pudo actualizar la fecha de vencimiento.'});
    }
};

const darDeBajaLote = async (req, res) => {
    try {
        const idLote = Number(req.params.id);
        const estadoBaja = String(req.body.estado_baja || '').trim().toUpperCase();
        const motivoBaja = String(req.body.motivo_baja || '').trim();
        const cantidadMerma = estadoBaja === 'MERMA'
            ? Number(String(req.body.cantidad_merma || '').replace(',', '.'))
            : null;
        const descontarStock = req.body.descontar_stock;
        const idUsuario = Number(req.usuario?.id);
        const resultado = await alertasServicio.darDeBajaLote(
            idLote,
            estadoBaja,
            motivoBaja,
            cantidadMerma,
            descontarStock,
            idUsuario
        );
        let mensaje = 'Lote archivado en la pestaña Inactivos.';
        if (estadoBaja === 'MERMA') {
            mensaje = resultado.lote.activo
                ? 'Merma registrada. El lote restante sigue activo y la cantidad afectada pasó a Inactivos.'
                : 'Merma registrada y el lote completo pasó a Inactivos.';
            mensaje += descontarStock
                ? ' La cantidad perdida se descontó del stock general.'
                : ' El stock general no cambió.';
        }
        return res.json({...resultado, mensaje});
    } catch (error) {
        if (error.status) return res.status(error.status).json({mensaje: error.message});
        console.error('Error al archivar el lote de vencimiento:', error);
        return res.status(500).json({mensaje: 'No se pudo archivar el lote.'});
    }
};

module.exports = { obtenerLotesVencimiento, obtenerAlertasVencimiento, actualizarFechaVencimiento, darDeBajaLote };
