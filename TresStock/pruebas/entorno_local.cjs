const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { createRequire } = require('node:module');

// Crea un servidor y un PostgreSQL exclusivos para pruebas. No lee las credenciales de la base del proyecto.
const argumento = process.argv.indexOf('--proyecto');
const proyecto = argumento >= 0 ? path.resolve(process.argv[argumento + 1]) : path.resolve(__dirname, '..');
const verificar = process.argv.includes('--verificar');
const requireProyecto = createRequire(path.join(proyecto, 'package.json'));
const { Client } = requireProyecto('pg');
const bcrypt = requireProyecto('bcrypt');
const XLSX = requireProyecto('@keep-lts/xlsx');
const carpeta = path.join(os.tmpdir(), 'TresStock-pruebas-locales');
const datos = path.join(carpeta, 'postgres');
const puertoDb = 55441;
const puertoApp = 3001;
const base = 'tresstock_pruebas';
const configDb = { host: '127.0.0.1', port: puertoDb, user: 'tresstock_pruebas', database: 'postgres' };
let servidor;
let pool;
let postgresIniciado = false;
let cerrando = false;
let bin;

function encontrarPostgres() {
    if (process.env.TRESSTOCK_PG_BIN) return path.resolve(process.env.TRESSTOCK_PG_BIN);
    const principal = path.join(process.env.ProgramFiles || 'C:/Program Files', 'PostgreSQL');
    if (fs.existsSync(principal)) {
        const versiones = fs.readdirSync(principal).filter(v => /^\d+$/.test(v)).sort((a,b) => Number(b)-Number(a));
        for (const version of versiones) {
            const candidato = path.join(principal, version, 'bin');
            if (fs.existsSync(path.join(candidato, 'initdb.exe'))) return candidato;
        }
    }
    throw new Error('No se encontró PostgreSQL. Define TRESSTOCK_PG_BIN con la ruta de sus ejecutables.');
}

function pg(programa, args) {
    // Un archivo evita que los procesos de PostgreSQL mantengan abiertos los pipes de Node en Windows.
    const log = fs.openSync(path.join(carpeta,'comandos.log'),'a');
    try {
        return execFileSync(path.join(bin, programa + '.exe'), args, { windowsHide: true, stdio: ['ignore',log,log], timeout: 90000 });
    } finally { fs.closeSync(log); }
}

async function cerrar() {
    if (cerrando) return;
    cerrando = true;
    if (servidor) await new Promise(resolve => servidor.close(resolve));
    if (pool) await pool.end();
    if (postgresIniciado) {
        try { pg('pg_ctl', ['-D', datos, '-m', 'fast', '-w', '-t', '30', 'stop']); }
        catch (error) { console.error('No se pudo detener PostgreSQL de pruebas:', error.message); }
    }
}

function guardarArchivosEjemplo() {
    const destino = path.join(carpeta, 'archivos_ejemplo');
    fs.mkdirSync(destino, { recursive: true });
    function csv(nombre, boleta, fecha, productos) {
        const total = productos.reduce((s,p) => s+p.cantidad*100,0);
        const filas = productos.map(p => {
            const fila = Array(29).fill('');
            Object.assign(fila, {14:`BOL Nº${boleta}`,16:'12:00',19:fecha,20:p.codigo,21:p.codigo,22:'100',23:'100',24:String(p.cantidad),26:String(p.cantidad*100),28:String(total)});
            return fila.join(';');
        });
        fs.writeFileSync(path.join(destino,nombre),filas.join('\r\n'),'utf8');
    }
    csv('ventas_historicas.csv','900000001','01/01/2025',[{codigo:'QA-P001',cantidad:1},{codigo:'QA-P002',cantidad:1}]);
    csv('ventas_diarias.csv','900000002','02/01/2026',[{codigo:'QA-P001',cantidad:2}]);
    csv('ventas_producto_faltante.csv','900000003','02/01/2026',[{codigo:'QA-P001',cantidad:1},{codigo:'QA-P999',cantidad:1}]);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro,XLSX.utils.json_to_sheet([{CODIGO:'QA-KG001','COD. BARRA':'QA-KG001',DESCRIPCION:'QA Producto por KG',FAMILIA:'BALANZA','P.Publico':100,'STOCK ACTUAL':1.25}]),'Productos');
    XLSX.writeFile(libro,path.join(destino,'productos_decimales.xlsx'));
    return destino;
}

