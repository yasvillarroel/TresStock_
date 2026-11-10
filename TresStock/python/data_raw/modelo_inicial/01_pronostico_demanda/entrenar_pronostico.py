"""Entrena y evalúa una regresión lineal inicial para pronóstico de demanda."""
import json
from datetime import timedelta
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler


CARPETA = Path(__file__).resolve().parent
ARCHIVO_DATASET = CARPETA / "dataset_pronostico_demanda.csv"
CARPETA_MODELOS = CARPETA / "modelos"
ARCHIVO_JSON = CARPETA / "evaluacion_pronostico.json"
ARCHIVO_REPORTE = CARPETA / "evaluacion_pronostico.md"
VARIABLES_CATEGORICAS = ["codigo", "dia_semana", "mes"]
VARIABLES_NUMERICAS = [
    "unidades_dia_corte",
    "unidades_mismo_dia_semana_anterior",
    "promedio_7_dias",
    "promedio_28_dias",
]
HORIZONTES = {
    7: "objetivo_7_dias",
    14: "objetivo_14_dias",
    30: "objetivo_30_dias",
}


def calcular_metricas(real, estimado):
    estimado = np.maximum(estimado, 0)
    denominador_wape = float(np.abs(real).sum())
    return {
        "mae": float(mean_absolute_error(real, estimado)),
        "rmse": float(np.sqrt(mean_squared_error(real, estimado))),
        "wape_porcentaje": float(np.abs(real - estimado).sum() / denominador_wape * 100) if denominador_wape else None,
        "sesgo_promedio": float(np.mean(estimado - real)),
        "r2": float(r2_score(real, estimado)),
    }


def crear_modelo():
    transformador = ColumnTransformer(
        transformers=[
            ("producto_calendario", OneHotEncoder(handle_unknown="ignore", sparse_output=True), VARIABLES_CATEGORICAS),
            ("demanda_reciente", StandardScaler(with_mean=False), VARIABLES_NUMERICAS),
        ],
        remainder="drop",
    )
    return Pipeline([
        ("variables", transformador),
        ("regresion_lineal", LinearRegression()),
    ])


def formato_numero(valor, decimales=3):
    if valor is None:
        return "—"
    return f"{valor:,.{decimales}f}".replace(",", "X").replace(".", ",").replace("X", ".")


