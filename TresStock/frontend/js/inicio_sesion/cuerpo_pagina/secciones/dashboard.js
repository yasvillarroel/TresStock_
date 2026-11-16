let productosMasVendidosDashboard = [];
let productosMasVendidosCargadosDashboard = false;
let productosExcluidosDashboard = [];
let productosExcluidosCargadosDashboard = false;

async function cargarResumenDashboard() {
    try {
        const respuesta = await fetchConCsrf(`${URL_API}/api/dashboard/resumen`, { method: 'GET', credentials: 'include' });
        const resumen = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(resumen.mensaje || 'No se pudo cargar el resumen.');
        }

        document.getElementById('valor_cantidad_productos_dashboard').textContent = Number(resumen.cantidad_productos || 0).toLocaleString('es-CL');
        document.getElementById('valor_stock_bajo_dashboard').textContent = Number(resumen.productos_stock_bajo || 0).toLocaleString('es-CL');
        document.getElementById('valor_productos_agotados_dashboard').textContent = Number(resumen.productos_agotados || 0).toLocaleString('es-CL');
        document.getElementById('valor_ventas_mes_dashboard').textContent =
            Number(resumen.ventas_mes_actual || 0).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
        const periodo = document.getElementById('periodo_ventas_mes_dashboard');
        if (periodo) {
            periodo.textContent = resumen.mes_ventas_referencia ? obtenerNombreMesDashboard(resumen.mes_ventas_referencia, 'largo') : 'Sin ventas registradas';
        }
    } catch (error) {
        console.error('Error al cargar indicadores del dashboard:', error);
    }
}

// ===== GRAFICO DE VENTAS DE LOS SEIS MESES CON DATOS =====
function obtenerNombreMesDashboard(mes, estilo = 'corto') {
    const partes = /^(\d{4})-(\d{2})$/.exec(String(mes || ''));
    if (!partes) return String(mes || '');
    const fecha = new Date(Number(partes[1]), Number(partes[2]) - 1, 15, 12);
    return new Intl.DateTimeFormat('es-CL', { month: estilo === 'largo' ? 'long' : 'short', year: estilo === 'largo' ? 'numeric' : undefined }).format(fecha);
}

function formatearMontoDashboard(monto) {
    return Number(monto || 0).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
}

function formatearMontoCompactoDashboard(valor) {
    const cantidad = Number(valor || 0);
    if (Math.abs(cantidad) >= 1000000) return '$' + (cantidad / 1000000).toLocaleString('es-CL', { maximumFractionDigits: 1 }) + ' M';
    if (Math.abs(cantidad) >= 1000) return '$' + (cantidad / 1000).toLocaleString('es-CL', { maximumFractionDigits: 1 }) + ' mil';
    return formatearMontoDashboard(cantidad);
}

async function cargarVentasUltimosSeisMesesDashboard() {
    const contenedor = document.getElementById('grafico_ventas_dashboard');
    const periodo = document.getElementById('periodo_grafico_ventas_dashboard');
    if (!contenedor) return;

    contenedor.replaceChildren();
    const mensaje = document.createElement('div');
    mensaje.className = 'texto_grafico_pendiente_dashboard';
    mensaje.textContent = 'Cargando ventas mensuales...';
    contenedor.appendChild(mensaje);

    try {
        const respuesta = await fetchConCsrf(`${URL_API}/api/dashboard/ventas-ultimos-seis-meses`, { method: 'GET', credentials: 'include' });
        const datos = await respuesta.json();
        if (!respuesta.ok) throw new Error(datos.mensaje || 'No se pudieron cargar las ventas mensuales.');
        if (!Array.isArray(datos)) throw new Error('Formato inesperado de ventas mensuales.');
        if (!contenedor.isConnected) return;
        dibujarVentasUltimosSeisMesesDashboard(contenedor, datos);
        if (periodo && datos.length) {
            periodo.textContent = `${obtenerNombreMesDashboard(datos[0].mes)} ${datos[0].mes.slice(0, 4)} – ` +
                `${obtenerNombreMesDashboard(datos[datos.length - 1].mes)} ${datos[datos.length - 1].mes.slice(0, 4)} · Pesos chilenos`;
        } else if (periodo) {
            periodo.textContent = 'Sin ventas registradas';
        }
    } catch (error) {
        console.error('Error al cargar el gráfico mensual del Dashboard:', error);
        if (!contenedor.isConnected) return;
        contenedor.replaceChildren();
        const aviso = document.createElement('div');
        aviso.className = 'texto_grafico_pendiente_dashboard';
        aviso.textContent = 'No fue posible cargar las ventas mensuales. Revisa la conexión con el backend.';
        contenedor.appendChild(aviso);
    }
}

