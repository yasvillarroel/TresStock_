"""Limpia el CSV histórico y genera un dataset inicial para cada objetivo."""
import csv
import gc
import re
import statistics
from collections import Counter, defaultdict
from datetime import date, datetime, timedelta
from decimal import Decimal, InvalidOperation
from pathlib import Path

import pandas as pd


CARPETA = Path(__file__).resolve().parent
ARCHIVO_ORIGEN = CARPETA.parent / "info_inicial.csv"
CARPETAS_OBJETIVOS = {
    "pronostico": CARPETA / "01_pronostico_demanda",
    "reposicion": CARPETA / "02_reposicion_recomendada",
    "quiebre": CARPETA / "03_alertas_quiebre_stock",
    "tendencias": CARPETA / "04_estacionalidad_tendencias",
}
NOMBRES_ARCHIVOS = {
    "pronostico": "dataset_pronostico_demanda.csv",
    "reposicion": "dataset_reposicion.csv",
    "quiebre": "dataset_alertas_quiebre.csv",
    "tendencias": "dataset_estacionalidad_tendencias.csv",
}
NOMBRES_REPORTES = {
    objetivo: f"{Path(nombre).stem}_reporte.md"
    for objetivo, nombre in NOMBRES_ARCHIVOS.items()
}
TOTAL_CAMPOS = 32
INDICE_BOLETA = 14
INDICE_HORA = 16
INDICE_FECHA_VENTA = 19
INDICE_CODIGO = 20
INDICE_DESCRIPCION = 21
INDICE_PRECIO = 22
INDICE_PRECIO_DESCUENTO = 23
INDICE_CANTIDAD = 24
INDICE_TOTAL_LINEA = 26
ETIQUETAS_NO_PRODUCTO = {"", "TOTAL", "TOTALES", "TOTALES:"}
NOMBRES_CAMPOS_ORIGEN = [
    "campo_auxiliar_1", "titulo_reporte", "fecha_cierre_reporte", "periodo_exportado",
    "campo_auxiliar_2", "campo_auxiliar_3", "etiqueta_fecha", "etiqueta_codigo",
    "etiqueta_detalle", "etiqueta_precio", "etiqueta_precio_descuento", "etiqueta_cantidad",
    "etiqueta_stock", "etiqueta_total", "numero_boleta", "etiqueta_forma_pago",
    "hora_boleta", "cliente", "campo_auxiliar_4", "fecha_venta", "codigo_producto",
    "descripcion_producto", "precio_unitario", "precio_con_descuento", "cantidad",
    "stock_impreso", "total_linea", "etiqueta_total_repetida", "total_boleta",
    "etiqueta_totales", "total_acumulado_boleta", "indicador_final",
]
INDICES_NUMERICOS_ORIGEN = {22, 23, 24, 25, 26, 28, 30, 31}
INDICES_FECHA_ORIGEN = {2: "%d-%m-%Y", 19: "%d/%m/%Y"}
FORMATOS_FECHA_ORIGEN = {
    "fecha_cierre_reporte": "%d-%m-%Y",
    "fecha_venta": "%d/%m/%Y",
}
ESQUEMA_LIMPIO = [
    ("numero_boleta", "categorica"), ("fecha_hora", "fecha_hora"),
    ("codigo", "categorica"), ("descripcion", "categorica"),
    ("precio_unitario", "numerica"), ("precio_con_descuento", "numerica"),
    ("cantidad", "numerica"), ("valor_linea", "numerica"),
]


def decimal_local(texto):
    """Convierte valores como 1.234,56 o 1234 a Decimal."""
    valor = str(texto or "").strip().replace("$", "").replace(" ", "")
    if not valor:
        raise InvalidOperation
    if "," in valor:
        valor = valor.replace(".", "").replace(",", ".")
    elif re.fullmatch(r"-?\d{1,3}(?:\.\d{3})+", valor):
        valor = valor.replace(".", "")
    return Decimal(valor)


def parsear_fecha_hora(fila):
    fecha = datetime.strptime(fila[INDICE_FECHA_VENTA].strip(), "%d/%m/%Y").date()
    hora_texto = fila[INDICE_HORA].replace("HORA:", "").strip()
    try:
        hora = datetime.strptime(hora_texto, "%I:%M %p").time()
    except ValueError:
        hora = datetime.min.time()
    return datetime.combine(fecha, hora)


