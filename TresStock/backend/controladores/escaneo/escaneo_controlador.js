// importa el servicio del escaner
const servicioEscaner = require('../../servicios/escaneo/escaneo_servicio');
 
 
// GET /api/escaner/producto/:codigo
const buscarProducto = async (req, res) => {
 
    try {
 
        const codigo = String(req.params.codigo || '').trim();
 
        if (!codigo) {
 
            return res.status(400).json({
                mensaje: 'Debe indicar el código escaneado'
            });
 
        }
 
        // la columna es VARCHAR(50)
        if (codigo.length > 50) {
 
            return res.status(400).json({
                mensaje: 'El código escaneado no es válido'
            });
 
        }
 
        const producto = await servicioEscaner.buscarProductoPorCodigo(codigo);
 
        if (!producto) {
 
            return res.status(404).json({
                mensaje: 'No se encontró un producto con ese código',
                codigo: codigo
            });
 
        }
 
        return res.json({
            producto: producto
        });
 
    } catch (error) {
 
        console.error('Error al buscar producto escaneado:', error);
 
        return res.status(500).json({
            mensaje: 'Error al buscar el producto'
        });
 
    }
 
};
 
 
// exporta las funciones
module.exports = {
    buscarProducto
};
 