async function main() {
    bin = encontrarPostgres();
    fs.mkdirSync(carpeta,{recursive:true});
    if (!fs.existsSync(path.join(datos,'PG_VERSION'))) {
        pg('initdb',['-D',datos,'-A','trust','-U',configDb.user,'--encoding=UTF8','--locale=C','--no-sync']);
    }
    let activo = false;
    try { pg('pg_ctl',['-D',datos,'status']); activo = true; } catch {}
    if (!activo) {
        postgresIniciado = true;
        pg('pg_ctl',['-D',datos,'-l',path.join(carpeta,'postgres.log'),'-o',`-h 127.0.0.1 -p ${puertoDb} -c max_connections=20 -c shared_buffers=16MB`,'-w','-t','60','start']);
    }
    const admin = new Client(configDb);
    let nueva = false;
    await admin.connect();
    try {
        const real = (await admin.query('SHOW data_directory')).rows[0].data_directory;
        if (path.resolve(real).toLowerCase() !== path.resolve(datos).toLowerCase()) throw new Error('El puerto pertenece a otro PostgreSQL. No se realizará ninguna operación.');
        if (!(await admin.query('SELECT 1 FROM pg_database WHERE datname=$1',[base])).rowCount) {
            await admin.query('CREATE DATABASE tresstock_pruebas');
            nueva = true;
        }
    } finally { await admin.end(); }
    const cliente = new Client({...configDb,database:base});
    await cliente.connect();
    try {
        if (nueva) {
            // El SQL inicial solo se ejecuta en la base recién creada de este clúster aislado.
            await cliente.query(fs.readFileSync(path.join(proyecto,'base_datos/tresstock.sql'),'utf8'));
            await cliente.query('UPDATE base_datos.usuarios SET activo=FALSE');
            for (const [nombre,email,password,rol] of [
                ['Administrador de pruebas','admin.pruebas@example.invalid','PruebaAdmin123','Administrador'],
                ['Usuario de pruebas','usuario.pruebas@example.invalid','PruebaUsuario123','Usuario']
            ]) {
                await cliente.query('INSERT INTO base_datos.usuarios(nombre,email,password_hash,id_rol) SELECT $1,$2,$3,id_rol FROM base_datos.roles WHERE nombre=$4',[nombre,email,await bcrypt.hash(password,10),rol]);
            }
            await cliente.query("INSERT INTO base_datos.productos(codigo,cod_barra,descripcion,familia,precio_publico,controla_stock) VALUES ('QA-P001','7800000000016','QA Producto uno','PRUEBAS',100,TRUE),('QA-P002','7800000000023','QA Producto dos','PRUEBAS',100,TRUE),('QA-SERV','QA-SERV','QA Servicio','PRUEBAS',100,FALSE)");
            await cliente.query("UPDATE base_datos.inventario SET stock_actual=10 WHERE codigo IN ('QA-P001','QA-P002')");
            await cliente.query("UPDATE base_datos.inventario SET stock_minimo=5,stock_seguridad=5 WHERE codigo='QA-P001'");
        }
    } finally { await cliente.end(); }
    const secretoArchivo = path.join(carpeta,'secretos_locales.json');
    if (!fs.existsSync(secretoArchivo)) fs.writeFileSync(secretoArchivo,JSON.stringify({jwt:crypto.randomBytes(32).toString('hex'),csrf:crypto.randomBytes(32).toString('hex'),codigo:crypto.randomBytes(32).toString('hex')}));
    const secretos = JSON.parse(fs.readFileSync(secretoArchivo,'utf8'));
    Object.assign(process.env,{
        DB_HOST:configDb.host,DB_PORT:String(puertoDb),DB_USER:configDb.user,DB_PASSWORD:'',DB_NAME:base,
        JWT_SECRETO:secretos.jwt,CSRF_SECRET:secretos.csrf,REGISTRO_CODE_SECRET:secretos.codigo,NODE_ENV:'test',
        SMTP_HOST:'',SMTP_USER:'',SMTP_PASS:'',SMTP_FROM:'',OPENFOODFACTS_CONTACTO:'',TRESSTOCK_IMAGENES_DIR:path.join(carpeta,'imagenes')
    });
    pool = require(path.join(proyecto,'backend/configuracion/base_datos'));
    const app = require(path.join(proyecto,'backend/aplicacion'));
    servidor = http.createServer((req,res) => {
        // Usa cookies distintas a las de la aplicación habitual, incluso en el mismo navegador.
        const prefijo = 'tresstock_pruebas_';
        req.headers.cookie = String(req.headers.cookie || '').split(';').map(c => c.trim()).filter(c => c.startsWith(prefijo)).map(c => c.slice(prefijo.length)).join('; ');
        const original = res.setHeader;
        res.setHeader = function(nombre,valor) {
            if (nombre.toLowerCase()==='set-cookie') {
                const renombrar = cookie => String(cookie).replace(/^(sesion|csrf-token)=/,prefijo+'$1=');
                valor = Array.isArray(valor) ? valor.map(renombrar) : renombrar(valor);
            }
            return original.call(this,nombre,valor);
        };
        app(req,res);
    });
    await new Promise((resolve,reject) => { servidor.once('error',reject);servidor.listen(puertoApp,'127.0.0.1',resolve); });
    const archivos = guardarArchivosEjemplo();
    const url = `http://127.0.0.1:${puertoApp}`;
    if (verificar) {
        const estado = await fetch(url+'/api/estado_conexion');
        if (estado.status !== 200 || (await estado.json()).estado !== 'ok') throw new Error('Falló la conexión de la aplicación con la base de pruebas.');
        const csrfRespuesta = await fetch(url+'/api/autenticacion/csrf-token');
        const token = (await csrfRespuesta.json()).csrfToken;
        const cookie = csrfRespuesta.headers.getSetCookie().map(c => c.split(';')[0]).join('; ');
        if (!cookie.includes('tresstock_pruebas_csrf-token=')) throw new Error('La cookie de pruebas no está aislada.');
        const login = await fetch(url+'/api/autenticacion/login',{method:'POST',headers:{'content-type':'application/json','x-csrf-token':token,cookie},body:JSON.stringify({email:'admin.pruebas@example.invalid',password:'PruebaAdmin123'})});
        if (login.status !== 200 || !login.headers.getSetCookie().some(c => c.startsWith('tresstock_pruebas_sesion='))) throw new Error('Falló el inicio de sesión aislado.');
        await login.json();
        console.log('Verificación correcta: base aislada, aplicación, CSRF, login y cookies separadas.');
        await cerrar();
        return;
    }
    console.log(`\nENTORNO DE PRUEBAS: ${url}\nAdministrador: admin.pruebas@example.invalid / PruebaAdmin123\nUsuario: usuario.pruebas@example.invalid / PruebaUsuario123\nArchivos de ejemplo: ${archivos}\nPostgreSQL aislado: ${configDb.host}:${puertoDb} / ${base}\nSMTP desactivado: las pruebas de correo permanecen bloqueadas.\nLos datos de pruebas se conservan al cerrar. Usa Ctrl+C para detener este entorno.\n`);
    process.on('SIGINT',() => cerrar().then(() => process.exit(0)));
    process.on('SIGTERM',() => cerrar().then(() => process.exit(0)));
}

main().catch(async error => { console.error('No se pudo iniciar el entorno de pruebas:',error.message);await cerrar();process.exitCode=1; });