def nuevo_acumulador():
    return {"total": 0, "vacios": 0, "invalidos": 0, "valores": Counter(), "numeros": [], "fechas": []}


def agregar_a_perfil(perfil, nombre, valor, tipo):
    acumulador = perfil[nombre]
    acumulador["total"] += 1
    texto = str(valor or "").strip()
    if not texto:
        acumulador["vacios"] += 1
        return
    try:
        if tipo == "numerica":
            numero = decimal_local(texto)
            acumulador["numeros"].append(float(numero))
            acumulador["valores"][numero] += 1
        elif tipo == "fecha":
            fecha = datetime.strptime(texto, FORMATOS_FECHA_ORIGEN.get(nombre, "%Y-%m-%d")).date()
            acumulador["fechas"].append(fecha)
            acumulador["valores"][fecha] += 1
        elif tipo == "fecha_hora":
            fecha_hora = datetime.fromisoformat(texto)
            acumulador["fechas"].append(fecha_hora)
            acumulador["valores"][fecha_hora] += 1
        else:
            acumulador["valores"][texto] += 1
    except (ValueError, InvalidOperation):
        acumulador["invalidos"] += 1


def formatear_fecha(valor):
    if isinstance(valor, datetime):
        return valor.strftime("%Y-%m-%d %H:%M:%S")
    if isinstance(valor, date):
        return valor.isoformat()
    return str(valor)


def generar_informe_variables(ruta, titulo, subtitulo, perfil, privacidad=()):
    lineas = [
        f"# {titulo}", "", subtitulo, "",
        "Cada variable se presenta por separado. `Válidos` indica los valores que pudieron interpretarse; `vacíos` e `inválidos` se cuentan antes de excluir filas.",
        "",
    ]
    for nombre, acumulador in perfil.items():
        valores = acumulador["valores"]
        cantidad_valida = sum(valores.values())
        distintos = len(valores)
        tipo = ESQUEMA_TIPOS.get(nombre, "categorica")
        tipo = {"categorica": "categórica", "numerica": "numérica"}.get(tipo, tipo)
        lineas.extend([f"## {nombre}", "", f"- **Tipo:** {tipo}"])
        lineas.append(f"- **Registros:** {formatear_entero(acumulador['total'])} · **Válidos:** {formatear_entero(cantidad_valida)} · **Vacíos:** {formatear_entero(acumulador['vacios'])} · **Inválidos:** {formatear_entero(acumulador['invalidos'])} · **Valores distintos:** {formatear_entero(distintos)}")
        if nombre in privacidad:
            lineas.append("- **Moda:** omitida para no exponer datos personales o identificadores de boleta.")
        elif valores:
            mayor_frecuencia = max(valores.values())
            modas = [valor for valor, frecuencia in valores.items() if frecuencia == mayor_frecuencia][:3]
            etiqueta_moda = "Moda" if len(modas) == 1 else "Modas empatadas (máximo 3 mostradas)"
            texto_modas = "; ".join(f"`{formatear_fecha(valor) if isinstance(valor, (date, datetime)) else valor}` ({formatear_entero(valores[valor])})" for valor in modas)
            lineas.append(f"- **{etiqueta_moda}:** {texto_modas}.")
        else:
            lineas.append("- **Moda:** sin datos válidos.")

        if acumulador["numeros"]:
            numeros = acumulador["numeros"]
            q1, _, q3 = statistics.quantiles(numeros, n=4, method="inclusive") if len(numeros) > 1 else (numeros[0], numeros[0], numeros[0])
            lineas.append(
                f"- **Estadísticos:** mínimo `{formatear_estadistico(min(numeros))}`, Q1 `{formatear_estadistico(q1)}`, "
                f"media `{formatear_estadistico(statistics.fmean(numeros))}`, mediana `{formatear_estadistico(statistics.median(numeros))}`, "
                f"Q3 `{formatear_estadistico(q3)}`, máximo `{formatear_estadistico(max(numeros))}`, "
                f"desviación estándar `{formatear_estadistico(statistics.stdev(numeros) if len(numeros) > 1 else 0)}`."
            )
        elif acumulador["fechas"]:
            lineas.append(f"- **Rango:** desde `{formatear_fecha(min(acumulador['fechas']))}` hasta `{formatear_fecha(max(acumulador['fechas']))}`.")
        elif nombre not in privacidad:
            mas_frecuentes = valores.most_common(3)
            lineas.append("- **Valores más frecuentes:** " + ("; ".join(f"`{valor}` ({formatear_entero(frecuencia)})" for valor, frecuencia in mas_frecuentes) if mas_frecuentes else "sin datos válidos") + ".")
        lineas.append("")
    ruta.write_text("\n".join(lineas), encoding="utf-8")
    return ruta


