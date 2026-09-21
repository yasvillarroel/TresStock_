// importa el servicio de proveedores
const proveedoresServicio = require('../../servicios/proveedores/proveedores_servicio');


// FUNCION 1 CREAR PROVEEDOR
const crearProveedor = async (req, res) => {

    try {

        // obtiene los datos del proveedor
        const {
            nombre_comercial,
            razon_social,
            rut,
            telefono,
            email,
            direccion
        } = req.body;


        // verifica el nombre comercial
        if (!nombre_comercial) {

            return res.status(400).json({
                mensaje: 'El nombre comercial es obligatorio'
            });

        }


        // crea el proveedor
        const proveedor = await proveedoresServicio.crearProveedor(
            nombre_comercial,
            razon_social,
            rut,
            telefono,
            email,
            direccion
        );


        // envia el proveedor creado
        res.status(201).json(proveedor);


    } catch (error) {

        // muestra el error en la consola
        console.error(
            'Error al crear proveedor:',
            error
        );


        // verifica si el RUT ya existe
        if (error.code === '23505') {

            return res.status(409).json({
                mensaje: 'Ya existe un proveedor con ese RUT'
            });

        }


        // envia el error
        res.status(500).json({
            mensaje: 'Error al crear proveedor'
        });

    }

};


// FUNCION 2 OBTENER TODOS LOS PROVEEDORES
const obtenerProveedores = async (req, res) => {

    try {

        // obtiene los proveedores
        const proveedores = await proveedoresServicio.obtenerProveedores();


        // envia los proveedores
        res.json(proveedores);


    } catch (error) {

        // muestra el error en la consola
        console.error(
            'Error al obtener proveedores:',
            error
        );


        // envia el error
        res.status(500).json({
            mensaje: 'Error al obtener proveedores'
        });

    }

};


// FUNCION 3 OBTENER PROVEEDOR POR ID
const obtenerProveedor = async (req, res) => {

    try {

        // obtiene el id del proveedor
        const { id } = req.params;


        // obtiene el proveedor
        const proveedor = await proveedoresServicio.obtenerProveedor(id);


        // verifica si existe
        if (!proveedor) {

            return res.status(404).json({
                mensaje: 'Proveedor no encontrado'
            });

        }


        // envia el proveedor
        res.json(proveedor);


    } catch (error) {

        // muestra el error en la consola
        console.error(
            'Error al obtener proveedor:',
            error
        );


        // envia el error
        res.status(500).json({
            mensaje: 'Error al obtener proveedor'
        });

    }

};


// FUNCION 4 ACTUALIZAR PROVEEDOR
const actualizarProveedor = async (req, res) => {

    try {

        // obtiene el id del proveedor
        const { id } = req.params;


        // obtiene los datos del proveedor
        const {
            nombre_comercial,
            razon_social,
            rut,
            telefono,
            email,
            direccion
        } = req.body;


        // verifica el nombre comercial
        if (!nombre_comercial) {

            return res.status(400).json({
                mensaje: 'El nombre comercial es obligatorio'
            });

        }


        // actualiza el proveedor
        const proveedor = await proveedoresServicio.actualizarProveedor(
            id,
            nombre_comercial,
            razon_social,
            rut,
            telefono,
            email,
            direccion
        );


        // verifica si existe
        if (!proveedor) {

            return res.status(404).json({
                mensaje: 'Proveedor no encontrado'
            });

        }


        // envia el proveedor actualizado
        res.json(proveedor);


    } catch (error) {

        // muestra el error en la consola
        console.error(
            'Error al actualizar proveedor:',
            error
        );


        // verifica si el RUT ya existe
        if (error.code === '23505') {

            return res.status(409).json({
                mensaje: 'Ya existe un proveedor con ese RUT'
            });

        }


        // envia el error
        res.status(500).json({
            mensaje: 'Error al actualizar proveedor'
        });

    }

};


// FUNCION 5 ELIMINAR PROVEEDOR
const eliminarProveedor = async (req, res) => {

    try {

        // obtiene el id del proveedor
        const { id } = req.params;


        // elimina el proveedor
        const proveedor = await proveedoresServicio.eliminarProveedor(id);


        // verifica si existe
        if (!proveedor) {

            return res.status(404).json({
                mensaje: 'Proveedor no encontrado'
            });

        }


        // envia el proveedor eliminado
        res.json(proveedor);


    } catch (error) {

        // muestra el error en la consola
        console.error(
            'Error al eliminar proveedor:',
            error
        );


        // envia el error
        res.status(500).json({
            mensaje: 'Error al eliminar proveedor'
        });

    }

};


// exporta las funciones
module.exports = {
    crearProveedor,
    obtenerProveedores,
    obtenerProveedor,
    actualizarProveedor,
    eliminarProveedor
};