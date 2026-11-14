// importa express
const express = require('express');


// importa el controlador de proveedores
const proveedoresControlador = require('../controladores/proveedores_controlador');


// crea el router de proveedores
const router = express.Router();

const { autorizar } = require('../middleware/autenticacion');
router.use(autorizar('proveedores', 'acceder'));


// ruta para crear un proveedor
router.post(
    '/',
    proveedoresControlador.crearProveedor
);


// ruta para obtener todos los proveedores
router.get(
    '/',
    proveedoresControlador.obtenerProveedores
);


// ruta para obtener los indicadores de proveedores
router.get(
    '/resumen',
    proveedoresControlador.obtenerResumenProveedores
);


// ruta para obtener un proveedor por id
router.get(
    '/:id',
    proveedoresControlador.obtenerProveedor
);


// ruta para actualizar un proveedor
router.put(
    '/:id',
    proveedoresControlador.actualizarProveedor
);


// cambia el estado del proveedor sin borrar sus asociaciones
router.patch('/:id/estado', proveedoresControlador.cambiarEstadoProveedor);

// evita que clientes antiguos puedan eliminar proveedores definitivamente
router.delete('/:id', (req, res) => {
    res.setHeader('Allow', 'GET, PUT, PATCH');
    return res.status(405).json({
        mensaje: 'No se permite eliminar proveedores. Utiliza activar o desactivar.'
    });
});


// exporta el router
module.exports = router;