function dibujarVentasUltimosSeisMesesDashboard(contenedor, datos) {
    contenedor.replaceChildren();
    if (!datos.length) {
        const mensaje = document.createElement('div');
        mensaje.className = 'texto_grafico_pendiente_dashboard';
        mensaje.textContent = 'No hay ventas registradas para mostrar.';
        contenedor.appendChild(mensaje);
        return;
    }

    const valores = datos.map(fila => {
        const valor = Number(fila.total_ventas);
        return Number.isFinite(valor) ? valor : 0;
    });
    const maximo = Math.max(0, ...valores);
    // Resalta solamente el primer mes con mayor venta, sin cambiar sus montos.
    const indiceMesMayor = maximo > 0 ? valores.indexOf(maximo) : -1;
    const grafico = document.createElement('div');
    grafico.className = 'ventas_barras_dashboard';
    grafico.setAttribute('role', 'group');
    grafico.setAttribute('aria-label', 'Total de ventas por mes en pesos chilenos');

    datos.forEach((fila, indice) => {
        const monto = valores[indice];
        const mes = obtenerNombreMesDashboard(fila.mes);
        const columna = document.createElement('div');
        columna.className = 'ventas_columna_dashboard';
        if (indice === indiceMesMayor) {
            columna.classList.add('ventas_mes_maximo_dashboard');
        }
        const montoCorto = document.createElement('span');
        montoCorto.className = 'ventas_monto_dashboard';
        montoCorto.textContent = formatearMontoCompactoDashboard(monto);
        montoCorto.title = formatearMontoDashboard(monto);

        const pista = document.createElement('div');
        pista.className = 'ventas_pista_dashboard';
        const barra = document.createElement('div');
        barra.className = 'ventas_barra_dashboard';
        if (monto <= 0) barra.classList.add('ventas_barra_cero_dashboard');
        const porcentaje = maximo > 0 ? Math.max(0, Math.min(100, monto / maximo * 100)) : 0;
        barra.style.height = porcentaje.toFixed(2) + '%';
        pista.appendChild(barra);

        const etiqueta = document.createElement('span');
        etiqueta.className = 'ventas_mes_dashboard';
        etiqueta.textContent = mes;
        columna.tabIndex = 0;
        columna.title = `${obtenerNombreMesDashboard(fila.mes, 'largo')}: ${formatearMontoDashboard(monto)}`;
        columna.setAttribute('aria-label', columna.title);
        columna.append(montoCorto, pista, etiqueta);
        grafico.appendChild(columna);
    });

    const resumen = document.createElement('div');
    resumen.className = 'leyenda_grafico_dashboard ventas_leyenda_dashboard';
    resumen.textContent = 'Total mensual de ventas registradas; los meses sin ventas dentro del período aparecen en cero.';
    contenedor.append(grafico, resumen);
}

async function cargarProductosMasVendidosDashboard() {
    const cuerpo = document.getElementById('cuerpo_mas_vendidos_dashboard');
    const estado = document.getElementById('estado_mas_vendidos_dashboard');
    const periodo = document.getElementById('periodo_mas_vendidos_dashboard')?.value || 'todo';

    if (!cuerpo || !estado) return;

    estado.textContent = 'Cargando productos más vendidos…';
    cuerpo.innerHTML = '';

    try {
        const respuesta = await fetchConCsrf(
            `${URL_API}/api/dashboard/productos-mas-vendidos?periodo=${encodeURIComponent(periodo)}`,
            { method: 'GET', credentials: 'include' }
        );
        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(resultado.mensaje || 'No se pudieron cargar los productos.');
        }

        productosMasVendidosDashboard = Array.isArray(resultado) ? resultado : [];
        productosMasVendidosCargadosDashboard = true;
        mostrarProductosMasVendidosDashboard();
        mostrarVistaPreviaMasVendidosDashboard();
    } catch (error) {
        console.error('Error al cargar productos más vendidos:', error);
        estado.textContent = 'No se pudieron cargar los productos más vendidos.';
        mostrarVistaPreviaMasVendidosDashboard('No se pudo cargar el ranking.');
    }
}

