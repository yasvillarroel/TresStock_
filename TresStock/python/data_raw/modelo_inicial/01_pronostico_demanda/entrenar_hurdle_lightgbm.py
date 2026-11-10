"""Entrena un pronóstico hurdle: probabilidad de venta × tamaño de venta."""
import json
from datetime import timedelta
from pathlib import Path

import joblib
import lightgbm as lgb
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


CARPETA = Path(__file__).resolve().parent
ARCHIVO_DATASET = CARPETA / "dataset_pronostico_demanda.csv"
ARCHIVO_COMPARACION = CARPETA / "comparacion_modelos.json"
CARPETA_MODELOS = CARPETA / "modelos_lightgbm_hurdle"
ARCHIVO_JSON = CARPETA / "evaluacion_lightgbm_hurdle.json"
ARCHIVO_REPORTE = CARPETA / "evaluacion_lightgbm_hurdle.md"
VARIABLES_CATEGORICAS = ["codigo", "dia_semana", "mes"]
VARIABLES_NUMERICAS = [
    "unidades_dia_corte",
    "unidades_mismo_dia_semana_anterior",
    "promedio_7_dias",
    "promedio_28_dias",
]
VARIABLES = [*VARIABLES_CATEGORICAS, *VARIABLES_NUMERICAS]
HORIZONTES = {7: "objetivo_7_dias", 14: "objetivo_14_dias", 30: "objetivo_30_dias"}
PARAMETROS = {
    "n_estimators": 350,
    "learning_rate": 0.04,
    "num_leaves": 31,
    "max_depth": -1,
    "min_child_samples": 100,
    "subsample": 0.8,
    "subsample_freq": 1,
    "colsample_bytree": 0.8,
    "reg_lambda": 1.0,
    "random_state": 42,
    "n_jobs": -1,
    "verbosity": -1,
}


def calcular_metricas(real, estimado):
    estimado = np.maximum(np.asarray(estimado, dtype=float), 0)
    real = np.asarray(real, dtype=float)
    suma_real = float(np.abs(real).sum())
    return {
        "mae": float(mean_absolute_error(real, estimado)),
        "rmse": float(np.sqrt(mean_squared_error(real, estimado))),
        "wape_porcentaje": float(np.abs(real - estimado).sum() / suma_real * 100) if suma_real else None,
        "sesgo_promedio": float(np.mean(estimado - real)),
        "r2": float(r2_score(real, estimado)),
    }


def crear_modelo(tipo):
    parametros = dict(PARAMETROS)
    if tipo == "clasificador":
        return lgb.LGBMClassifier(objective="binary", **parametros)
    return lgb.LGBMRegressor(objective="regression", **parametros)


def formato_numero(valor):
    return f"{valor:,.3f}".replace(",", "X").replace(".", ",").replace("X", ".")