ESQUEMA_TIPOS = {nombre: tipo for nombre, tipo in ESQUEMA_LIMPIO}
ESQUEMA_TIPOS.update({NOMBRES_CAMPOS_ORIGEN[i]: "numérica" for i in INDICES_NUMERICOS_ORIGEN})
ESQUEMA_TIPOS.update({NOMBRES_CAMPOS_ORIGEN[i]: "fecha" for i in INDICES_FECHA_ORIGEN})
ESQUEMA_TIPOS["fecha_hora"] = "fecha y hora"


def normalizar_ventas():
    if not ARCHIVO_ORIGEN.is_file():
        raise FileNotFoundError(f"No se encontró el CSV inicial: {ARCHIVO_ORIGEN}")

    ventas = defaultdict(Decimal)
    correcciones = defaultdict(Decimal)
    productos = {}
    filas_fuente = 0
    filas_validas = 0
    filas_rechazadas = 0
    perfil_crudo = {nombre: nuevo_acumulador() for nombre in NOMBRES_CAMPOS_ORIGEN}
    perfil_limpio = {nombre: nuevo_acumulador() for nombre, _ in ESQUEMA_LIMPIO}

    with ARCHIVO_ORIGEN.open("r", encoding="cp1252", newline="") as archivo:
        lector = csv.reader(archivo)
        for numero_fila, fila in enumerate(lector, start=1):
            filas_fuente += 1
            for indice, nombre in enumerate(NOMBRES_CAMPOS_ORIGEN):
                tipo = "numerica" if indice in INDICES_NUMERICOS_ORIGEN else "fecha" if indice in INDICES_FECHA_ORIGEN else "categorica"
                agregar_a_perfil(perfil_crudo, nombre, fila[indice] if indice < len(fila) else "", tipo)
            if len(fila) != TOTAL_CAMPOS:
                filas_rechazadas += 1
                continue
            try:
                fecha_hora = parsear_fecha_hora(fila)
                codigo = fila[INDICE_CODIGO].strip()
                descripcion = fila[INDICE_DESCRIPCION].strip()
                cantidad = decimal_local(fila[INDICE_CANTIDAD])
                precio = decimal_local(fila[INDICE_PRECIO])
                precio_descuento = decimal_local(fila[INDICE_PRECIO_DESCUENTO])
                total_linea = decimal_local(fila[INDICE_TOTAL_LINEA])
            except (ValueError, InvalidOperation, IndexError):
                filas_rechazadas += 1
                continue

            if codigo.upper() in ETIQUETAS_NO_PRODUCTO or not descripcion or cantidad == 0:
                filas_rechazadas += 1
                continue

            numero_boleta = " ".join(re.findall(r"\d+", fila[INDICE_BOLETA]))
            valores_limpios = {
                "numero_boleta": numero_boleta,
                "fecha_hora": fecha_hora.isoformat(sep=" "),
                "codigo": codigo,
                "descripcion": descripcion,
                "precio_unitario": precio,
                "precio_con_descuento": precio_descuento,
                "cantidad": cantidad,
                "valor_linea": total_linea,
            }
            for nombre, tipo in ESQUEMA_LIMPIO:
                agregar_a_perfil(perfil_limpio, nombre, valores_limpios[nombre], tipo)

            dia = fecha_hora.date()
            clave = (codigo, dia)
            if cantidad > 0:
                ventas[clave] += cantidad
            else:
                correcciones[clave] += abs(cantidad)
            productos[codigo] = descripcion
            filas_validas += 1

    if not ventas:
        raise ValueError("No se encontraron líneas de venta válidas en el CSV inicial.")

    fechas_por_codigo = defaultdict(list)
    for codigo, dia in ventas:
        fechas_por_codigo[codigo].append(dia)
    fecha_inicial = min(dia for _, dia in ventas)
    fecha_final = max(dia for _, dia in ventas)
    return {
        "ventas": ventas,
        "correcciones": correcciones,
        "productos": productos,
        "fechas_por_codigo": fechas_por_codigo,
        "fecha_inicial": fecha_inicial,
        "fecha_final": fecha_final,
        "filas_fuente": filas_fuente,
        "filas_validas": filas_validas,
        "filas_rechazadas": filas_rechazadas,
        "perfil_crudo": perfil_crudo,
        "perfil_limpio": perfil_limpio,
    }