function mostrarProductosMasVendidosDashboard() {
    const cuerpo = document.getElementById('cuerpo_mas_vendidos_dashboard');
    const estado = document.getElementById('estado_mas_vendidos_dashboard');
    const busqueda = (document.getElementById('busqueda_mas_vendidos_dashboard')?.value || '').trim().toLocaleLowerCase('es-CL');

    if (!cuerpo || !estado) return;

    const filtrados = productosMasVendidosDashboard.map((producto, indice) => ({ producto, puesto: indice + 1 }))
        .filter(({ producto }) =>
            `${producto.descripcion || ''} ${producto.codigo || ''}`.toLocaleLowerCase('es-CL').includes(busqueda)
        );

    cuerpo.innerHTML = '';

    if (filtrados.length === 0) {
        estado.textContent = productosMasVendidosDashboard.length === 0
            ? 'Todavía no hay ventas registradas.'
            : 'No hay productos que coincidan con la búsqueda.';
        return;
    }

    estado.textContent = `Mostrando ${filtrados.length} de los ${productosMasVendidosDashboard.length} productos más vendidos.`;

    filtrados.forEach(({ producto, puesto }) => {
        const fila = document.createElement('tr');
        const valores = [
            puesto,
            producto.descripcion || 'Producto sin nombre',
            producto.codigo || '-',
            Number(producto.cantidad_vendida || 0).toLocaleString('es-CL', { maximumFractionDigits: 4 })
        ];

        valores.forEach((valor) => {
            const celda = document.createElement('td');
            celda.textContent = valor;
            fila.appendChild(celda);
        });

        const celdaAccion = document.createElement('td');
        const botonExcluir = document.createElement('button');
        botonExcluir.type = 'button';
        botonExcluir.className = 'boton_excluir_producto_dashboard';
        botonExcluir.textContent = 'Excluir';
        botonExcluir.title = 'Quitar este producto del ranking';
        botonExcluir.addEventListener('click', function() {
            actualizarListaNegraDashboard(producto.codigo, true, botonExcluir);
        });
        celdaAccion.appendChild(botonExcluir);
        fila.appendChild(celdaAccion);

        cuerpo.appendChild(fila);
    });
}

async function cargarProductosExcluidosDashboard() {
    const cuerpo = document.getElementById('cuerpo_excluidos_dashboard');
    const estado = document.getElementById('estado_excluidos_dashboard');

    if (!cuerpo || !estado) return;

    estado.textContent = 'Cargando lista de exclusión…';
    cuerpo.innerHTML = '';

    try {
        const respuesta = await fetchConCsrf(`${URL_API}/api/dashboard/productos-excluidos`, { method: 'GET', credentials: 'include' });
        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(resultado.mensaje || 'No se pudo cargar la lista de exclusión.');
        }

        productosExcluidosDashboard = Array.isArray(resultado) ? resultado : [];
        productosExcluidosCargadosDashboard = true;
        mostrarProductosExcluidosDashboard();
    } catch (error) {
        console.error('Error al cargar la lista de exclusión:', error);
        estado.textContent = 'No se pudo cargar la lista de exclusión.';
    }
}

