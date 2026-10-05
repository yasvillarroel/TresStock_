// importa el servicio de ventas
const ventasServicio = require(
    '../../servicios/ventas/ventas_servicio'
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
                    req.query.limite || 20
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
                limite > 100
            ) {

                limite = 20;

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


            const resultado =
                await ventasServicio.obtenerVentas(
                    pagina,
                    limite,
                    buscar,
                    desde,
                    hasta
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
                    req.file
                );


            res.json(
                resultado
            );


        } catch (error) {

            console.error(
                'Error al importar ventas:',
                error
            );


            res.status(400).json(
                {
                    mensaje:
                        error.message
                }
            );

        }

    };


// exporta las funciones
module.exports = {
    obtenerVentas,
    obtenerResumenVentas,
    obtenerDetalleVenta,
    importarVentas
};