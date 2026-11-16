const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');

// Ejecuta servicios con dependencias simuladas; nunca conecta con PostgreSQL ni envía correos.
function cargar(ruta, dependencias, extras = {}) {
    const module = { exports: {} };
    const contexto = {
        module, exports: module.exports, Buffer, TextDecoder, setTimeout, setImmediate,
        process: { env: {} }, console: { log() {}, error() {} },
        require(nombre) {
            if (Object.hasOwn(dependencias, nombre)) return dependencias[nombre];
            throw new Error(`Dependencia no simulada: ${nombre}`);
        },
        ...extras
    };
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', ruta), 'utf8'), contexto, { filename: ruta });
    return module.exports;
}

function respuesta() {
    return { codigo: 200, datos: null, status(codigo) { this.codigo = codigo; return this; }, json(datos) { this.datos = datos; return this; } };
}

function utilidadesSesion() {
    return cargar('utilidades/version_sesion.js', { 'node:crypto': crypto }, { process: { env: { JWT_SECRETO: 'secreto-local-exclusivo-para-pruebas' } } });
}

test('la versión de sesión cambia con la contraseña y rechaza versiones inválidas', () => {
    const { crearVersionSesion, versionSesionValida } = utilidadesSesion();
    const anterior = crearVersionSesion('hash-anterior');
    assert.equal(versionSesionValida('hash-anterior', anterior), true);
    assert.equal(versionSesionValida('hash-nuevo', anterior), false);
    for (const version of [undefined, null, '', 'g'.repeat(64), '0'.repeat(63), {}]) {
        assert.equal(versionSesionValida('hash-anterior', version), false);
    }
});

test('la versión de sesión exige el secreto de JWT', () => {
    const { crearVersionSesion } = cargar('utilidades/version_sesion.js', { 'node:crypto': crypto });
    assert.throws(() => crearVersionSesion('hash'), /JWT_SECRETO/);
});

test('el middleware acepta la sesión vigente y rechaza la anterior al cambio de contraseña', async () => {
    const versiones = utilidadesSesion();
    let hashActual = 'hash-anterior';
    const token = { id: 1, version_sesion: versiones.crearVersionSesion(hashActual) };
    const servicio = cargar('servicios/autenticacion_servicio.js', {
        'bcrypt': {}, 'nodemailer': {}, 'node:crypto': crypto,
        '../utilidades/version_sesion': versiones, '../utilidades/validacion_contrasena': {},
        '../configuracion/base_datos': { async query() { return { rows: [{ id_usuario: 1, id_rol: 1, nombre_rol: 'Administrador', password_hash: hashActual }] }; } }
    });
    const { autenticacion } = cargar('middleware/autenticacion.js', {
        '../utilidades/jwt': { verificarToken: () => token }, '../servicios/autenticacion_servicio': servicio, '../configuracion/permisos': {}
    });
    let aceptada = false;
    await autenticacion({ cookies: { sesion: 'jwt-de-prueba' } }, respuesta(), () => { aceptada = true; });
    assert.equal(aceptada, true);
    hashActual = 'hash-nuevo';
    const res = respuesta();
    await autenticacion({ cookies: { sesion: 'jwt-de-prueba' } }, res, () => assert.fail('Se aceptó la sesión anterior'));
    assert.equal(res.codigo, 401);
    token.version_sesion = versiones.crearVersionSesion(hashActual);
    await autenticacion({ cookies: { sesion: 'jwt-nuevo' } }, respuesta(), () => { aceptada = true; });
    const usuario = await servicio.obtenerUsuarioPorId(1);
    assert.equal(Object.hasOwn(usuario, 'password_hash'), false);
});

test('los JWT sin versión de sesión deben iniciar sesión nuevamente', async () => {
    const { autenticacion } = cargar('middleware/autenticacion.js', {
        '../utilidades/jwt': { verificarToken: () => ({ id: 1 }) },
        '../servicios/autenticacion_servicio': { obtenerUsuarioPorId() { assert.fail('No debe consultar una sesión sin versión'); } },
        '../configuracion/permisos': {}
    });
    const res = respuesta();
    await autenticacion({ cookies: { sesion: 'jwt-antiguo' } }, res, () => assert.fail('Sesión antigua aceptada'));
    assert.equal(res.codigo, 401);
});