def detectar_dias_atipicos(ventas):
    por_producto = defaultdict(list)
    for (codigo, _), unidades in ventas.items():
        if unidades > 0:
            por_producto[codigo].append(float(unidades))

    limites = {}
    for codigo, cantidades in por_producto.items():
        if len(cantidades) < 20:
            continue
        q1, _, q3 = statistics.quantiles(cantidades, n=4, method="inclusive")
        limites[codigo] = q3 + 1.5 * (q3 - q1)

    atipicos = set()
    for (codigo, dia), unidades in ventas.items():
        limite = limites.get(codigo)
        if limite is not None and float(unidades) > limite:
            atipicos.add((codigo, dia))
    return atipicos


def construir_series(datos):
    ventas = datos["ventas"]
    correcciones = datos["correcciones"]
    series = {}
    for codigo, fechas in datos["fechas_por_codigo"].items():
        inicio = min(fechas)
        dias = []
        unidades = []
        ajustes = []
        dia = inicio
        while dia <= datos["fecha_final"]:
            dias.append(dia)
            unidades.append(ventas.get((codigo, dia), Decimal("0")))
            ajustes.append(correcciones.get((codigo, dia), Decimal("0")))
            dia += timedelta(days=1)
        series[codigo] = (dias, unidades, ajustes)
    return series


def construir_prefijos(valores):
    prefijos = [Decimal("0")]
    for valor in valores:
        prefijos.append(prefijos[-1] + valor)
    return prefijos


def suma_rango(prefijos, inicio, fin):
    """Suma inclusiva de índices; devuelve cero para intervalos vacíos."""
    if inicio > fin:
        return Decimal("0")
    return prefijos[fin + 1] - prefijos[inicio]


def escribir_pronostico(datos, series, atipicos):
    ruta = CARPETAS_OBJETIVOS["pronostico"] / NOMBRES_ARCHIVOS["pronostico"]
    columnas = ["codigo", "descripcion", "fecha_corte", "dia_semana", "mes", "unidades_dia_corte", "unidades_mismo_dia_semana_anterior", "promedio_7_dias", "promedio_28_dias", "objetivo_7_dias", "objetivo_14_dias", "objetivo_30_dias"]
    filas = 0
    with ruta.open("w", encoding="utf-8-sig", newline="") as archivo:
        escritor = csv.DictWriter(archivo, fieldnames=columnas)
        escritor.writeheader()
        for codigo, (dias, unidades, _) in series.items():
            prefijos = construir_prefijos(unidades)
            for indice in range(27, len(dias) - 30):
                corte = dias[indice]
                fechas_revisar = [(codigo, dias[pos]) for pos in range(indice - 27, indice + 31)]
                if any(fecha in atipicos for fecha in fechas_revisar):
                    continue
                escritor.writerow({
                    "codigo": codigo,
                    "descripcion": datos["productos"][codigo],
                    "fecha_corte": corte.isoformat(),
                    "dia_semana": corte.weekday(),
                    "mes": corte.month,
                    "unidades_dia_corte": f"{unidades[indice]:.4f}",
                    "unidades_mismo_dia_semana_anterior": f"{unidades[indice - 7]:.4f}",
                    "promedio_7_dias": f"{suma_rango(prefijos, indice - 6, indice) / Decimal(7):.4f}",
                    "promedio_28_dias": f"{suma_rango(prefijos, indice - 27, indice) / Decimal(28):.4f}",
                    "objetivo_7_dias": f"{suma_rango(prefijos, indice + 1, indice + 7):.4f}",
                    "objetivo_14_dias": f"{suma_rango(prefijos, indice + 1, indice + 14):.4f}",
                    "objetivo_30_dias": f"{suma_rango(prefijos, indice + 1, indice + 30):.4f}",
                })
                filas += 1
    return ruta, filas


def metricas_recientes(dias, unidades, fecha_final, ventana):
    inicio = fecha_final - timedelta(days=ventana - 1)
    indices = [indice for indice, dia in enumerate(dias) if inicio <= dia <= fecha_final]
    total = sum((unidades[indice] for indice in indices), Decimal("0"))
    return total, total / Decimal(ventana)