function mostrarProductosExcluidosDashboard() {
    const cuerpo = document.getElementById('cuerpo_excluidos_dashboard');
    const estado = document.getElementById('estado_excluidos_dashboard');
    const busqueda = (document.getElementById('busqueda_mas_vendidos_dashboard')?.value || '').trim().toLocaleLowerCase('es-CL');

    if (!cuerpo || !estado) return;

    const filtrados = productosExcluidosDashboard.filter((producto) =>
        `${producto.descripcion || ''} ${producto.codigo || ''} ${producto.correo_usuario || ''}`.toLocaleLowerCase('es-CL').includes(busqueda)
    );

    cuerpo.innerHTML = '';

    if (filtrados.length === 0) {
        estado.textContent = productosExcluidosDashboard.length === 0
            ? 'La lista de exclusión está vacía.'
            : 'No hay productos excluidos que coincidan con la búsqueda.';
        return;
    }

    estado.textContent = `${filtrados.length} producto(s) excluido(s).`;

    filtrados.forEach((producto) => {
        const fila = document.createElement('tr');
        const fecha = producto.fecha_hora ? new Date(producto.fecha_hora).toLocaleString('es-CL') : '-';

        [producto.descripcion || 'Producto sin nombre', producto.codigo || '-', producto.correo_usuario || 'No registrado', fecha].forEach((valor) => {
            const celda = document.createElement('td');
            celda.textContent = valor;
            fila.appendChild(celda);
        });

        const celdaAccion = document.createElement('td');
        const botonRestaurar = document.createElement('button');
        botonRestaurar.type = 'button';
        botonRestaurar.className = 'boton_restaurar_producto_dashboard';
        botonRestaurar.textContent = 'Restaurar';
        botonRestaurar.addEventListener('click', function() {
            actualizarListaNegraDashboard(producto.codigo, false, botonRestaurar);
        });
        celdaAccion.appendChild(botonRestaurar);
        fila.appendChild(celdaAccion);
        cuerpo.appendChild(fila);
    });
}

async function actualizarListaNegraDashboard(codigo, excluir, boton) {
    if (boton) boton.disabled = true;

    try {
        const respuesta = await fetchConCsrf(
            `${URL_API}/api/dashboard/productos/${encodeURIComponent(codigo)}/lista-negra`,
            { method: excluir ? 'POST' : 'DELETE', credentials: 'include' }
        );
        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(resultado.mensaje || 'No se pudo actualizar la lista de exclusión.');
        }

        await cargarProductosMasVendidosDashboard();

        const panelExcluidos = document.getElementById('panel_excluidos_dashboard');
        if (panelExcluidos && !panelExcluidos.hidden) {
            await cargarProductosExcluidosDashboard();
        }
    } catch (error) {
        console.error('Error al actualizar la lista de exclusión:', error);
        const estado = document.getElementById('estado_mas_vendidos_dashboard');
        if (estado) estado.textContent = error.message;
        if (boton) boton.disabled = false;
    }
}

function inicializarDashboard() {
    productosMasVendidosDashboard = [];
    productosMasVendidosCargadosDashboard = false;
    productosExcluidosDashboard = [];
    productosExcluidosCargadosDashboard = false;
    cargarResumenDashboard();
    cargarVentasUltimosSeisMesesDashboard();
    cargarProductosMasVendidosDashboard();
    cargarInventarioResumenDashboard();
    configurarAccionesRapidasDashboard();

    const boton = document.getElementById('boton_mas_vendidos_dashboard');
    const panel = document.getElementById('panel_mas_vendidos_dashboard');
    const busqueda = document.getElementById('busqueda_mas_vendidos_dashboard');
    const periodo = document.getElementById('periodo_mas_vendidos_dashboard');
    const botonExcluidos = document.getElementById('boton_ver_excluidos_dashboard');
    const panelExcluidos = document.getElementById('panel_excluidos_dashboard');

    if (boton && panel) {
        boton.addEventListener('click', function() {
            const abrir = panel.hidden;
            panel.hidden = !abrir;
            boton.setAttribute('aria-expanded', String(abrir));
            const previa = document.getElementById('vista_previa_mas_vendidos_dashboard');
            if (previa) previa.hidden = abrir;
            boton.firstChild.textContent = abrir ? 'Ocultar ranking completo ' : 'Ver los 50 productos ';
            if (abrir && !productosMasVendidosCargadosDashboard) {
                cargarProductosMasVendidosDashboard();
            }
        });
    }

    if (busqueda) {
        busqueda.addEventListener('input', mostrarProductosMasVendidosDashboard);
        busqueda.addEventListener('input', mostrarProductosExcluidosDashboard);
    }

    if (periodo) {
        periodo.addEventListener('change', cargarProductosMasVendidosDashboard);
    }

    if (botonExcluidos && panelExcluidos) {
        botonExcluidos.addEventListener('click', function() {
            const abrir = panelExcluidos.hidden;
            panelExcluidos.hidden = !abrir;
            botonExcluidos.setAttribute('aria-expanded', String(abrir));

            if (abrir && !productosExcluidosCargadosDashboard) {
                cargarProductosExcluidosDashboard();
            }
        });
    }
}


