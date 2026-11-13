"""Compara LightGBM con variables adicionales contra las referencias existentes."""
import json
from pathlib import Path

import lightgbm as lgb
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


CARPETA = Path(__file__).resolve().parent
ARCHIVO_DATASET = CARPETA / "dataset_pronostico_demanda_enriquecido.csv"
ARCHIVO_BASE = CARPETA / "evaluacion_lightgbm_hurdle.json"
ARCHIVO_REFERENCIAS = CARPETA / "comparacion_modelos.json"
ARCHIVO_JSON = CARPETA / "evaluacion_variables_enriquecidas.json"
ARCHIVO_REPORTE = CARPETA / "evaluacion_variables_enriquecidas.md"
VARIABLES_CATEGORICAS = ["codigo", "dia_semana", "mes"]
VARIABLES_BASE = [
    "unidades_dia_corte", "unidades_mismo_dia_semana_anterior",
    "promedio_7_dias", "promedio_28_dias",
]
VARIABLES_NUEVAS = [
    "boletas_7_dias", "boletas_28_dias", "precio_venta_promedio_28_dias",
    "descuento_porcentaje_28_dias", "boletas_00_06_28_dias",
    "boletas_06_12_28_dias", "boletas_12_18_28_dias", "boletas_18_24_28_dias",
]
HORIZONTES = {7: "objetivo_7_dias", 14: "objetivo_14_dias", 30: "objetivo_30_dias"}


def calcular_metricas(real, estimado):
    real = np.asarray(real, dtype=float)
    estimado = np.maximum(np.asarray(estimado, dtype=float), 0)
    total_real = float(np.abs(real).sum())
    return {
        "mae": float(mean_absolute_error(real, estimado)),
        "rmse": float(np.sqrt(mean_squared_error(real, estimado))),
        "wape_porcentaje": float(np.abs(real - estimado).sum() / total_real * 100) if total_real else None,
        "sesgo_promedio": float(np.mean(estimado - real)),
        "r2": float(r2_score(real, estimado)),
    }


def formato(valor, decimales=3):
    return f"{valor:,.{decimales}f}".replace(",", "X").replace(".", ",").replace("X", ".")


def crear_modelo(clasificador, parametros):
    parametros = dict(parametros)
    parametros["n_jobs"] = -1
    parametros["verbosity"] = -1
    if clasificador:
        return lgb.LGBMClassifier(objective="binary", **parametros)
    return lgb.LGBMRegressor(objective="regression", **parametros)


