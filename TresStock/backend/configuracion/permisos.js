// define los permisos de cada rol
const permisos = {

    Administrador: {
        usuarios: ['ver', 'crear', 'editar', 'eliminar'],
        productos: ['ver', 'crear', 'editar', 'eliminar'],
        inventario: ['ver', 'crear', 'editar', 'eliminar'],
        ventas: ['ver'],
        proveedores: ['ver', 'crear', 'editar', 'eliminar']
    },

    Usuario: {
        usuarios: [],
        productos: ['ver'],
        inventario: ['ver', 'editar'],
        ventas: ['ver'],
        proveedores: ['ver']
    }

};

module.exports = permisos;