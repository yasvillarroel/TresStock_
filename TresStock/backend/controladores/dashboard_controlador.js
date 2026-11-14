const dashboardServicio = require('../servicios/dashboard_servicio');

const obtenerResumen = async (req, res) => {
    try {
        return res.json(await dashboardServicio.obtenerResumenDashboard());
    } catch (error) {
        console.error('Error al obtener resumen del dashboard:', error);
        return res.status(500).json({ mensaje: 'No se pudo obtener el resumen del dashboard' });
    }
};

const obtenerProductosMasVendidos = async (req, res) => {
    try {
        const periodo = ['todo', 'mes', 'tres_meses'].includes(req.query.periodo)
            ? req.query.periodo
            : 'todo';
        return res.json(await dashboardServicio.obtenerProductosMasVendidos(periodo));
    } catch (error) {
        console.error('Error al obtener los productos más vendidos:', error);
        return res.status(500).json({ mensaje: 'No se pudieron obtener los productos más vendidos' });
    }
};

const obtenerProductosExcluidosRanking = async (req, res) => {
    try {
        return res.json(await dashboardServicio.obtenerProductosExcluidosRanking());
    } catch (error) {
        console.error('Error al obtener productos excluidos del ranking:', error);
        return res.status(500).json({ mensaje: 'No se pudo obtener la lista de productos excluidos' });
    }
};

const excluirProductoRanking = async (req, res) => {
    try {
        const codigo = String(req.params.codigo || '').trim();
        if (!codigo) return res.status(400).json({ mensaje: 'El código del producto es obligatorio' });

        const excluido = await dashboardServicio.excluirProductoRanking(
            codigo,
            req.usuario?.email
        );

        if (!excluido) return res.status(404).json({ mensaje: 'No se encontró el producto' });
        return res.status(200).json({ mensaje: 'Producto agregado a la lista de exclusión' });
    } catch (error) {
        console.error('Error al excluir producto del ranking:', error);
        return res.status(500).json({ mensaje: 'No se pudo excluir el producto del ranking' });
    }
};

const restaurarProductoRanking = async (req, res) => {
    try {
        const codigo = String(req.params.codigo || '').trim();
        if (!codigo) return res.status(400).json({ mensaje: 'El código del producto es obligatorio' });

        const restaurado = await dashboardServicio.restaurarProductoRanking(codigo);
        if (!restaurado) return res.status(404).json({ mensaje: 'El producto no está en la lista de exclusión' });
        return res.json({ mensaje: 'Producto restaurado en el ranking' });
    } catch (error) {
        console.error('Error al restaurar producto del ranking:', error);
        return res.status(500).json({ mensaje: 'No se pudo restaurar el producto en el ranking' });
    }
};

module.exports = {
    obtenerResumen,
    obtenerProductosMasVendidos,
    obtenerProductosExcluidosRanking,
    excluirProductoRanking,
    restaurarProductoRanking
};