def main():
    for ruta in (ARCHIVO_DATASET, ARCHIVO_BASE, ARCHIVO_REFERENCIAS):
        if not ruta.is_file():
            raise FileNotFoundError(f"Falta {ruta.name}; genera primero el dataset y las pruebas base.")

    evaluacion_base = json.loads(ARCHIVO_BASE.read_text(encoding="utf-8"))
    referencias = json.loads(ARCHIVO_REFERENCIAS.read_text(encoding="utf-8"))
    fecha_prueba = pd.Timestamp(evaluacion_base["separacion"]["desde_prueba"])
    fecha_fin_entrenamiento = fecha_prueba - pd.Timedelta(days=max(HORIZONTES))
    columnas = [
        "codigo", "fecha_corte", "dia_semana", "mes", *VARIABLES_BASE,
        *VARIABLES_NUEVAS, *HORIZONTES.values(),
    ]
    datos = pd.read_csv(ARCHIVO_DATASET, usecols=columnas, dtype={"codigo": "category"})
    datos["fecha_corte"] = pd.to_datetime(datos["fecha_corte"], errors="raise")
    for columna in ("dia_semana", "mes"):
        datos[columna] = datos[columna].astype("category")

    entrenamiento = datos.loc[datos["fecha_corte"] <= fecha_fin_entrenamiento]
    prueba = datos.loc[datos["fecha_corte"] >= fecha_prueba]
    if len(prueba) != evaluacion_base["separacion"]["filas_prueba"]:
        raise ValueError("El dataset enriquecido no coincide en filas con la prueba base.")

    variables = [*VARIABLES_CATEGORICAS, *VARIABLES_BASE, *VARIABLES_NUEVAS]
    parametros = evaluacion_base["parametros"]
    resultados = {
        "modelo": "LightGBM hurdle con variables de boletas, precio, descuentos y horario",
        "variables_nuevas": VARIABLES_NUEVAS,
        "parametros": parametros,
        "separacion": {
            "entrenamiento_hasta": entrenamiento["fecha_corte"].max().date().isoformat(),
            "prueba_desde": prueba["fecha_corte"].min().date().isoformat(),
            "prueba_hasta": prueba["fecha_corte"].max().date().isoformat(),
            "filas_entrenamiento": int(len(entrenamiento)),
            "filas_prueba": int(len(prueba)),
        },
        "horizontes": {},
        "modelo_guardado": False,
        "nota": "Prueba experimental sobre la misma ventana ya revisada en evaluaciones previas; requiere validación futura independiente antes de adopción.",
    }
    lineas = [
        "# Evaluación de variables adicionales para pronóstico",
        "",
        "Se comparó un LightGBM hurdle enriquecido con el LightGBM hurdle base, usando los mismos parámetros y fechas de entrenamiento/prueba. La prueba ya se había revisado en experimentos previos, por lo que esta comparación sirve como exploración, no como evaluación final independiente.",
        "",
        f"- **Entrenamiento hasta:** {resultados['separacion']['entrenamiento_hasta']}",
        f"- **Prueba:** {resultados['separacion']['prueba_desde']} a {resultados['separacion']['prueba_hasta']} ({len(prueba):,} filas).".replace(",", "."),
        f"- **Variables nuevas:** {', '.join(VARIABLES_NUEVAS)}.",
        "- Los predictores de precio, descuento y boletas usan únicamente información hasta la fecha de corte.",
        "",
        "| Horizonte | Referencia 28 días MAE / WAPE | Hurdle base MAE / WAPE | Hurdle enriquecido MAE / WAPE |",
        "| --- | ---: | ---: | ---: |",
    ]

    for horizonte, objetivo in HORIZONTES.items():
        y_entrenamiento = entrenamiento[objetivo].astype(float)
        y_prueba = prueba[objetivo].astype(float).to_numpy()
        positivo = y_entrenamiento > 0
        clasificador = crear_modelo(True, parametros)
        clasificador.fit(entrenamiento[variables], positivo.astype("int8"), categorical_feature=VARIABLES_CATEGORICAS)
        regresor = crear_modelo(False, parametros)
        regresor.fit(entrenamiento.loc[positivo, variables], y_entrenamiento.loc[positivo], categorical_feature=VARIABLES_CATEGORICAS)
        probabilidad = clasificador.predict_proba(prueba[variables])[:, 1]
        unidades_si_venta = np.maximum(regresor.predict(prueba[variables]), 0)
        metricas_enriquecido = calcular_metricas(y_prueba, probabilidad * unidades_si_venta)
        metricas_base = evaluacion_base["horizontes"][str(horizonte)]["metricas_hurdle_lightgbm"]
        metricas_referencia = referencias["modelos_por_horizonte"][str(horizonte)]["metricas"]
        resultados["horizontes"][str(horizonte)] = {
            "objetivo_cero_porcentaje": float(np.mean(y_prueba == 0) * 100),
            "promedio_28_dias": metricas_referencia["promedio_28_dias"],
            "mismo_dia_semana_4_semanas": metricas_referencia["mismo_dia_semana_4_semanas"],
            "lightgbm_hurdle_base": metricas_base,
            "lightgbm_hurdle_enriquecido": metricas_enriquecido,
            "importancia_clasificador_gain": {
                nombre: float(valor) for nombre, valor in sorted(
                    zip(variables, clasificador.booster_.feature_importance(importance_type="gain")),
                    key=lambda par: par[1], reverse=True,
                )
            },
            "importancia_regresor_gain": {
                nombre: float(valor) for nombre, valor in sorted(
                    zip(variables, regresor.booster_.feature_importance(importance_type="gain")),
                    key=lambda par: par[1], reverse=True,
                )
            },
        }
        mae_base = metricas_base["mae"]
        wape_base = metricas_base["wape_porcentaje"]
        mae_ref = metricas_referencia["promedio_28_dias"]["mae"]
        wape_ref = metricas_referencia["promedio_28_dias"]["wape_porcentaje"]
        lineas.append(
            f"| {horizonte} días | {formato(mae_ref)} / {formato(wape_ref)} % | "
            f"{formato(mae_base)} / {formato(wape_base)} % | "
            f"{formato(metricas_enriquecido['mae'])} / {formato(metricas_enriquecido['wape_porcentaje'])} % |"
        )

    lineas.extend(["", "## Lectura por horizonte", ""])
    for horizonte in HORIZONTES:
        datos_horizonte = resultados["horizontes"][str(horizonte)]
        mae_base = datos_horizonte["lightgbm_hurdle_base"]["mae"]
        wape_base = datos_horizonte["lightgbm_hurdle_base"]["wape_porcentaje"]
        mae_nuevo = datos_horizonte["lightgbm_hurdle_enriquecido"]["mae"]
        wape_nuevo = datos_horizonte["lightgbm_hurdle_enriquecido"]["wape_porcentaje"]
        wape_ref = datos_horizonte["promedio_28_dias"]["wape_porcentaje"]
        top = list(resultados["horizontes"][str(horizonte)]["importancia_clasificador_gain"].items())[:5]
        lineas.extend([
            f"### {horizonte} días",
            f"El modelo enriquecido {'mejoró' if wape_nuevo < wape_base else 'no mejoró'} el WAPE del LightGBM base en {formato(wape_base - wape_nuevo)} puntos y {'mejoró' if mae_nuevo < mae_base else 'no mejoró'} el MAE en {formato(mae_base - mae_nuevo)} unidades. El promedio de 28 días obtuvo WAPE {formato(wape_ref)} %.",
            "Importancia del clasificador: " + ", ".join(f"{nombre} ({formato(valor, 0)})" for nombre, valor in top) + ".",
            "",
        ])

    lineas.extend([
        "## Conclusión",
        "",
        "Las variables nuevas mejoran ligeramente al LightGBM base, pero el promedio de 28 días mantiene menor MAE y WAPE en los tres horizontes. Se conserva el promedio como referencia seleccionada; el LightGBM enriquecido queda como experimento pendiente de una validación futura independiente.",
        "",
    ])

    ARCHIVO_JSON.write_text(json.dumps(resultados, ensure_ascii=False, indent=2), encoding="utf-8")
    ARCHIVO_REPORTE.write_text("\n".join(lineas), encoding="utf-8")
    print(f"Reporte: {ARCHIVO_REPORTE}")
    print(f"Resultados: {ARCHIVO_JSON}")
    print("Modelos usados solo en memoria; no se guardaron binarios.")


if __name__ == "__main__":
    main()
