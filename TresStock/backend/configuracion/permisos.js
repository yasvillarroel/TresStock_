// Centraliza los módulos disponibles para cada rol.
// Ambos roles pueden usar las funciones del sistema; solo Administrador gestiona cuentas.
const modulosOperativos = [
    'productos',
    'inventario',
    'ventas',
    'proveedores',
    'escaneo',
    'dashboard',
    'alertas'
];

const permisos = {
    administrador: {
        usuarios: ['gestionar']
    },
    usuario: {
        usuarios: []
    }
};

for (const rol of Object.values(permisos)) {
    for (const modulo of modulosOperativos) {
        rol[modulo] = ['acceder'];
    }
}

module.exports = permisos;
