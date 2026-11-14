// importa el servicio de ventas
const ventasServicio = require(
    '../servicios/ventas_servicio'
);


// FUNCION 1 OBTENER VENTAS

const obtenerVentas =
    async (req, res) => {

        try {

            let pagina =
                Number(
                    req.query.pagina || 1
                );


            let limite =
                Number(
                    req.query.limite || 120
                );


            if (
                !Number.isInteger(pagina) ||
                pagina < 1
            ) {

                pagina = 1;

            }


            if (
                !Number.isInteger(limite) ||
                limite < 1 ||
                limite > 120
            ) {

                limite = 120;

            }


            const buscar =
                String(
                    req.query.buscar || ''
                ).trim();


            const desde =
                String(
                    req.query.desde || ''
                ).trim();


            const hasta =
                String(
                    req.query.hasta || ''
                ).trim();


            // recibe el orden solicitado; solo admite los criterios definidos
            const ordenSolicitado = String(req.query.ordenar || 'recientes').trim();
            const ordenar = ['recientes', 'monto_mayor', 'monto_menor']
                .includes(ordenSolicitado)
                    ? ordenSolicitado
                    : 'recientes';


            const resultado =
                await ventasServicio.obtenerVentas(
                    pagina,
                    limite,
                    buscar,
                    desde,
                    hasta,
                    ordenar
                );


            res.json(
                resultado
            );


        } catch (error) {

            console.error(
                'Error al obtener ventas:',
                error
            );


            res.status(500).json(
                {
                    mensaje:
                        'Error al obtener ventas'
                }
            );

        }

    };


// FUNCION 2 OBTENER RESUMEN

const obtenerResumenVentas =
    async (req, res) => {

        try {

            const resultado =
                await ventasServicio
                    .obtenerResumenVentas();


            res.json(
                resultado
            );


        } catch (error) {

            console.error(
                'Error al obtener resumen de ventas:',
                error
            );


            res.status(500).json(
                {
                    mensaje:
                        'Error al obtener resumen de ventas'
                }
            );

        }

    };


// FUNCION 3 OBTENER DETALLE

const obtenerDetalleVenta =
    async (req, res) => {

        try {

            const idVenta =
                Number(
                    req.params.id
                );


            if (
                !Number.isInteger(idVenta) ||
                idVenta <= 0
            ) {

                return res.status(400).json(
                    {
                        mensaje:
                            'El identificador de la venta no es válido'
                    }
                );

            }


            const resultado =
                await ventasServicio
                    .obtenerDetalleVenta(
                        idVenta
                    );


            if (!resultado) {

                return res.status(404).json(
                    {
                        mensaje:
                            'La venta no existe'
                    }
                );

            }


            res.json(
                resultado
            );


        } catch (error) {

            console.error(
                'Error al obtener detalle de venta:',
                error
            );


            res.status(500).json(
                {
                    mensaje:
                        'Error al obtener detalle de venta'
                }
            );

        }

    };


// FUNCION 4 IMPORTAR VENTAS

const importarVentas =
    async (req, res) => {

        try {

            if (!req.file) {

                return res.status(400).json(
                    {
                        mensaje:
                            'No se ha seleccionado ningún archivo'
                    }
                );

            }


            const resultado =
                await ventasServicio.importarVentas(
                    req.file,
                    Number(req.usuario?.id),
                    String(req.body.modalidad_importacion || '').trim()
                );


            res.json(
                resultado
            );


        } catch (error) {

            console.error(
                'Error al importar ventas:',
                error
            );


            res.status([400, 401, 409].includes(error.status) ? error.status : 400).json(
                { mensaje: error.message }
            );

        }

    };


// FUNCION 5 CONSULTAR CONFIGURACION DE INVENTARIO
const obtenerConfiguracionInventario = async (req, res) => {
    try {
        return res.json(await ventasServicio.obtenerConfiguracionInventario());
    } catch (error) {
        console.error('Error al consultar configuracion de inventario:', error);
        return res.status(500).json({ mensaje: error.message });
    }
};

// FUNCION 6 ESTABLECER INICIO DE CONTROL DE STOCK
const configurarInicioInventario = async (req, res) => {
    try {
        if (req.body?.confirmar_stock_inicial !== 'SI') {
            return res.status(400).json({
                mensaje: 'Debes confirmar que estableciste el stock al cierre del día anterior.'
            });
        }
        const fecha = String(req.body?.fecha_inicio_descuento || '').trim();
        const resultado = await ventasServicio.configurarInicioInventario(
            fecha, Number(req.usuario?.id)
        );
        return res.json({ mensaje: 'Fecha de inicio configurada correctamente', ...resultado });
    } catch (error) {
        if (![400, 401, 409].includes(error.status)) {
            console.error('Error al configurar inicio de inventario:', error);
        }
        return res.status([400, 401, 409].includes(error.status) ? error.status : 500).json({
            mensaje: error.status ? error.message : 'No se pudo configurar el inicio de inventario.'
        });
    }
};

// exporta las funciones
module.exports = {
    obtenerVentas,
    obtenerResumenVentas,
    obtenerDetalleVenta,
    importarVentas,
    obtenerConfiguracionInventario,
    configurarInicioInventario
};