def main():
    if not ARCHIVO_DATASET.is_file():
        raise FileNotFoundError("Falta el dataset de pronóstico; ejecuta preparar_modelo_inicial.py.")
    if not ARCHIVO_COMPARACION.is_file():
        raise FileNotFoundError("Falta comparacion_modelos.json; ejecuta comparar_modelos_intermitentes.py primero.")

    columnas = ["codigo", "fecha_corte", *VARIABLES_CATEGORICAS[1:], *VARIABLES_NUMERICAS, *HORIZONTES.values()]
    datos = pd.read_csv(ARCHIVO_DATASET, usecols=columnas, dtype={"codigo": "string"})
    datos["fecha_corte"] = pd.to_datetime(datos["fecha_corte"], errors="raise")
    for columna in VARIABLES_CATEGORICAS:
        datos[columna] = datos[columna].astype("category")

    fechas = datos["fecha_corte"].drop_duplicates().sort_values().reset_index(drop=True)
    indice_corte = max(1, int(len(fechas) * 0.8))
    fecha_inicio_prueba = fechas.iloc[indice_corte]
    fecha_fin_entrenamiento = fecha_inicio_prueba - timedelta(days=max(HORIZONTES))
    entrenamiento = datos.loc[datos["fecha_corte"] <= fecha_fin_entrenamiento]
    prueba = datos.loc[datos["fecha_corte"] >= fecha_inicio_prueba]
    if entrenamiento.empty or prueba.empty:
        raise ValueError("La separación temporal dejó entrenamiento o prueba sin filas.")

    x_entrenamiento = entrenamiento[VARIABLES]
    x_prueba = prueba[VARIABLES]
    resultados_referencias = json.loads(ARCHIVO_COMPARACION.read_text(encoding="utf-8"))["modelos_por_horizonte"]
    resultados = {
        "modelo": "Hurdle global con LightGBM: clasificador de venta × regresor de unidades cuando hay venta",
        "parametros": PARAMETROS,
        "separacion": {
            "desde_entrenamiento": entrenamiento["fecha_corte"].min().date().isoformat(),
            "hasta_entrenamiento": entrenamiento["fecha_corte"].max().date().isoformat(),
            "desde_prueba": prueba["fecha_corte"].min().date().isoformat(),
            "hasta_prueba": prueba["fecha_corte"].max().date().isoformat(),
            "filas_entrenamiento": int(len(entrenamiento)),
            "filas_prueba": int(len(prueba)),
        },
        "predictores": VARIABLES,
        "horizontes": {},
    }
    lineas = [
        "# Evaluación LightGBM hurdle para pronóstico de demanda", "",
        "El modelo estima primero la probabilidad de que las ventas futuras sean mayores que cero y luego las unidades esperadas cuando sí hay venta. El pronóstico de unidades es `probabilidad × cantidad positiva estimada`.", "",
        f"- **Entrenamiento:** {resultados['separacion']['desde_entrenamiento']} a {resultados['separacion']['hasta_entrenamiento']} ({len(entrenamiento):,} filas).".replace(",", "."),
        f"- **Prueba:** {resultados['separacion']['desde_prueba']} a {resultados['separacion']['hasta_prueba']} ({len(prueba):,} filas).".replace(",", "."),
        "- La separación replica la prueba temporal anterior, con 30 días de brecha.",
        "- El código de producto, mes y día de semana se entregan a LightGBM como categóricas, sin expandir el código en miles de columnas one-hot.",
        "- Los pronósticos negativos se recortan a cero antes de calcular las métricas.", "",
    ]
    CARPETA_MODELOS.mkdir(parents=True, exist_ok=True)

    for horizonte, objetivo in HORIZONTES.items():
        y_entrenamiento = entrenamiento[objetivo].astype(float)
        y_prueba = prueba[objetivo].astype(float).to_numpy()
        etiqueta_venta = (y_entrenamiento > 0).astype("int8")

        clasificador = crear_modelo("clasificador")
        clasificador.fit(x_entrenamiento, etiqueta_venta, categorical_feature=VARIABLES_CATEGORICAS)
        filas_positivas = y_entrenamiento > 0
        if not filas_positivas.any():
            raise ValueError(f"No hay objetivos positivos para entrenar tamaño de venta en horizonte {horizonte}.")

        regresor = crear_modelo("regresor")
        regresor.fit(
            x_entrenamiento.loc[filas_positivas],
            y_entrenamiento.loc[filas_positivas],
            categorical_feature=VARIABLES_CATEGORICAS,
        )
        probabilidad = clasificador.predict_proba(x_prueba)[:, 1]
        tamano_condicional = np.maximum(regresor.predict(x_prueba), 0)
        prediccion_hurdle = np.maximum(probabilidad * tamano_condicional, 0)
        metricas_hurdle = calcular_metricas(y_prueba, prediccion_hurdle)

        metrica_historica = resultados_referencias[str(horizonte)]["metricas"]
        metricas_referencia = {
            nombre: metrica_historica[nombre]
            for nombre in ("promedio_28_dias", "mismo_dia_semana_4_semanas", "tsb", "regresion_lineal")
        }
        resultados["horizontes"][str(horizonte)] = {
            "objetivo": objetivo,
            "porcentaje_objetivo_cero": float(np.mean(y_prueba == 0) * 100),
            "metricas_hurdle_lightgbm": metricas_hurdle,
            "metricas_referencia": metricas_referencia,
            "mejora_mae_vs_promedio_28_dias": float(metricas_referencia["promedio_28_dias"]["mae"] - metricas_hurdle["mae"]),
            "mejora_wape_vs_promedio_28_dias": float(metricas_referencia["promedio_28_dias"]["wape_porcentaje"] - metricas_hurdle["wape_porcentaje"]),
            "importancia_clasificador_gain": {nombre: float(valor) for nombre, valor in sorted(zip(VARIABLES, clasificador.booster_.feature_importance(importance_type="gain")), key=lambda par: par[1], reverse=True)},
            "importancia_regresor_gain": {nombre: float(valor) for nombre, valor in sorted(zip(VARIABLES, regresor.booster_.feature_importance(importance_type="gain")), key=lambda par: par[1], reverse=True)},
        }

        archivo_modelo = CARPETA_MODELOS / f"lightgbm_hurdle_{horizonte}_dias.joblib"
        joblib.dump({
            "clasificador": clasificador,
            "regresor": regresor,
            "variables": VARIABLES,
            "horizonte_dias": horizonte,
        }, archivo_modelo)

        top_clasificador = list(resultados["horizontes"][str(horizonte)]["importancia_clasificador_gain"].items())[:5]
        top_regresor = dict(list(resultados["horizontes"][str(horizonte)]["importancia_regresor_gain"].items())[:5])
        predictores_principales = "; ".join(
            f"{nombre} ({valor:.0f} / {top_regresor.get(nombre, 0):.0f})"
            for nombre, valor in top_clasificador
        )
        lineas.extend([
            f"## Horizonte de {horizonte} días", "",
            f"- **Objetivo en cero en la prueba:** {formato_numero(resultados['horizontes'][str(horizonte)]['porcentaje_objetivo_cero'])} %.",
            f"- **Hurdle LightGBM:** MAE {formato_numero(metricas_hurdle['mae'])} · RMSE {formato_numero(metricas_hurdle['rmse'])} · WAPE {formato_numero(metricas_hurdle['wape_porcentaje'])} % · sesgo {formato_numero(metricas_hurdle['sesgo_promedio'])} · R² {formato_numero(metricas_hurdle['r2'])}.",
            f"- **Promedio 28 días:** MAE {formato_numero(metricas_referencia['promedio_28_dias']['mae'])} · WAPE {formato_numero(metricas_referencia['promedio_28_dias']['wape_porcentaje'])} %.",
            f"- **Diferencia de MAE frente al promedio:** {formato_numero(resultados['horizontes'][str(horizonte)]['mejora_mae_vs_promedio_28_dias'])} unidades (positivo significa mejora).",
            f"- **Diferencia de WAPE frente al promedio:** {formato_numero(resultados['horizontes'][str(horizonte)]['mejora_wape_vs_promedio_28_dias'])} puntos porcentuales (positivo significa mejora).",
            f"- **Predictores más influyentes (clasificador / cantidad):** {predictores_principales}.",
            f"- **Modelo guardado:** `{archivo_modelo.relative_to(CARPETA)}`.", "",
        ])

    ARCHIVO_JSON.write_text(json.dumps(resultados, ensure_ascii=False, indent=2), encoding="utf-8")
    ARCHIVO_REPORTE.write_text("\n".join(lineas), encoding="utf-8")
    print(f"Reporte: {ARCHIVO_REPORTE}")
    print(f"Métricas JSON: {ARCHIVO_JSON}")
    print(f"Modelos: {CARPETA_MODELOS}")


if __name__ == "__main__":
    main()
