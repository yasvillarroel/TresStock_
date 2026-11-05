let productosMasVendidosDashboard = [];
let productosMasVendidosCargadosDashboard = false;
let productosExcluidosDashboard = [];
let productosExcluidosCargadosDashboard = false;

async function cargarResumenDashboard() {
    try {
        const respuesta = await fetchConCsrf(
            `${URL_API}/api/dashboard/resumen`,
            { method: 'GET', credentials: 'include' }
        );
        const resumen = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(resumen.mensaje || 'No se pudo cargar el resumen.');
        }

        document.getElementById('valor_cantidad_productos_dashboard').textContent =
            Number(resumen.cantidad_productos || 0).toLocaleString('es-CL');
        document.getElementById('valor_stock_bajo_dashboard').textContent =
            Number(resumen.productos_stock_bajo || 0).toLocaleString('es-CL');
        document.getElementById('valor_productos_agotados_dashboard').textContent =
            Number(resumen.productos_agotados || 0).toLocaleString('es-CL');
        document.getElementById('valor_ventas_mes_dashboard').textContent =
            Number(resumen.ventas_mes_actual || 0).toLocaleString('es-CL', {
                style: 'currency',
                currency: 'CLP',
                maximumFractionDigits: 0
            });
    } catch (error) {
        console.error('Error al cargar indicadores del dashboard:', error);
    }
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
    } catch (error) {
        console.error('Error al cargar productos más vendidos:', error);
        estado.textContent = 'No se pudieron cargar los productos más vendidos.';
    }
}

function mostrarProductosMasVendidosDashboard() {
    const cuerpo = document.getElementById('cuerpo_mas_vendidos_dashboard');
    const estado = document.getElementById('estado_mas_vendidos_dashboard');
    const busqueda = (document.getElementById('busqueda_mas_vendidos_dashboard')?.value || '')
        .trim()
        .toLocaleLowerCase('es-CL');

    if (!cuerpo || !estado) return;

    const filtrados = productosMasVendidosDashboard
        .map((producto, indice) => ({ producto, puesto: indice + 1 }))
        .filter(({ producto }) =>
            `${producto.descripcion || ''} ${producto.codigo || ''}`
                .toLocaleLowerCase('es-CL')
                .includes(busqueda)
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
            Number(producto.cantidad_vendida || 0).toLocaleString('es-CL', {
                maximumFractionDigits: 4
            })
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
        const respuesta = await fetchConCsrf(
            `${URL_API}/api/dashboard/productos-excluidos`,
            { method: 'GET', credentials: 'include' }
        );
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
    const busqueda = (document.getElementById('busqueda_mas_vendidos_dashboard')?.value || '')
        .trim()
        .toLocaleLowerCase('es-CL');

    if (!cuerpo || !estado) return;

    const filtrados = productosExcluidosDashboard.filter((producto) =>
        `${producto.descripcion || ''} ${producto.codigo || ''} ${producto.correo_usuario || ''}`
            .toLocaleLowerCase('es-CL')
            .includes(busqueda)
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
        const fecha = producto.fecha_hora
            ? new Date(producto.fecha_hora).toLocaleString('es-CL')
            : '-';

        [
            producto.descripcion || 'Producto sin nombre',
            producto.codigo || '-',
            producto.correo_usuario || 'No registrado',
            fecha
        ].forEach((valor) => {
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
            {
                method: excluir ? 'POST' : 'DELETE',
                credentials: 'include'
            }
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