// ===== DATOS DEL DASHBOARD: VISTA PREVIA DEL RANKING =====
// Mantiene el mismo endpoint y la lista de exclusión existentes.
function mostrarVistaPreviaMasVendidosDashboard(mensajeError = '') {
    const contenedor = document.getElementById('vista_previa_mas_vendidos_dashboard');
    if (!contenedor) return;
    contenedor.replaceChildren();
    if (mensajeError || !productosMasVendidosDashboard.length) {
        const estado = document.createElement('div');
        estado.className = 'estado_previa_mas_vendidos_dashboard';
        estado.textContent = mensajeError || 'No hay productos vendidos para el período seleccionado.';
        contenedor.appendChild(estado);
        return;
    }
    const tabla = document.createElement('table');
    tabla.className = 'tabla_previa_mas_vendidos_dashboard';
    const cabecera = document.createElement('thead');
    const filaCabecera = document.createElement('tr');
    ['#', 'Producto', 'Cantidad vendida'].forEach(titulo => {
        const celda = document.createElement('th');
        celda.textContent = titulo;
        filaCabecera.appendChild(celda);
    });
    cabecera.appendChild(filaCabecera);
    tabla.appendChild(cabecera);
    const cuerpo = document.createElement('tbody');
    productosMasVendidosDashboard.slice(0, 5).forEach((producto, indice) => {
        const fila = document.createElement('tr');
        const numero = document.createElement('td');
        numero.textContent = String(indice + 1);
        const productoCelda = document.createElement('td');
        const nombre = document.createElement('span');
        nombre.className = 'nombre_previa_mas_vendidos_dashboard';
        nombre.textContent = producto.descripcion || 'Producto sin nombre';
        const codigo = document.createElement('span');
        codigo.className = 'codigo_previa_mas_vendidos_dashboard';
        codigo.textContent = 'Código: ' + (producto.codigo || '-');
        productoCelda.append(nombre, codigo);
        const cantidad = document.createElement('td');
        cantidad.textContent = Number(producto.cantidad_vendida || 0).toLocaleString('es-CL', { maximumFractionDigits: 4 });
        fila.append(numero, productoCelda, cantidad);
        cuerpo.appendChild(fila);
    });
    tabla.appendChild(cuerpo);
    contenedor.appendChild(tabla);
}

// ===== RESUMEN OPERATIVO: UTILIZA EL ENDPOINT EXISTENTE /api/inventario =====
// NO inventa gráficos de ventas. Solo muestra información real que ya entrega Inventario.
async function cargarInventarioResumenDashboard() {
    const grafico = document.getElementById('grafico_inventario_dashboard');
    const cuerpo = document.getElementById('cuerpo_tabla_stock_bajo_dashboard');
    const listaAlertas = document.getElementById('lista_alertas_dashboard');
    const listaRecomendaciones = document.getElementById('lista_recomendaciones_dashboard');
    if (!grafico || !cuerpo || !listaAlertas || !listaRecomendaciones) return;
    try {
        const respuesta = await fetchConCsrf(`${URL_API}/api/inventario`, { method: 'GET', credentials: 'include' });
        if (!respuesta.ok) throw new Error('No se pudo consultar el inventario.');
        const datos = await respuesta.json();
        if (!Array.isArray(datos)) throw new Error('Formato de inventario no reconocido.');
        if (!grafico.isConnected || !cuerpo.isConnected) return;
        dibujarDistribucionFamiliasDashboard(grafico, datos);
        dibujarStockBajoDashboard(cuerpo, datos);
        dibujarAlertasYRecomendacionesDashboard(listaAlertas, listaRecomendaciones, datos);
    } catch (error) {
        console.error('Error al cargar resumen de inventario en Dashboard:', error);
        if (grafico.isConnected) grafico.textContent = 'No se pudo obtener la distribución del inventario.';
        if (cuerpo.isConnected) {
            cuerpo.replaceChildren();
            const fila = document.createElement('tr');
            const celda = document.createElement('td');
            celda.colSpan = 5;
            celda.textContent = 'No se pudo cargar el listado de stock bajo.';
            fila.appendChild(celda);
            cuerpo.appendChild(fila);
        }
        if (listaAlertas.isConnected) listaAlertas.textContent = 'No se pudieron cargar las alertas de inventario.';
        if (listaRecomendaciones.isConnected) listaRecomendaciones.textContent = 'Consulta las recomendaciones en Análisis.';
    }
}

