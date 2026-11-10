"""Ajusta TSB, Croston-SBA y LightGBM con validaciones cronológicas."""
import csv
import json
from collections import defaultdict, deque
from datetime import date, timedelta
from pathlib import Path

import joblib
import lightgbm as lgb
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


CARPETA = Path(__file__).resolve().parent
ARCHIVO_DATASET = CARPETA / "dataset_pronostico_demanda.csv"
ARCHIVO_DIARIO = CARPETA.parent / "04_estacionalidad_tendencias" / "dataset_estacionalidad_tendencias.csv"
ARCHIVO_COMPARACION = CARPETA / "comparacion_modelos.json"
ARCHIVO_EVALUACION = CARPETA / "evaluacion_pronostico.json"
CARPETA_MODELOS = CARPETA / "modelos_lightgbm_ajustados"
ARCHIVO_JSON = CARPETA / "ajuste_parametros.json"
ARCHIVO_REPORTE = CARPETA / "ajuste_parametros.md"
HORIZONTES = {7: "objetivo_7_dias", 14: "objetivo_14_dias", 30: "objetivo_30_dias"}
VARIABLES_CATEGORICAS = ["codigo", "dia_semana", "mes"]
VARIABLES_NUMERICAS = ["unidades_dia_corte", "unidades_mismo_dia_semana_anterior", "promedio_7_dias", "promedio_28_dias"]
VARIABLES = [*VARIABLES_CATEGORICAS, *VARIABLES_NUMERICAS]
ALFAS = [0.05, 0.1, 0.2, 0.3, 0.5]
PARAMETROS_TSB = [(alpha, beta) for alpha in [0.05, 0.1, 0.2, 0.3] for beta in [0.05, 0.1, 0.2, 0.3]]
PARAMETROS_LIGHTGBM = [
    {"n_estimators": 200, "learning_rate": 0.05, "num_leaves": 15, "min_child_samples": 200, "reg_lambda": 5.0},
    {"n_estimators": 350, "learning_rate": 0.04, "num_leaves": 31, "min_child_samples": 100, "reg_lambda": 1.0},
    {"n_estimators": 500, "learning_rate": 0.03, "num_leaves": 31, "min_child_samples": 300, "reg_lambda": 5.0},
]
FOLDS = [date(2025, 11, 1), date(2026, 1, 1), date(2026, 3, 1)]


def metricas(real, predicho):
    real = np.asarray(real, dtype=float)
    predicho = np.maximum(np.asarray(predicho, dtype=float), 0)
    suma = float(np.abs(real).sum())
    return {
        "mae": float(mean_absolute_error(real, predicho)),
        "rmse": float(np.sqrt(mean_squared_error(real, predicho))),
        "wape_porcentaje": float(np.abs(real - predicho).sum() / suma * 100) if suma else None,
        "sesgo_promedio": float(np.mean(predicho - real)),
        "r2": float(r2_score(real, predicho)),
    }


def fmt(valor):
    return f"{valor:,.3f}".replace(",", "X").replace(".", ",").replace("X", ".")


def crear_modelo(tipo, ajustes):
    parametros = {
        **ajustes,
        "max_depth": -1,
        "subsample": 0.8,
        "subsample_freq": 1,
        "colsample_bytree": 0.8,
        "random_state": 42,
        "n_jobs": -1,
        "verbosity": -1,
    }
    if tipo == "clasificador":
        return lgb.LGBMClassifier(objective="binary", **parametros)
    return lgb.LGBMRegressor(objective="regression", **parametros)


def cargar_datos():
    columnas = ["codigo", "fecha_corte", *VARIABLES_CATEGORICAS[1:], *VARIABLES_NUMERICAS, *HORIZONTES.values()]
    datos = pd.read_csv(ARCHIVO_DATASET, usecols=columnas, dtype={"codigo": "string"})
    datos["fecha_corte"] = pd.to_datetime(datos["fecha_corte"], errors="raise")
    for nombre in VARIABLES_CATEGORICAS:
        datos[nombre] = datos[nombre].astype("category")
    return datos


