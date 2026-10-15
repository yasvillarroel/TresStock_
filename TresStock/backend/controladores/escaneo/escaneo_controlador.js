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


// GET /api/escaner/productos-asociar?busqueda=
// busca productos existentes para asociarles un codigo
const buscarProductosParaAsociar = async (req, res) => {

    try {

        const busqueda = String(req.query.busqueda || '').trim();

        if (!busqueda) {
            return res.json({
                productos: []
            });
        }

        if (busqueda.length > 255) {
            return res.status(400).json({
                mensaje: 'El término de búsqueda no es válido'
            });
        }

        const productos = await servicioEscaner.buscarProductosParaAsociar(busqueda);

        return res.json({
            productos: productos
        });

    } catch (error) {

        console.error('Error al buscar productos para asociar:', error);

        return res.status(500).json({
            mensaje: 'Error al buscar productos'
        });

    }

};


// POST /api/escaner/asociar-codigo
// asocia el codigo escaneado a un producto existente
const asociarCodigoProducto = async (req, res) => {

    try {

        const codigoProducto = String(req.body.codigo_producto || '').trim();
        const codigoBarras = String(req.body.codigo_barras || '').trim();
        const tipoFormato = String(req.body.tipo_formato || '').trim();
        const cantidadUnidades = req.body.cantidad_unidades ?? 1;

        if (!codigoProducto || codigoProducto.length > 50) {
            return res.status(400).json({
                mensaje: 'El código del producto no es válido'
            });
        }

        if (!codigoBarras || codigoBarras.length > 50) {
            return res.status(400).json({
                mensaje: 'El código de barras no es válido'
            });
        }

        if (!tipoFormato || tipoFormato.length > 50) {
            return res.status(400).json({
                mensaje: 'El tipo de formato no es válido'
            });
        }

        const cantidad = Number(cantidadUnidades);

        if (!Number.isFinite(cantidad) || cantidad <= 0) {
            return res.status(400).json({
                mensaje: 'La cantidad de unidades debe ser mayor que cero'
            });
        }

        const asociacion = await servicioEscaner.asociarCodigoProducto(
            codigoProducto,
            codigoBarras,
            tipoFormato,
            cantidad
        );

        return res.status(201).json({
            mensaje: 'Código asociado correctamente',
            asociacion: asociacion
        });

    } catch (error) {

        if (error.codigo === 'CODIGO_DUPLICADO') {
            return res.status(409).json({
                mensaje: error.message
            });
        }

        if (error.codigo === 'PRODUCTO_NO_ENCONTRADO') {
            return res.status(404).json({
                mensaje: 'El producto seleccionado no existe'
            });
        }

        console.error('Error al asociar código al producto:', error);

        return res.status(500).json({
            mensaje: 'Error al asociar el código al producto'
        });

    }

};
 
// exporta las funciones
module.exports = {
    buscarProducto,
    buscarProductosParaAsociar,
    asociarCodigoProducto
};