function dibujarDistribucionFamiliasDashboard(contenedor, productos) {
    contenedor.replaceChildren();
    const conteos = new Map();
    productos.forEach(p => {
        const familia = String(p.familia || 'Sin familia').trim() || 'Sin familia';
        conteos.set(familia, (conteos.get(familia) || 0) + 1);
    });
    const familias = Array.from(conteos.entries()).sort((a,b) => b[1]-a[1]).slice(0,7);
    if (!familias.length) { contenedor.textContent = 'No hay productos inventariables registrados.'; return; }
    const maximo = familias[0][1] || 1;
    const grafico = document.createElement('div');
    grafico.className = 'familias_barras_dashboard';
    // Colores estables por familia, incluso si cambia su lugar en el ranking.
    const coloresPorFamilia = {
        'VARIOS': '#159ba3',
        'ABARROTES': '#3869a8',
        'CONFITES': '#d9a044',
        'ART ASEO': '#8b79bb',
        'BEBIDAS': '#36a1c1',
        'LIBRERIA': '#52a98b',
        'MASCOTAS': '#d58372'
    };
    const paletaAlternativa = Object.values(coloresPorFamilia);
    familias.forEach(([nombre, cantidad], indice) => {
        const fila = document.createElement('div');
        fila.className = 'fila_familia_dashboard';
        const etiqueta = document.createElement('span');
        etiqueta.className = 'nombre_familia_dashboard';
        etiqueta.textContent = nombre;
        etiqueta.title = nombre;
        const pista = document.createElement('div');
        pista.className = 'pista_familia_dashboard';
        const barra = document.createElement('div');
        barra.className = 'barra_familia_dashboard';
        const nombreNormalizado = nombre.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim();
        barra.style.setProperty('--color-familia-dashboard', coloresPorFamilia[nombreNormalizado] || paletaAlternativa[indice % paletaAlternativa.length]);
        barra.style.width = (100 * cantidad / maximo).toFixed(2) + '%';
        pista.appendChild(barra);
        const valor = document.createElement('span');
        valor.className = 'cantidad_familia_dashboard';
        valor.textContent = cantidad.toLocaleString('es-CL');
        fila.append(etiqueta,pista,valor);
        grafico.appendChild(fila);
    });
    contenedor.appendChild(grafico);
    const nota = document.createElement('div');
    nota.className = 'leyenda_grafico_dashboard';
    nota.textContent = 'Cantidad de productos inventariables registrados en cada familia (7 principales).';
    contenedor.appendChild(nota);
}

function obtenerProductosBajoStockDashboard(productos) {
    return productos.filter(p => {
        const stock = Number(p.stock_actual);
        const punto = Number(p.punto_reposicion ?? (Number(p.stock_minimo || 0) + Number(p.stock_seguridad || 0)));
        return Number.isFinite(stock) && Number.isFinite(punto) && stock > 0 && punto > 0 && stock <= punto;
    }).sort((a,b) => {
        const margen = p => Number(p.stock_actual) - Number(p.punto_reposicion ?? (Number(p.stock_minimo || 0) + Number(p.stock_seguridad || 0)));
        return margen(a)-margen(b);
    });
}