def crear_particiones(datos, fecha_prueba):
    validaciones = {}
    for inicio in FOLDS:
        fin = inicio + timedelta(days=30)
        corte_entrenamiento = inicio - timedelta(days=max(HORIZONTES))
        entrenamiento = datos.loc[datos["fecha_corte"] <= pd.Timestamp(corte_entrenamiento)]
        validacion = datos.loc[(datos["fecha_corte"] >= pd.Timestamp(inicio)) & (datos["fecha_corte"] < pd.Timestamp(fin))]
        if entrenamiento.empty or validacion.empty:
            raise ValueError(f"La partición de validación {inicio} quedó vacía.")
        if fin + timedelta(days=max(HORIZONTES)) >= fecha_prueba:
            raise ValueError(f"La validación {inicio} se acerca demasiado al periodo de prueba.")
        validaciones[inicio.isoformat()] = {"entrenamiento": entrenamiento, "validacion": validacion}

    prueba = datos.loc[datos["fecha_corte"] >= pd.Timestamp(fecha_prueba)]
    entrenamiento_final = datos.loc[datos["fecha_corte"] <= pd.Timestamp(fecha_prueba - timedelta(days=max(HORIZONTES)))]
    if entrenamiento_final.empty or prueba.empty:
        raise ValueError("La separación final dejó entrenamiento o prueba sin filas.")
    return validaciones, entrenamiento_final, prueba


def obtener_objetivos_por_fecha(validaciones, prueba):
    filas_validacion = []
    claves_fecha = defaultdict(set)
    for fold, particion in validaciones.items():
        validacion = particion["validacion"]
        for fila in validacion[["codigo", "fecha_corte"]].itertuples(index=False, name=None):
            codigo, fecha_hora = str(fila[0]), fila[1]
            dia = fecha_hora.date()
            claves_fecha[codigo].add(dia)
            filas_validacion.append((fold, codigo, dia))
    filas_prueba = []
    for fila in prueba[["codigo", "fecha_corte"]].itertuples(index=False, name=None):
        codigo, fecha_hora = str(fila[0]), fila[1]
        dia = fecha_hora.date()
        claves_fecha[codigo].add(dia)
        filas_prueba.append((codigo, dia))
    return filas_validacion, filas_prueba, claves_fecha


def simular_intermitencia(claves_fecha):
    """Actualiza todos los candidatos SBA/TSB con un solo recorrido diario."""
    if not ARCHIVO_DIARIO.is_file():
        raise FileNotFoundError(f"Falta la serie diaria: {ARCHIVO_DIARIO}")
    parametros_sba = ALFAS
    parametros_tsb = PARAMETROS_TSB
    alfas_tsb = np.array([par[0] for par in parametros_tsb], dtype=float)
    betas_tsb = np.array([par[1] for par in parametros_tsb], dtype=float)
    predicciones = {}
    codigo_actual = None
    indice = 0
    ultimo_evento = None
    inicializado_sba = False
    inicializado_tsb = False
    z_sba = np.zeros(len(parametros_sba), dtype=float)
    p_sba = np.ones(len(parametros_sba), dtype=float)
    z_tsb = np.zeros(len(parametros_tsb), dtype=float)
    p_tsb = np.zeros(len(parametros_tsb), dtype=float)

    with ARCHIVO_DIARIO.open("r", encoding="utf-8-sig", newline="") as archivo:
        for fila in csv.DictReader(archivo):
            codigo = fila["codigo"]
            if codigo != codigo_actual:
                codigo_actual = codigo
                indice = 0
                ultimo_evento = None
                inicializado_sba = False
                inicializado_tsb = False
                z_sba = np.zeros(len(parametros_sba), dtype=float)
                p_sba = np.ones(len(parametros_sba), dtype=float)
                z_tsb = np.zeros(len(parametros_tsb), dtype=float)
                p_tsb = np.zeros(len(parametros_tsb), dtype=float)

            dia = date.fromisoformat(fila["fecha"])
            cantidad = float(fila["unidades_vendidas"] or 0)
            atipico = fila["es_dia_atipico"].lower() == "true"
            if not atipico:
                ocurrio = cantidad > 0
                if ocurrio:
                    if not inicializado_sba:
                        z_sba.fill(cantidad)
                        p_sba.fill(max(indice + 1, 1))
                        inicializado_sba = True
                    else:
                        intervalo = indice - ultimo_evento
                        z_sba = np.array(parametros_sba) * cantidad + (1 - np.array(parametros_sba)) * z_sba
                        p_sba = np.array(parametros_sba) * intervalo + (1 - np.array(parametros_sba)) * p_sba
                    ultimo_evento = indice

                    if not inicializado_tsb:
                        p_tsb.fill(1.0)
                        z_tsb.fill(cantidad)
                        inicializado_tsb = True
                    else:
                        p_tsb += betas_tsb * (1.0 - p_tsb)
                        z_tsb += alfas_tsb * (cantidad - z_tsb)
                elif inicializado_tsb:
                    p_tsb += betas_tsb * (0.0 - p_tsb)

            if dia in claves_fecha.get(codigo, ()):
                tasa_sba = (1.0 - np.array(parametros_sba) / 2.0) * z_sba / p_sba if inicializado_sba else np.zeros(len(parametros_sba))
                tasa_tsb = p_tsb * z_tsb if inicializado_tsb else np.zeros(len(parametros_tsb))
                predicciones[(codigo, dia)] = (tasa_sba.copy(), tasa_tsb.copy())
            indice += 1

    return predicciones


