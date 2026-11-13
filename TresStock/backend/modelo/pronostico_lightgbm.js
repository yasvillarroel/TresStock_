const modelo = require('./modelo_demanda_lightgbm.json');
const metadatos = require('./metadatos_modelo.json');

const indiceCodigo = new Map(metadatos.categorias_codigo.map((codigo, indice) => [String(codigo), indice]));
const fechaBase = Date.parse(`${metadatos.periodo_datos.fecha_base_indice}T00:00:00Z`);

function compilarArbol(raiz) {
    const nodos = [];

    function agregar(nodo) {
        const indice = nodos.length;
        const compilado = { hoja: Object.hasOwn(nodo, 'leaf_value'), valor: nodo.leaf_value };
        nodos.push(compilado);
        if (compilado.hoja) return indice;

        compilado.variable = nodo.split_feature;
        compilado.izquierda = agregar(nodo.left_child);
        compilado.derecha = agregar(nodo.right_child);
        compilado.porDefectoIzquierda = nodo.default_left;
        compilado.categorias = nodo.decision_type === '==' ? new Set(nodo.threshold.split('||').map(Number)) : null;
        compilado.limite = compilado.categorias ? null : Number(nodo.threshold);
        return indice;
    }

    return { nodos, raiz: agregar(raiz) };
}

const arboles = modelo.tree_info.map(arbol => compilarArbol(arbol.tree_structure));

function evaluarArbol(arbol, variables) {
    let indice = arbol.raiz;
    while (true) {
        const nodo = arbol.nodos[indice];
        if (nodo.hoja) return nodo.valor;
        const valor = variables[nodo.variable];
        const izquierda = nodo.categorias
            ? nodo.categorias.has(valor)
            : (Number.isNaN(valor) ? nodo.porDefectoIzquierda : valor <= nodo.limite);
        indice = izquierda ? nodo.izquierda : nodo.derecha;
    }
}

function predecirDia(codigo, fecha, historial) {
    const diaSemana = (new Date(`${fecha}T00:00:00Z`).getUTCDay() + 6) % 7;
    if (diaSemana === 6) return 0;

    const indiceCategoria = indiceCodigo.get(String(codigo));
    if (indiceCategoria === undefined) return 0;
    const mes = Number(fecha.slice(5, 7));
    const indiceFecha = Math.floor((Date.parse(`${fecha}T00:00:00Z`) - fechaBase) / 86400000);
    const promedio = (valores) => valores.reduce((suma, valor) => suma + valor, 0) / valores.length;
    const variables = [
        indiceCategoria,
        diaSemana,
        mes,
        indiceFecha,
        historial.at(-7),
        historial.at(-14),
        promedio(historial.slice(-35, -7)),
        promedio(historial.slice(-7)),
        promedio(historial.slice(-28))
    ];
    let prediccion = 0;
    for (const arbol of arboles) prediccion += evaluarArbol(arbol, variables);
    return Math.max(0, prediccion);
}

function sumarDias(fecha, dias) {
    const resultado = new Date(`${fecha}T00:00:00Z`);
    resultado.setUTCDate(resultado.getUTCDate() + dias);
    return resultado.toISOString().slice(0, 10);
}

function predecirPronosticos(datos) {
    const codigosBalanza = new Set(datos.productos
        .filter(producto => producto.es_producto_balanza)
        .map(producto => String(producto.codigo)));
    const historiales = new Map(datos.productos.map(producto => [
        String(producto.codigo),
        (producto.ventas || []).map(valor => Number(valor) || 0)
    ]));
    const codigosConModelo = new Set([...historiales.keys()].filter(codigo => indiceCodigo.has(codigo)));
    const acumulados = new Map([...historiales.keys()].map(codigo => [codigo, { 7: 0, 14: 0, 30: 0 }]));

    for (let avance = 1; avance <= 30; avance++) {
        const fecha = sumarDias(datos.fecha_corte, avance);
        for (const [codigo, historial] of historiales) {
            const unidades = codigosConModelo.has(codigo)
                ? predecirDia(codigo, fecha, historial)
                : (historial.slice(-28).reduce((suma, venta) => suma + venta, 0) / 28);
            historial.push(unidades);
            const totales = acumulados.get(codigo);
            if (avance <= 7) totales[7] += unidades;
            if (avance <= 14) totales[14] += unidades;
            totales[30] += unidades;
        }
    }

    return {
        fecha_corte: datos.fecha_corte,
        metodo: 'lightgbm_experimental',
        productos: [...acumulados].map(([codigo, totales]) => {
            const esProductoBalanza = codigosBalanza.has(codigo);
            const ajustarCantidad = valor => esProductoBalanza
                ? Number(valor.toFixed(4))
                : Math.ceil(valor);
            return {
                codigo,
                pronostico_7_dias: ajustarCantidad(totales[7]),
                pronostico_14_dias: ajustarCantidad(totales[14]),
                pronostico_30_dias: ajustarCantidad(totales[30]),
                disponible: true,
                origen: indiceCodigo.has(codigo) ? 'lightgbm' : 'promedio_28_dias'
            };
        })
    };
}

module.exports = { predecirPronosticos };