test('el login firma la versión de sesión y no la devuelve en la respuesta pública', async () => {
    const version = utilidadesSesion().crearVersionSesion('hash');
    let payload;
    const controlador = cargar('controladores/autenticacion_controlador.js', {
        '../servicios/autenticacion_servicio': { iniciarSesion: async () => ({ id_usuario: 1, id_rol: 2, nombre: 'Prueba', version_sesion: version }) },
        '../utilidades/jwt': { firmarToken(datos) { payload = datos; return 'jwt-nuevo'; } },
        '../utilidades/cookies': { OPCIONES_COOKIE_SESION: {} },
        '../utilidades/csrf': { generateCsrfToken: () => 'csrf-nuevo' },
        '../utilidades/validacion_contrasena': {}
    });
    const res = { ...respuesta(), cookie() {} };
    await controlador.iniciarSesion({ body: { email: 'prueba@example.invalid', password: 'Clave123' }, ip: '127.0.0.1' }, res);
    assert.equal(payload.version_sesion, version);
    assert.equal(res.datos.nombre, 'Prueba');
    assert.equal(Object.hasOwn(res.datos, 'version_sesion'), false);
    assert.equal(res.datos.csrfToken, 'csrf-nuevo');
});

test('una venta con un producto faltante no guarda nada; al corregirla se importa completa una sola vez', async () => {
    const estado = { productos: [{ codigo: 'A', cod_barra: '111' }], ventas: [], detalles: [], conexiones: 0 };
    const filas = ['A', 'B'].map(codigo => {
        const fila = Array(29).fill('');
        Object.assign(fila, { 14: 'BOL Nº123', 16: '12:00', 19: '01/01/2026', 20: codigo, 21: codigo, 22: '100', 23: '100', 24: '1', 26: '100', 28: '200' });
        return fila;
    });
    const pool = {
        async query(sql) {
            if (/SELECT\s+codigo,\s+cod_barra/.test(sql)) return { rows: estado.productos };
            if (/SELECT boleta/.test(sql)) return { rows: estado.ventas };
            throw new Error(sql);
        },
        async connect() {
            estado.conexiones++;
            return { release() {}, async query(sql, valores = []) {
                if (/^(BEGIN|COMMIT|ROLLBACK)$/.test(sql)) return { rows: [] };
                if (/SELECT email/.test(sql)) return { rowCount: 1, rows: [{ email: 'prueba@example.invalid' }] };
                if (/FROM base_datos.configuracion_inventario/.test(sql)) return { rowCount: 1, rows: [{ fecha_inicio_descuento: null }] };
                if (/INSERT INTO base_datos.ventas\s/.test(sql)) {
                    const venta = { boleta: valores[0], id_venta: 1 };
                    estado.ventas.push(venta);
                    return { rowCount: 1, rows: [venta] };
                }
                if (/INSERT INTO base_datos.detalle_venta/.test(sql)) {
                    for (let i = 0; i < valores.length; i += 5) estado.detalles.push(valores[i + 1]);
                    return { rowCount: valores.length / 5, rows: [] };
                }
                throw new Error(sql);
            } };
        }
    };
    const servicio = cargar('servicios/ventas_servicio.js', { '../configuracion/base_datos': pool, 'csv-parse/sync': { parse: () => filas } });
    const archivo = { originalname: 'prueba.csv', buffer: Buffer.from('datos;de;prueba') };
    await assert.rejects(() => servicio.importarVentas(archivo, 1, 'historico'), error => error.status === 400 && /No se guardó ninguna venta/.test(error.message));
    assert.equal(estado.conexiones, 0);
    assert.equal(estado.ventas.length, 0);
    estado.productos.push({ codigo: 'B', cod_barra: '222' });
    assert.equal((await servicio.importarVentas(archivo, 1, 'historico')).resumen.detalles_importados, 2);
    assert.equal((await servicio.importarVentas(archivo, 1, 'historico')).resumen.detalles_importados, 0);
    assert.deepEqual(estado.detalles, ['A', 'B']);
});