def recopilar_metricas_intermitencia(validaciones, prueba, filas_validacion, filas_prueba, predicciones):
    filas_por_clave_validacion = {(codigo, dia): fold for fold, codigo, dia in filas_validacion}
    filas_validacion_agrupadas = defaultdict(list)
    for fold, codigo, dia in filas_validacion:
        filas_validacion_agrupadas[fold].append((codigo, dia))

    resultados = {"croston_sba": {}, "tsb": {}}
    indices_sba = {alpha: indice for indice, alpha in enumerate(ALFAS)}
    indices_tsb = {parametro: indice for indice, parametro in enumerate(PARAMETROS_TSB)}

    for horizonte, objetivo in HORIZONTES.items():
        real_validacion = {nombre: [] for nombre in filas_validacion_agrupadas}
        pred_sba_validacion = {alpha: {nombre: [] for nombre in filas_validacion_agrupadas} for alpha in ALFAS}
        pred_tsb_validacion = {parametro: {nombre: [] for nombre in filas_validacion_agrupadas} for parametro in PARAMETROS_TSB}
        for fold, particion in validaciones.items():
            lookup = {(str(row.codigo), row.fecha_corte.date()): float(getattr(row, objetivo)) for row in particion["validacion"].itertuples(index=False)}
            for codigo, dia in filas_validacion_agrupadas[fold]:
                real = lookup[(codigo, dia)]
                sba, tsb = predicciones[(codigo, dia)]
                real_validacion[fold].append(real)
                for alpha, idx in indices_sba.items():
                    pred_sba_validacion[alpha][fold].append(sba[idx] * horizonte)
                for parametro, idx in indices_tsb.items():
                    pred_tsb_validacion[parametro][fold].append(tsb[idx] * horizonte)

        scores_sba = {}
        for alpha in ALFAS:
            metricas_fold = [metricas(real_validacion[fold], pred_sba_validacion[alpha][fold]) for fold in real_validacion]
            scores_sba[alpha] = {
                "wape_promedio_folds": float(np.mean([m["wape_porcentaje"] for m in metricas_fold])),
                "mae_promedio_folds": float(np.mean([m["mae"] for m in metricas_fold])),
                "wape_por_fold": {fold: m["wape_porcentaje"] for fold, m in zip(real_validacion, metricas_fold)},
            }
        scores_tsb = {}
        for parametro in PARAMETROS_TSB:
            metricas_fold = [metricas(real_validacion[fold], pred_tsb_validacion[parametro][fold]) for fold in real_validacion]
            scores_tsb[parametro] = {
                "wape_promedio_folds": float(np.mean([m["wape_porcentaje"] for m in metricas_fold])),
                "mae_promedio_folds": float(np.mean([m["mae"] for m in metricas_fold])),
                "wape_por_fold": {fold: m["wape_porcentaje"] for fold, m in zip(real_validacion, metricas_fold)},
            }

        real_test = prueba[objetivo].astype(float).to_numpy()
        test_sba = [predicciones[(str(row.codigo), row.fecha_corte.date())][0] for row in prueba[["codigo", "fecha_corte"]].itertuples(index=False)]
        test_tsb = [predicciones[(str(row.codigo), row.fecha_corte.date())][1] for row in prueba[["codigo", "fecha_corte"]].itertuples(index=False)]
        best_alpha = min(ALFAS, key=lambda alpha: (scores_sba[alpha]["wape_promedio_folds"], scores_sba[alpha]["mae_promedio_folds"]))
        best_tsb = min(PARAMETROS_TSB, key=lambda par: (scores_tsb[par]["wape_promedio_folds"], scores_tsb[par]["mae_promedio_folds"]))
        test_sba_array = np.vstack(test_sba)
        test_tsb_array = np.vstack(test_tsb)
        resultados["croston_sba"][str(horizonte)] = {
            "parametro_elegido": {"alpha": best_alpha},
            "metricas_validacion": scores_sba[best_alpha],
            "metricas_prueba": metricas(real_test, test_sba_array[:, indices_sba[best_alpha]] * horizonte),
            "rejilla": {str(alpha): scores_sba[alpha] for alpha in ALFAS},
        }
        resultados["tsb"][str(horizonte)] = {
            "parametro_elegido": {"alpha": best_tsb[0], "beta": best_tsb[1]},
            "metricas_validacion": scores_tsb[best_tsb],
            "metricas_prueba": metricas(real_test, test_tsb_array[:, indices_tsb[best_tsb]] * horizonte),
            "rejilla": {f"alpha={par[0]},beta={par[1]}": scores_tsb[par] for par in PARAMETROS_TSB},
        }

    return resultados