def escribir_reposicion(datos, series):
    ruta = CARPETAS_OBJETIVOS["reposicion"] / NOMBRES_ARCHIVOS["reposicion"]
    columnas = ["codigo", "descripcion", "fecha_corte", "unidades_7_dias", "promedio_diario_7_dias", "unidades_28_dias", "promedio_diario_28_dias", "unidades_90_dias", "promedio_diario_90_dias", "dias_con_venta_90_dias", "stock_actual_pendiente_bd", "stock_minimo_pendiente_bd", "plazo_entrega_pendiente_bd", "ordenes_pendientes_compra"]
    filas = 0
    with ruta.open("w", encoding="utf-8-sig", newline="") as archivo:
        escritor = csv.DictWriter(archivo, fieldnames=columnas)
        escritor.writeheader()
        for codigo, (dias, unidades, _) in series.items():
            fecha_final = datos["fecha_final"]
            u7, p7 = metricas_recientes(dias, unidades, fecha_final, 7)
            u28, p28 = metricas_recientes(dias, unidades, fecha_final, 28)
            u90, p90 = metricas_recientes(dias, unidades, fecha_final, 90)
            inicio90 = fecha_final - timedelta(days=89)
            dias_venta90 = sum(unidades[i] > 0 for i, dia in enumerate(dias) if inicio90 <= dia <= fecha_final)
            escritor.writerow({
                "codigo": codigo, "descripcion": datos["productos"][codigo], "fecha_corte": fecha_final.isoformat(),
                "unidades_7_dias": f"{u7:.4f}", "promedio_diario_7_dias": f"{p7:.4f}",
                "unidades_28_dias": f"{u28:.4f}", "promedio_diario_28_dias": f"{p28:.4f}",
                "unidades_90_dias": f"{u90:.4f}", "promedio_diario_90_dias": f"{p90:.4f}",
                "dias_con_venta_90_dias": dias_venta90,
                "stock_actual_pendiente_bd": "", "stock_minimo_pendiente_bd": "",
                "plazo_entrega_pendiente_bd": "", "ordenes_pendientes_compra": "",
            })
            filas += 1
    return ruta, filas


def escribir_alertas_quiebre(datos, series):
    ruta = CARPETAS_OBJETIVOS["quiebre"] / NOMBRES_ARCHIVOS["quiebre"]
    columnas = ["codigo", "descripcion", "fecha_corte", "ultima_fecha_con_venta", "dias_desde_ultima_venta", "promedio_diario_7_dias", "promedio_diario_28_dias", "unidades_28_dias", "stock_actual_pendiente_bd", "stock_minimo_pendiente_bd", "plazo_entrega_pendiente_bd", "cobertura_stock_dias_pendiente_bd"]
    filas = 0
    with ruta.open("w", encoding="utf-8-sig", newline="") as archivo:
        escritor = csv.DictWriter(archivo, fieldnames=columnas)
        escritor.writeheader()
        for codigo, (dias, unidades, _) in series.items():
            ventas_producto = [(dia, unidades[i]) for i, dia in enumerate(dias) if unidades[i] > 0]
            ultima_venta = max((dia for dia, _ in ventas_producto), default=None)
            _, promedio7 = metricas_recientes(dias, unidades, datos["fecha_final"], 7)
            unidades28, promedio28 = metricas_recientes(dias, unidades, datos["fecha_final"], 28)
            escritor.writerow({
                "codigo": codigo, "descripcion": datos["productos"][codigo],
                "fecha_corte": datos["fecha_final"].isoformat(),
                "ultima_fecha_con_venta": ultima_venta.isoformat() if ultima_venta else "",
                "dias_desde_ultima_venta": (datos["fecha_final"] - ultima_venta).days if ultima_venta else "",
                "promedio_diario_7_dias": f"{promedio7:.4f}",
                "promedio_diario_28_dias": f"{promedio28:.4f}", "unidades_28_dias": f"{unidades28:.4f}",
                "stock_actual_pendiente_bd": "", "stock_minimo_pendiente_bd": "",
                "plazo_entrega_pendiente_bd": "", "cobertura_stock_dias_pendiente_bd": "",
            })
            filas += 1
    return ruta, filas


