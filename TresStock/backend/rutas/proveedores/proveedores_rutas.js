// importa express
const express = require('express');


// importa el controlador de proveedores
const proveedoresControlador = require('../../controladores/proveedores/proveedores_controlador');


// crea el router de proveedores
const router = express.Router();


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


// ruta para eliminar un proveedor
router.delete(
    '/:id',
    proveedoresControlador.eliminarProveedor
);


// exporta el router
module.exports = router;