def ajustar_lightgbm(validaciones, entrenamiento_final, prueba):
    resultados = {}
    modelos_finales = {}
    x_prueba = prueba[VARIABLES]
    x_entrenamiento_final = entrenamiento_final[VARIABLES]
    y_validacion_por_horizonte = {}
    predicciones_validacion = {}

    for horizonte, objetivo in HORIZONTES.items():
        candidatos = {}
        for numero_config, config in enumerate(PARAMETROS_LIGHTGBM, start=1):
            y_true_folds = []
            y_pred_folds = []
            wape_folds = []
            mae_folds = []
            for nombre_fold, particion in validaciones.items():
                entrenamiento = particion["entrenamiento"]
                validacion = particion["validacion"]
                y = entrenamiento[objetivo].astype(float)
                positivo = y > 0
                clasificador = crear_modelo("clasificador", config)
                clasificador.fit(entrenamiento[VARIABLES], positivo.astype("int8"), categorical_feature=VARIABLES_CATEGORICAS)
                regresor = crear_modelo("regresor", config)
                regresor.fit(entrenamiento.loc[positivo, VARIABLES], y.loc[positivo], categorical_feature=VARIABLES_CATEGORICAS)
                p = clasificador.predict_proba(validacion[VARIABLES])[:, 1]
                tamano = np.maximum(regresor.predict(validacion[VARIABLES]), 0)
                y_estimado = np.maximum(p * tamano, 0)
                y_real = validacion[objetivo].astype(float).to_numpy()
                m = metricas(y_real, y_estimado)
                y_true_folds.append(y_real)
                y_pred_folds.append(y_estimado)
                wape_folds.append(m["wape_porcentaje"])
                mae_folds.append(m["mae"])
                print(f"LightGBM config {numero_config}/{len(PARAMETROS_LIGHTGBM)}, horizonte {horizonte}, fold {nombre_fold}: WAPE {fmt(m['wape_porcentaje'])}%", flush=True)
            candidatos[str(numero_config)] = {
                "parametros": config,
                "wape_promedio_folds": float(np.mean(wape_folds)),
                "mae_promedio_folds": float(np.mean(mae_folds)),
                "wape_validacion_combinada": metricas(np.concatenate(y_true_folds), np.concatenate(y_pred_folds))["wape_porcentaje"],
            }

        mejor_id = min(candidatos, key=lambda ident: (candidatos[ident]["wape_promedio_folds"], candidatos[ident]["mae_promedio_folds"]))
        mejor_config = candidatos[mejor_id]["parametros"]
        y_final = entrenamiento_final[objetivo].astype(float)
        positivo_final = y_final > 0
        clasificador_final = crear_modelo("clasificador", mejor_config)
        clasificador_final.fit(x_entrenamiento_final, positivo_final.astype("int8"), categorical_feature=VARIABLES_CATEGORICAS)
        regresor_final = crear_modelo("regresor", mejor_config)
        regresor_final.fit(x_entrenamiento_final.loc[positivo_final], y_final.loc[positivo_final], categorical_feature=VARIABLES_CATEGORICAS)
        p_test = clasificador_final.predict_proba(x_prueba)[:, 1]
        tamano_test = np.maximum(regresor_final.predict(x_prueba), 0)
        pred_test = np.maximum(p_test * tamano_test, 0)
        metricas_test = metricas(prueba[objetivo].astype(float), pred_test)

        nombre_modelo = CARPETA_MODELOS / f"lightgbm_hurdle_ajustado_{horizonte}_dias.joblib"
        joblib.dump({
            "clasificador": clasificador_final,
            "regresor": regresor_final,
            "variables": VARIABLES,
            "horizonte_dias": horizonte,
            "parametros": mejor_config,
        }, nombre_modelo)
        resultados[str(horizonte)] = {
            "objetivo": objetivo,
            "configuracion_elegida_id": mejor_id,
            "configuracion_elegida": mejor_config,
            "rejilla_validacion": candidatos,
            "metricas_prueba": metricas_test,
            "modelo_guardado": nombre_modelo.name,
            "importancia_clasificador_gain": {nombre: float(valor) for nombre, valor in sorted(zip(VARIABLES, clasificador_final.booster_.feature_importance(importance_type="gain")), key=lambda par: par[1], reverse=True)},
            "importancia_regresor_gain": {nombre: float(valor) for nombre, valor in sorted(zip(VARIABLES, regresor_final.booster_.feature_importance(importance_type="gain")), key=lambda par: par[1], reverse=True)},
        }
    return resultados