def main():
    if not ARCHIVO_DATASET.is_file():
        raise FileNotFoundError(
            f"No existe {ARCHIVO_DATASET}. Ejecuta primero preparar_modelo_inicial.py."
        )

    columnas_requeridas = [
        "codigo", "fecha_corte", *VARIABLES_CATEGORICAS[1:], *VARIABLES_NUMERICAS,
        *HORIZONTES.values(),
    ]
    datos = pd.read_csv(ARCHIVO_DATASET, usecols=columnas_requeridas, dtype={"codigo": "string"})
    datos["fecha_corte"] = pd.to_datetime(datos["fecha_corte"], errors="raise")
    datos = datos.sort_values("fecha_corte").reset_index(drop=True)
    fechas = datos["fecha_corte"].drop_duplicates().sort_values().reset_index(drop=True)
    if len(fechas) < 10:
        raise ValueError("Hay muy pocas fechas para separar entrenamiento y evaluación cronológicamente.")

    indice_corte = max(1, int(len(fechas) * 0.8))
    fecha_inicio_prueba = fechas.iloc[indice_corte]
    fecha_fin_entrenamiento = fecha_inicio_prueba - timedelta(days=max(HORIZONTES))
    mascara_entrenamiento = datos["fecha_corte"] <= fecha_fin_entrenamiento
    mascara_prueba = datos["fecha_corte"] >= fecha_inicio_prueba
    entrenamiento = datos.loc[mascara_entrenamiento]
    prueba = datos.loc[mascara_prueba]
    if entrenamiento.empty or prueba.empty:
        raise ValueError("La separación temporal dejó entrenamiento o evaluación sin filas.")

    variables = [*VARIABLES_CATEGORICAS, *VARIABLES_NUMERICAS]
    x_entrenamiento = entrenamiento[variables].copy()
    x_prueba = prueba[variables].copy()
    for columna in VARIABLES_CATEGORICAS:
        x_entrenamiento[columna] = x_entrenamiento[columna].astype("string")
        x_prueba[columna] = x_prueba[columna].astype("string")

    CARPETA_MODELOS.mkdir(parents=True, exist_ok=True)
    resultados = {
        "objetivo": "Pronosticar unidades vendidas por producto",
        "algoritmo": "Regresión lineal con codificación one-hot de producto y calendario",
        "separacion": {
            "tipo": "cronológica; se dejan 30 días de separación para evitar que las etiquetas futuras de entrenamiento invadan el periodo de prueba",
            "desde_entrenamiento": entrenamiento["fecha_corte"].min().date().isoformat(),
            "hasta_entrenamiento": entrenamiento["fecha_corte"].max().date().isoformat(),
            "desde_prueba": prueba["fecha_corte"].min().date().isoformat(),
            "hasta_prueba": prueba["fecha_corte"].max().date().isoformat(),
            "filas_entrenamiento": int(len(entrenamiento)),
            "filas_prueba": int(len(prueba)),
            "filas_descartadas_por_separacion": int(len(datos) - len(entrenamiento) - len(prueba)),
        },
        "variables_predictoras": variables,
        "modelos_por_horizonte": {},
    }
    lineas = [
        "# Evaluación inicial del pronóstico de demanda", "",
        "Se entrenó una regresión lineal independiente para cada horizonte. La prueba contiene fechas posteriores al entrenamiento; se dejó un intervalo de 30 días entre ambos para reducir filtración entre etiquetas futuras.", "",
        f"- **Entrenamiento:** {resultados['separacion']['desde_entrenamiento']} a {resultados['separacion']['hasta_entrenamiento']} ({len(entrenamiento):,} filas).".replace(",", "."),
        f"- **Evaluación:** {resultados['separacion']['desde_prueba']} a {resultados['separacion']['hasta_prueba']} ({len(prueba):,} filas).".replace(",", "."),
        f"- **Filas apartadas en la brecha temporal:** {resultados['separacion']['filas_descartadas_por_separacion']:,}.".replace(",", "."),
        "- Las predicciones negativas se recortan a cero al calcular métricas, porque la demanda no puede ser negativa.",
        "- WAPE mide el error absoluto total como porcentaje de las unidades reales; menor es mejor.", "",
    ]

    for horizonte, columna_objetivo in HORIZONTES.items():
        y_entrenamiento = entrenamiento[columna_objetivo].astype(float)
        y_real = prueba[columna_objetivo].astype(float).to_numpy()
        modelo = crear_modelo()
        modelo.fit(x_entrenamiento, y_entrenamiento)
        prediccion = modelo.predict(x_prueba)
        metricas_modelo = calcular_metricas(y_real, prediccion)

        promedio_diario = prueba["promedio_28_dias"].astype(float).to_numpy()
        metricas_referencia = calcular_metricas(y_real, promedio_diario * horizonte)
        mejora_mae = metricas_referencia["mae"] - metricas_modelo["mae"]
        resultados["modelos_por_horizonte"][str(horizonte)] = {
            "variable_objetivo": columna_objetivo,
            "metricas_regresion_lineal": metricas_modelo,
            "referencia_promedio_28_dias": metricas_referencia,
            "mejora_mae_vs_referencia": float(mejora_mae),
            "supera_referencia_en_mae": bool(mejora_mae > 0),
        }
        archivo_modelo = CARPETA_MODELOS / f"regresion_lineal_{horizonte}_dias.joblib"
        joblib.dump({"modelo": modelo, "variables": variables, "horizonte_dias": horizonte}, archivo_modelo)

        lineas.extend([
            f"## Horizonte de {horizonte} días", "",
            f"- **Objetivo:** `{columna_objetivo}`.",
            f"- **Regresión lineal:** MAE {formato_numero(metricas_modelo['mae'])} unidades · RMSE {formato_numero(metricas_modelo['rmse'])} · WAPE {formato_numero(metricas_modelo['wape_porcentaje'])}% · sesgo {formato_numero(metricas_modelo['sesgo_promedio'])} · R² {formato_numero(metricas_modelo['r2'])}.",
            f"- **Referencia (promedio diario de 28 días × {horizonte}):** MAE {formato_numero(metricas_referencia['mae'])} · RMSE {formato_numero(metricas_referencia['rmse'])} · WAPE {formato_numero(metricas_referencia['wape_porcentaje'])}%.",
            f"- **Comparación:** {'la regresión mejora' if mejora_mae > 0 else 'la regresión no mejora'} el MAE de la referencia por {formato_numero(abs(mejora_mae))} unidades.",
            f"- **Modelo guardado:** `{archivo_modelo.relative_to(CARPETA)}`.", "",
        ])

    ARCHIVO_JSON.write_text(json.dumps(resultados, ensure_ascii=False, indent=2), encoding="utf-8")
    ARCHIVO_REPORTE.write_text("\n".join(lineas), encoding="utf-8")
    print(f"Reporte: {ARCHIVO_REPORTE}")
    print(f"Métricas estructuradas: {ARCHIVO_JSON}")
    print(f"Modelos: {CARPETA_MODELOS}")


if __name__ == "__main__":
    main()