function servicioExcel(stock, registros) {
    return cargar('servicios/productos_servicio.js', {
        '@keep-lts/xlsx': {
            read: () => ({ SheetNames: ['Hoja'], Sheets: { Hoja: {} } }),
            utils: { sheet_to_json: () => [{ CODIGO: 'KG1', 'COD. BARRA': '12345678', DESCRIPCION: 'Producto KG', FAMILIA: 'BALANZA', 'P.Publico': 100, 'STOCK ACTUAL': stock }] }
        },
        '../configuracion/base_datos': { async connect() { return { release() {}, async query(sql, valores = []) {
            registros.push({ sql, valores });
            return { rowCount: /INSERT INTO/.test(sql) ? 1 : 0, rows: [] };
        } }; } }
    });
}

for (const stock of [0, 1.25, '1,25', 0.0001, 99999999.9999]) {
    test(`Excel conserva el stock válido ${stock}`, async () => {
        const registros = [];
        const resultado = await servicioExcel(stock, registros).importarProductos({ buffer: Buffer.from('fixture') }, true, 'prueba@example.invalid');
        assert.equal(resultado.resumen.stock_actual_actualizados, 1);
        const inventario = registros.find(r => /INSERT INTO base_datos.inventario/.test(r.sql));
        assert.equal(JSON.parse(inventario.valores[0])[0].stockActual, Number(String(stock).replace(',', '.')));
        assert.match(inventario.sql, /"stockActual" NUMERIC\(12,4\)/);
        assert.equal(registros.at(-1).sql, 'COMMIT');
    });
}

for (const stock of [-1, 100000000, 1.23456, 0.0000000001, '', true, 'incorrecto']) {
    test(`Excel rechaza el stock inválido ${JSON.stringify(stock)} antes de modificar la base`, async () => {
        const registros = [];
        await assert.rejects(() => servicioExcel(stock, registros).importarProductos({ buffer: Buffer.from('fixture') }, true, 'prueba@example.invalid'), /STOCK ACTUAL invalidos/);
        assert.equal(registros.length, 0);
    });
}

test('el escáner rechaza los códigos principales y permite eliminar una asociación antigua en conflicto', async () => {
    const estado = { asociado: false, principal: true };
    const servicio = cargar('servicios/escaneo_servicio.js', { '../configuracion/base_datos': { async query(sql) {
        if (/SELECT codigo\s+FROM base_datos.productos/.test(sql) && /UNION ALL/.test(sql)) {
            return { rows: /WHERE codigo = \$1 OR cod_barra = \$1/.test(sql) ? [{ codigo: 'A' }] : [], rowCount: 1 };
        }
        if (/INSERT INTO base_datos.codigos_asociados/.test(sql)) { estado.asociado = true; return { rows: [{}], rowCount: 1 }; }
        if (/DELETE FROM base_datos.codigos_asociados/.test(sql)) {
            const existia = estado.asociado; estado.asociado = false;
            return { rowCount: existia ? 1 : 0, rows: existia ? [{ codigo_barras: 'A' }] : [] };
        }
        if (/SELECT codigo FROM base_datos.productos/.test(sql)) return { rowCount: 1, rows: [{ codigo: 'A' }] };
        throw new Error(sql);
    } } });
    await assert.rejects(() => servicio.asociarCodigoProducto('B', 'A', 'EAN', 1), error => error.codigo === 'CODIGO_DUPLICADO');
    assert.equal(estado.asociado, false);
    estado.asociado = true;
    assert.equal((await servicio.eliminarCodigoAsociado('A')).codigo_barras, 'A');
    assert.equal(estado.principal, true);
    await assert.rejects(() => servicio.eliminarCodigoAsociado('A'), error => error.status === 400);
});