def main():
    if not ARCHIVO_DATASET.is_file() or not ARCHIVO_COMPARACION.is_file() or not ARCHIVO_EVALUACION.is_file():
        raise FileNotFoundError("Genera antes el dataset, la comparación inicial y la evaluación de regresión lineal.")
    datos = cargar_datos()
    fecha_prueba = date.fromisoformat(json.loads(ARCHIVO_EVALUACION.read_text(encoding="utf-8"))["separacion"]["desde_prueba"])
    validaciones, entrenamiento_final, prueba = crear_particiones(datos, fecha_prueba)
    filas_validacion, filas_prueba, claves_fecha = obtener_objetivos_por_fecha(validaciones, prueba)
    print(f"Generando tasas SBA/TSB para {len(claves_fecha):,} productos, {len(filas_validacion):,} cortes de validación y {len(filas_prueba):,} cortes de prueba.", flush=True)
    tasas = simular_intermitencia(claves_fecha)
    print("Simulación SBA/TSB terminada; calculando selección temporal.", flush=True)
    intermitencia = recopilar_metricas_intermitencia(validaciones, prueba, filas_validacion, filas_prueba, tasas)
    del tasas

    CARPETA_MODELOS.mkdir(parents=True, exist_ok=True)
    print("Iniciando búsqueda de LightGBM hurdle en tres ventanas temporales.", flush=True)
    resultados_lightgbm = ajustar_lightgbm(validaciones, entrenamiento_final, prueba)
    resumen_comparacion = json.loads(ARCHIVO_COMPARACION.read_text(encoding="utf-8"))["modelos_por_horizonte"]
    resultados = {
        "metodo_seleccion": "menor WAPE promedio en tres validaciones de 30 días; MAE resuelve empates",
        "ventanas_validacion": [inicio.isoformat() for inicio in FOLDS],
        "periodo_prueba": {"desde": prueba["fecha_corte"].min().date().isoformat(), "hasta": prueba["fecha_corte"].max().date().isoformat()},
        "nota_periodo_prueba": "Este periodo ya se revisó en experimentos iniciales; los parámetros se eligieron solo con las validaciones internas, pero conviene confirmar los resultados con ventas futuras nuevas.",
        "tsb": intermitencia["tsb"],
        "croston_sba": intermitencia["croston_sba"],
        "lightgbm_hurdle": resultados_lightgbm,
        "referencias_prueba": resumen_comparacion,
    }

    lineas = [
        "# Ajuste de parámetros para pronóstico de demanda", "",
        "Se eligieron parámetros por WAPE promedio de tres ventanas cronológicas internas de 30 días (noviembre 2025, enero 2026 y marzo 2026); MAE desempata. El conjunto de prueba va después de las validaciones y no intervino en la selección de parámetros.", "",
        f"- **Validaciones:** {', '.join(inicio.isoformat() for inicio in FOLDS)}.",
        f"- **Prueba de referencia:** {resultados['periodo_prueba']['desde']} a {resultados['periodo_prueba']['hasta']}.",
        f"- **Nota:** {resultados['nota_periodo_prueba']}",
        "- SBA y TSB usan solo ventas conocidas hasta cada fecha de corte; días atípicos no actualizan sus estados.",
        "- Para LightGBM se probaron tres configuraciones por horizonte en cada ventana; cada horizonte tiene un clasificador y un regresor.", "",
    ]

    for horizonte, objetivo in HORIZONTES.items():
        h = str(horizonte)
        baseline = resumen_comparacion[h]["metricas"]["promedio_28_dias"]
        tsb = intermitencia["tsb"][h]
        sba = intermitencia["croston_sba"][h]
        lightgbm_resultado = resultados_lightgbm[h]
        lgb_metrics = lightgbm_resultado["metricas_prueba"]
        lineas.extend([
            f"## Horizonte: {h} días", "",
            f"- **TSB elegido:** α={tsb['parametro_elegido']['alpha']}, β={tsb['parametro_elegido']['beta']}; validación WAPE medio {fmt(tsb['metricas_validacion']['wape_promedio_folds'])} %, prueba WAPE {fmt(tsb['metricas_prueba']['wape_porcentaje'])} %, MAE {fmt(tsb['metricas_prueba']['mae'])}.",
            f"- **Croston-SBA elegido:** α={sba['parametro_elegido']['alpha']}; validación WAPE medio {fmt(sba['metricas_validacion']['wape_promedio_folds'])} %, prueba WAPE {fmt(sba['metricas_prueba']['wape_porcentaje'])} %, MAE {fmt(sba['metricas_prueba']['mae'])}.",
            f"- **LightGBM hurdle elegido:** configuración {lightgbm_resultado['configuracion_elegida_id']} `{json.dumps(lightgbm_resultado['configuracion_elegida'], ensure_ascii=False)}`; validación WAPE media {fmt(lightgbm_resultado['rejilla_validacion'][lightgbm_resultado['configuracion_elegida_id']]['wape_promedio_folds'])} %, prueba WAPE {fmt(lgb_metrics['wape_porcentaje'])} %, MAE {fmt(lgb_metrics['mae'])}.",
            f"- **Referencia promedio 28 días:** prueba WAPE {fmt(baseline['wape_porcentaje'])} %, MAE {fmt(baseline['mae'])}.",
            "",
            "| Modelo / parámetro | WAPE validación | MAE validación | WAPE prueba | MAE prueba |",
            "| --- | ---: | ---: | ---: | ---: |",
            f"| TSB α={tsb['parametro_elegido']['alpha']}, β={tsb['parametro_elegido']['beta']} | {fmt(tsb['metricas_validacion']['wape_promedio_folds'])} % | {fmt(tsb['metricas_validacion']['mae_promedio_folds'])} | {fmt(tsb['metricas_prueba']['wape_porcentaje'])} % | {fmt(tsb['metricas_prueba']['mae'])} |",
            f"| SBA α={sba['parametro_elegido']['alpha']} | {fmt(sba['metricas_validacion']['wape_promedio_folds'])} % | {fmt(sba['metricas_validacion']['mae_promedio_folds'])} | {fmt(sba['metricas_prueba']['wape_porcentaje'])} % | {fmt(sba['metricas_prueba']['mae'])} |",
            f"| LightGBM config {lightgbm_resultado['configuracion_elegida_id']} | {fmt(lightgbm_resultado['rejilla_validacion'][lightgbm_resultado['configuracion_elegida_id']]['wape_promedio_folds'])} % | {fmt(lightgbm_resultado['rejilla_validacion'][lightgbm_resultado['configuracion_elegida_id']]['mae_promedio_folds'])} | {fmt(lgb_metrics['wape_porcentaje'])} % | {fmt(lgb_metrics['mae'])} |",
            f"| Promedio 28 días | — | — | {fmt(baseline['wape_porcentaje'])} % | {fmt(baseline['mae'])} |",
            "",
        ])

    ARCHIVO_JSON.write_text(json.dumps(resultados, ensure_ascii=False, indent=2), encoding="utf-8")
    ARCHIVO_REPORTE.write_text("\n".join(lineas), encoding="utf-8")
    print(f"Reporte: {ARCHIVO_REPORTE}")
    print(f"Resultados JSON: {ARCHIVO_JSON}")
    print(f"Modelos LightGBM ajustados: {CARPETA_MODELOS}")


if __name__ == "__main__":
    main()
