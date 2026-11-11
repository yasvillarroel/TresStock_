const alertasServicio = require('../../servicios/alertas/alertas_servicio');

const obtenerLotesVencimiento = async (req, res) => {
    try {
        const estado = ['activos', 'inactivos'].includes(req.query.estado)
            ? req.query.estado
            : 'activos';
        const resultado = await alertasServicio.obtenerLotesVencimiento(estado, req.query.pagina);
        return res.json(resultado);
    } catch (error) {
        console.error('Error al obtener lotes de vencimiento:', error);
        return res.status(500).json({mensaje: 'No se pudo cargar la lista de vencimientos'});
    }
};

module.exports = { obtenerLotesVencimiento };
