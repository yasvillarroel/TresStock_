"""Entrena y guarda en backend/modelo el artefacto de referencia LightGBM."""
import json
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd
from lightgbm import LGBMRegressor


CARPETA_MODELO = Path(__file__).resolve().parent
RAIZ_PROYECTO = CARPETA_MODELO.parents[1]
ARCHIVO_DATASET = CARPETA_MODELO / "dataset_estacionalidad_tendencias.csv.gz"
ARCHIVO_EVALUACION = CARPETA_MODELO / "metricas_evaluacion.json"
ARCHIVO_ARTEFACTO = CARPETA_MODELO / "modelo_demanda_lightgbm.txt"
ARCHIVO_ARTEFACTO_NODE = CARPETA_MODELO / "modelo_demanda_lightgbm.json"
ARCHIVO_METADATOS = CARPETA_MODELO / "metadatos_modelo.json"

PARAMETROS = {
    "objective": "regression_l1",
    "n_estimators": 250,
    "learning_rate": 0.04,
    "num_leaves": 63,
    "max_depth": -1,
    "min_child_samples": 100,
    "subsample": 0.85,
    "colsample_bytree": 0.85,
    "reg_lambda": 1.0,
    "random_state": 42,
    "n_jobs": 4,
    "verbosity": -1,
}
VARIABLES = [
    "codigo",
    "dia_semana",
    "mes",
    "indice_fecha",
    "venta_mismo_dia_semana_1",
    "venta_mismo_dia_semana_2",
    "promedio_ultimos_4_mismos_dias",
    "promedio_ultimos_7_dias",
    "promedio_ultimos_28_dias",
]


def preparar_datos():
    datos = pd.read_csv(
        ARCHIVO_DATASET,
        usecols=["codigo", "fecha", "dia_semana", "mes", "unidades_vendidas", "es_dia_atipico"],
        dtype={"codigo": "category", "dia_semana": "int8", "mes": "int8", "es_dia_atipico": "bool"},
        parse_dates=["fecha"],
    )
    datos = datos.sort_values(["codigo", "fecha"], kind="stable").reset_index(drop=True)
    grupo = datos.groupby("codigo", observed=True)["unidades_vendidas"]
    datos["venta_mismo_dia_semana_1"] = grupo.shift(7)
    datos["venta_mismo_dia_semana_2"] = grupo.shift(14)
    datos["promedio_ultimos_4_mismos_dias"] = grupo.transform(
        lambda serie: serie.shift(7).rolling(28, min_periods=1).mean()
    )
    datos["promedio_ultimos_7_dias"] = grupo.transform(
        lambda serie: serie.shift(1).rolling(7, min_periods=1).mean()
    )
    datos["promedio_ultimos_28_dias"] = grupo.transform(
        lambda serie: serie.shift(1).rolling(28, min_periods=1).mean()
    )
    fecha_base = datos["fecha"].min()
    datos["indice_fecha"] = (datos["fecha"] - fecha_base).dt.days.astype("int16")

    filas_atipicas = int(datos["es_dia_atipico"].sum())
    filas_domingo = int((datos["dia_semana"] == 6).sum())
    filas_antes_filtros = len(datos)
    datos = datos[
        (datos["dia_semana"] != 6)
        & ~datos["es_dia_atipico"]
    ].dropna(subset=["venta_mismo_dia_semana_1"])
    return datos, fecha_base, filas_antes_filtros, filas_atipicas, filas_domingo


def main():
    if not ARCHIVO_DATASET.is_file():
        raise FileNotFoundError(f"No se encontró el dataset preparado: {ARCHIVO_DATASET}")

    datos, fecha_base, filas_fuente, filas_atipicas, filas_domingo = preparar_datos()
    modelo = LGBMRegressor(**PARAMETROS)
    modelo.fit(
        datos[VARIABLES],
        datos["unidades_vendidas"],
        categorical_feature=["codigo", "dia_semana", "mes"],
    )
    modelo.booster_.save_model(str(ARCHIVO_ARTEFACTO))
    ARCHIVO_ARTEFACTO_NODE.write_text(
        json.dumps(modelo.booster_.dump_model(), ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )

    evaluacion = json.loads(ARCHIVO_EVALUACION.read_text(encoding="utf-8")) if ARCHIVO_EVALUACION.exists() else {}
    metricas_prueba = evaluacion.get("metricas", {}).get("lightgbm", {})
    metadatos = {
        "nombre": "Pronóstico diario de demanda por producto",
        "algoritmo": "LightGBM Regressor con objetivo regression_l1",
        "version_artefacto": 1,
        "fecha_entrenamiento_utc": datetime.now(timezone.utc).isoformat(),
        "fuente_entrenamiento": str(ARCHIVO_DATASET.relative_to(RAIZ_PROYECTO)),
        "periodo_datos": {
            "desde": str(datos["fecha"].min().date()),
            "hasta": str(datos["fecha"].max().date()),
            "fecha_base_indice": str(fecha_base.date()),
        },
        "filas": {
            "dataset_fuente": int(filas_fuente),
            "entrenamiento_final": int(len(datos)),
            "dias_producto_atipicos_excluidos": filas_atipicas,
            "filas_domingo_excluidas_por_cierre": filas_domingo,
        },
        "variables_entrada": VARIABLES,
        "variables_categoricas": ["codigo", "dia_semana", "mes"],
        "categorias_codigo": [str(codigo) for codigo in datos["codigo"].cat.categories],
        "parametros": PARAMETROS,
        "metricas_prueba_temporal": {
            "periodo_desde": evaluacion.get("prueba_temporal", {}).get("desde"),
            "periodo_hasta": evaluacion.get("prueba_temporal", {}).get("hasta"),
            "mae": metricas_prueba.get("mae"),
            "rmse": metricas_prueba.get("rmse"),
            "wape_porcentaje": metricas_prueba.get("wape_porcentaje"),
            "sesgo_predicho_menos_real": metricas_prueba.get("sesgo_predicho_menos_real"),
            "r2": metricas_prueba.get("r2"),
            "accuracy_venta_umbral_0_5": metricas_prueba.get("clasificacion_venta_umbral_0_5", {}).get("accuracy"),
            "precision_venta_umbral_0_5": metricas_prueba.get("clasificacion_venta_umbral_0_5", {}).get("precision"),
            "recall_venta_umbral_0_5": metricas_prueba.get("clasificacion_venta_umbral_0_5", {}).get("recall"),
            "f1_venta_umbral_0_5": metricas_prueba.get("clasificacion_venta_umbral_0_5", {}).get("f1"),
        },
        "nota_evaluacion": "Las métricas son de la prueba temporal antes del reentrenamiento final con todo el historial; no son métricas calculadas sobre el conjunto usado para guardar este artefacto.",
    }
    ARCHIVO_METADATOS.write_text(json.dumps(metadatos, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Modelo guardado en: {ARCHIVO_ARTEFACTO}")
    print(f"Modelo listo para Node guardado en: {ARCHIVO_ARTEFACTO_NODE}")
    print(f"Metadatos guardados en: {ARCHIVO_METADATOS}")
    print(f"Filas de entrenamiento: {len(datos):,}; productos: {datos['codigo'].nunique():,}")


if __name__ == "__main__":
    main()