def escribir_tendencias(datos, series, atipicos):
    ruta = CARPETAS_OBJETIVOS["tendencias"] / NOMBRES_ARCHIVOS["tendencias"]
    columnas = ["codigo", "descripcion", "fecha", "dia_semana", "mes", "anio", "unidades_vendidas", "correcciones_negativas", "es_dia_atipico"]
    filas = 0
    with ruta.open("w", encoding="utf-8-sig", newline="") as archivo:
        escritor = csv.DictWriter(archivo, fieldnames=columnas)
        escritor.writeheader()
        for codigo, (dias, unidades, correcciones) in series.items():
            for indice, dia in enumerate(dias):
                escritor.writerow({
                    "codigo": codigo, "descripcion": datos["productos"][codigo], "fecha": dia.isoformat(),
                    "dia_semana": dia.weekday(), "mes": dia.month, "anio": dia.year,
                    "unidades_vendidas": f"{unidades[indice]:.4f}",
                    "correcciones_negativas": f"{correcciones[indice]:.4f}",
                    "es_dia_atipico": str((codigo, dia) in atipicos).lower(),
                })
                filas += 1
    return ruta, filas


def texto_markdown(valor):
    return str(valor).replace("|", "\\|").replace("\n", " ").strip()


def formatear_estadistico(valor):
    if pd.isna(valor):
        return "—"
    if isinstance(valor, (float, int)):
        return f"{valor:,.4f}".replace(",", "X").replace(".", ",").replace("X", ".")
    return texto_markdown(valor)


def formatear_entero(valor):
    return f"{int(valor):,}".replace(",", ".")


def escribir_reporte_descriptivo(objetivo, ruta_csv, filas_generadas):
    """Genera un reporte Markdown legible con calidad y estadísticos por variable."""
    with ruta_csv.open("r", encoding="utf-8-sig", newline="") as archivo:
        columnas = next(csv.reader(archivo))
    columnas_categoricas = {nombre: "category" for nombre in ("codigo", "descripcion", "es_dia_atipico") if nombre in columnas}
    datos = pd.read_csv(ruta_csv, encoding="utf-8-sig", dtype=columnas_categoricas, low_memory=False)
    nombres_fecha = {nombre for nombre in columnas if nombre.startswith("fecha") or nombre == "ultima_fecha_con_venta"}
    for nombre in nombres_fecha:
        datos[nombre] = pd.to_datetime(datos[nombre], errors="coerce")

    reporte = [
        f"# Reporte descriptivo: {objetivo}",
        "",
        f"- **Archivo:** `{ruta_csv.name}`",
        f"- **Filas:** {formatear_entero(len(datos))}",
        f"- **Variables:** {len(datos.columns)}",
        "- **Nota:** media, mediana, desviación estándar y cuartiles solo aplican a variables numéricas.",
        "",
        "## Variables",
        "",
        "Cada bloque muestra una variable por separado para facilitar su lectura.",
        "",
    ]

    for nombre in datos.columns:
        serie = datos[nombre]
        no_vacios = int(serie.notna().sum())
        vacios = int(serie.isna().sum())
        distintos = int(serie.nunique(dropna=True))
        frecuencias = serie.value_counts(dropna=True).head(3)
        moda = "; ".join(
            f"{formatear_estadistico(valor) if pd.api.types.is_numeric_dtype(serie) else texto_markdown(valor)} ({formatear_entero(frecuencia)})"
            for valor, frecuencia in frecuencias.items()
        ) or "—"
        if nombre in nombres_fecha:
            tipo = "fecha"
            minimo = formatear_estadistico(serie.min().date() if no_vacios else None)
            maximo = formatear_estadistico(serie.max().date() if no_vacios else None)
            q1 = media = mediana = q3 = desviacion = "—"
        elif pd.api.types.is_numeric_dtype(serie):
            tipo = "numérica"
            if no_vacios:
                minimo = formatear_estadistico(serie.min())
                maximo = formatear_estadistico(serie.max())
                q1 = formatear_estadistico(serie.quantile(0.25))
                media = formatear_estadistico(serie.mean())
                mediana = formatear_estadistico(serie.median())
                q3 = formatear_estadistico(serie.quantile(0.75))
                desviacion = formatear_estadistico(serie.std())
            else:
                minimo = q1 = media = mediana = q3 = maximo = desviacion = "—"
        else:
            tipo = "categórica"
            minimo = q1 = media = mediana = q3 = maximo = desviacion = "—"

        reporte.extend([
            f"### {texto_markdown(nombre)}",
            "",
            f"- **Tipo:** {tipo}",
            f"- **Filas con dato:** {formatear_entero(no_vacios)} · **Vacías:** {formatear_entero(vacios)} · **Valores distintos:** {formatear_entero(distintos)}",
            f"- **Moda y frecuencia:** {moda}",
        ])
        if tipo == "fecha":
            reporte.append(f"- **Rango:** desde `{minimo}` hasta `{maximo}`.")
        elif tipo == "numérica" and no_vacios:
            reporte.append(f"- **Mínimo:** `{minimo}` · **Q1:** `{q1}` · **Media:** `{media}` · **Mediana:** `{mediana}` · **Q3:** `{q3}` · **Máximo:** `{maximo}` · **Desviación estándar:** `{desviacion}`.")
        elif tipo == "numérica":
            reporte.append("- No hay datos para calcular estadísticas; el campo espera información externa de PostgreSQL.")
        reporte.append("")

    reporte.extend([
        "",
        "## Lectura rápida",
        "",
        "- Revisa primero las columnas con valores vacíos; algunos campos de inventario y proveedores quedan pendientes de completar desde PostgreSQL.",
        "- Compara mínimo, cuartiles, mediana y máximo para detectar escalas o valores que requieran revisión.",
        "- En variables categóricas, la moda y los valores distintos ayudan a encontrar códigos o etiquetas inesperadas.",
        "",
    ])
    ruta_reporte = ruta_csv.with_name(NOMBRES_REPORTES[objetivo])
    ruta_reporte.write_text("\n".join(reporte), encoding="utf-8")
    del datos
    gc.collect()
    return ruta_reporte