function dibujarStockBajoDashboard(cuerpo, productos) {
    cuerpo.replaceChildren();
    const lista = obtenerProductosBajoStockDashboard(productos).slice(0,6);
    if (!lista.length) {
        const fila = document.createElement('tr');
        const celda = document.createElement('td');
        celda.colSpan = 5;
        celda.textContent = 'No hay productos con stock bajo y existencias positivas.';
        fila.appendChild(celda);
        cuerpo.appendChild(fila);
        return;
    }
    lista.forEach(p => {
        const fila = document.createElement('tr');
        fila.className = 'fila_stock_bajo_dashboard';
        const campos = [p.descripcion || '-',p.familia || '-',
            Number(p.stock_actual || 0).toLocaleString('es-CL', {maximumFractionDigits:3}),
            Number(p.punto_reposicion ?? (Number(p.stock_minimo || 0) + Number(p.stock_seguridad || 0))).toLocaleString('es-CL', {maximumFractionDigits:3})];
        const clases = ['dato_producto_stock_bajo_dashboard','dato_familia_stock_bajo_dashboard', 'dato_stock_actual_dashboard','dato_stock_minimo_dashboard'];
        campos.forEach((valor,indice) => {
            const celda=document.createElement('td');celda.className=clases[indice];celda.textContent=valor;fila.appendChild(celda);
        });
        const estado = document.createElement('td');
        estado.className = 'dato_estado_stock_dashboard';
        const etiqueta = document.createElement('span');
        etiqueta.className = 'etiqueta_estado_bajo_dashboard';
        etiqueta.textContent = 'Stock bajo';
        estado.appendChild(etiqueta);
        fila.appendChild(estado);
        cuerpo.appendChild(fila);
    });
}

function dibujarAlertasYRecomendacionesDashboard(alertas, recomendaciones, productos) {
    alertas.replaceChildren();
    recomendaciones.replaceChildren();
    const agotados = productos.filter(p=>Number(p.stock_actual)===0).length;
    const bajos = obtenerProductosBajoStockDashboard(productos).length;
    const crearMensaje = (contenedor, clase, mensaje) => {
        const elemento=document.createElement('div');elemento.className=clase;elemento.textContent=mensaje;contenedor.appendChild(elemento);
    };
    crearMensaje(alertas,'alerta_dashboard',`${agotados.toLocaleString('es-CL')} productos inventariables sin stock.`);
    crearMensaje(alertas,'alerta_dashboard',`${bajos.toLocaleString('es-CL')} productos inventariables con stock bajo.`);
    crearMensaje(recomendaciones,'recomendacion_dashboard','Consulta las cantidades de compra sugeridas en Análisis → Reposición recomendada.');
    crearMensaje(recomendaciones,'recomendacion_dashboard','Revisa las alertas de stock y los lotes próximos a vencer antes de reponer.');
    [[alertas,'alertas','Ver alertas y vencimientos'],[recomendaciones,'analisis','Ver análisis de reposición']].forEach(([contenedor,vista,texto])=>{
        const boton=document.createElement('button');
        boton.className='enlace_resumen_dashboard';boton.type='button';boton.textContent=texto;
        boton.addEventListener('click',()=>irAVistaDesdeDashboard(vista));
        contenedor.appendChild(boton);
    });
}

// ===== ACCIONES RAPIDAS =====
async function irAVistaDesdeDashboard(vista, pestanaInventario) {
    if (typeof cargarVista !== 'function') return;
    if (typeof seleccionarOpcionMenu === 'function') seleccionarOpcionMenu(vista, false);
    await cargarVista(vista);
    if (vista === 'inventario' && pestanaInventario) {
        const pestana = document.querySelector(`.contenedor_pestanas_inventario [data-vista="${pestanaInventario}"]`);
        pestana?.click();
    }
}
function configurarAccionesRapidasDashboard() {
    document.getElementById('boton_importar_dashboard')?.addEventListener('click', () => irAVistaDesdeDashboard('ventas'));
    document.getElementById('boton_entrada_dashboard')?.addEventListener('click', () => irAVistaDesdeDashboard('inventario','ENTRADA'));
    document.getElementById('boton_salida_dashboard')?.addEventListener('click', () => irAVistaDesdeDashboard('inventario','SALIDA'));
}
