"""Predice hasta 30 días a partir de ventas diarias recibidas por stdin."""
import json
import sys
from datetime import date, timedelta
from pathlib import Path

import pandas as pd
from lightgbm import Booster


CARPETA = Path(__file__).resolve().parent
MODELO = Booster(model_file=str(CARPETA / "modelo_demanda_lightgbm.txt"))
METADATOS = json.loads((CARPETA / "metadatos_modelo.json").read_text(encoding="utf-8"))
CATEGORIAS_CODIGO = METADATOS["categorias_codigo"]
FECHA_BASE = date.fromisoformat(METADATOS["periodo_datos"]["fecha_base_indice"])
VARIABLES = METADATOS["variables_entrada"]


def predecir(datos):
    fecha_corte = date.fromisoformat(datos["fecha_corte"])
    productos = {str(p["codigo"]): [float(v or 0) for v in p["ventas"]] for p in datos["productos"]}
    acumulados = {codigo: {7: 0.0, 14: 0.0, 30: 0.0} for codigo in productos}

    for avance in range(1, 31):
        fecha = fecha_corte + timedelta(days=avance)
        codigos_abiertos = [codigo for codigo in productos if fecha.weekday() != 6 and codigo in CATEGORIAS_CODIGO]
        predicciones = {}
        if codigos_abiertos:
            filas = []
            for codigo in codigos_abiertos:
                historial = productos[codigo]
                filas.append({
                    "codigo": codigo,
                    "dia_semana": fecha.weekday(),
                    "mes": fecha.month,
                    "indice_fecha": (fecha - FECHA_BASE).days,
                    "venta_mismo_dia_semana_1": historial[-7],
                    "venta_mismo_dia_semana_2": historial[-14],
                    "promedio_ultimos_4_mismos_dias": sum(historial[-35:-7]) / 28,
                    "promedio_ultimos_7_dias": sum(historial[-7:]) / 7,
                    "promedio_ultimos_28_dias": sum(historial[-28:]) / 28,
                })
            entradas = pd.DataFrame(filas, columns=VARIABLES)
            entradas["codigo"] = pd.Categorical(entradas["codigo"], categories=CATEGORIAS_CODIGO)
            valores = MODELO.predict(entradas)
            predicciones = {codigo: max(0.0, float(valor)) for codigo, valor in zip(codigos_abiertos, valores)}

        for codigo, historial in productos.items():
            unidades = predicciones.get(codigo, 0.0)
            historial.append(unidades)
            for horizonte in (7, 14, 30):
                if avance <= horizonte:
                    acumulados[codigo][horizonte] += unidades

    return {
        "fecha_corte": fecha_corte.isoformat(),
        "metodo": "lightgbm_experimental",
        "productos": [
            {"codigo": codigo, "pronostico_7_dias": round(valores[7], 4), "pronostico_14_dias": round(valores[14], 4), "pronostico_30_dias": round(valores[30], 4), "disponible": codigo in CATEGORIAS_CODIGO}
            for codigo, valores in acumulados.items()
        ],
    }


if __name__ == "__main__":
    try:
        print(json.dumps(predecir(json.load(sys.stdin)), ensure_ascii=False))
    except Exception as error:
        print(json.dumps({"error": str(error)}, ensure_ascii=False), file=sys.stderr)
        sys.exit(1)