def main():
    for carpeta in CARPETAS_OBJETIVOS.values():
        carpeta.mkdir(parents=True, exist_ok=True)

    datos = normalizar_ventas()
    ruta_reporte_previo = CARPETA / "reporte_pre_limpieza.md"
    generar_informe_variables(
        ruta_reporte_previo,
        "Perfil del dataset antes de la limpieza",
        f"Fuente: `{ARCHIVO_ORIGEN.name}` · {formatear_entero(datos['filas_fuente'])} filas leídas, distribuidas en las 32 posiciones originales del CSV.",
        datos["perfil_crudo"],
        privacidad={"cliente", "numero_boleta"},
    )
    ruta_reporte_limpio = CARPETA / "reporte_post_limpieza.md"
    generar_informe_variables(
        ruta_reporte_limpio,
        "Perfil de las ventas después de la limpieza",
        f"Se describen las {formatear_entero(datos['filas_validas'])} líneas válidas normalizadas antes de agregarlas por producto y día. Se excluyeron {formatear_entero(datos['filas_rechazadas'])} líneas inválidas.",
        datos["perfil_limpio"],
        privacidad={"numero_boleta"},
    )
    print(f"Reporte previo a limpieza: {ruta_reporte_previo.relative_to(CARPETA)}")
    print(f"Reporte posterior a limpieza: {ruta_reporte_limpio.relative_to(CARPETA)}")
    series = construir_series(datos)
    atipicos = detectar_dias_atipicos(datos["ventas"])
    resultados = [
        escribir_pronostico(datos, series, atipicos),
        escribir_reposicion(datos, series),
        escribir_alertas_quiebre(datos, series),
        escribir_tendencias(datos, series, atipicos),
    ]

    print(f"Filas leídas: {datos['filas_fuente']:,}")
    print(f"Líneas válidas: {datos['filas_validas']:,}; rechazadas: {datos['filas_rechazadas']:,}")
    print(f"Productos: {len(datos['productos']):,}; periodo: {datos['fecha_inicial']} a {datos['fecha_final']}")
    print(f"Días producto marcados como atípicos: {len(atipicos):,}")
    for objetivo, (ruta, filas) in zip(CARPETAS_OBJETIVOS, resultados):
        print(f"{ruta.relative_to(CARPETA)}: {filas:,} filas")
        ruta_reporte = escribir_reporte_descriptivo(objetivo, ruta, filas)
        print(f"{ruta_reporte.relative_to(CARPETA)}: reporte descriptivo generado")
    print("Los CSV de origen y la base de datos no se modificaron.")


if __name__ == "__main__":
    main()
