"""Compara SBA, TSB y referencias temporales en la misma prueba cronológica."""
import csv
import json
from collections import defaultdict, deque
from datetime import date, timedelta
from pathlib import Path

import numpy as np
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


CARPETA = Path(__file__).resolve().parent
ARCHIVO_PRONOSTICO = CARPETA / "dataset_pronostico_demanda.csv"
ARCHIVO_DIARIO = CARPETA.parent / "04_estacionalidad_tendencias" / "dataset_estacionalidad_tendencias.csv"
ARCHIVO_EVALUACION_LINEAL = CARPETA / "evaluacion_pronostico.json"
ARCHIVO_JSON = CARPETA / "comparacion_modelos.json"
ARCHIVO_REPORTE = CARPETA / "comparacion_modelos.md"
ALFA_CROSTON = 0.1
ALFA_TSB = 0.1
BETA_TSB = 0.1
HORIZONTES = {7: "objetivo_7_dias", 14: "objetivo_14_dias", 30: "objetivo_30_dias"}


def metricas(real, predicho):
    predicho = np.maximum(np.asarray(predicho, dtype=float), 0)
    real = np.asarray(real, dtype=float)
    suma_real = float(np.abs(real).sum())
    return {
        "mae": float(mean_absolute_error(real, predicho)),
        "rmse": float(np.sqrt(mean_squared_error(real, predicho))),
        "wape_porcentaje": float(np.abs(real - predicho).sum() / suma_real * 100) if suma_real else None,
        "sesgo_promedio": float(np.mean(predicho - real)),
        "r2": float(r2_score(real, predicho)),
    }


def cargar_filas_prueba():
    if not ARCHIVO_EVALUACION_LINEAL.is_file():
        raise FileNotFoundError("Primero ejecuta entrenar_pronostico.py para definir la prueba cronológica.")
    separacion = json.loads(ARCHIVO_EVALUACION_LINEAL.read_text(encoding="utf-8"))["separacion"]
    fecha_inicio = date.fromisoformat(separacion["desde_prueba"])
    filas = []
    fechas_prueba = defaultdict(set)
    with ARCHIVO_PRONOSTICO.open("r", encoding="utf-8-sig", newline="") as archivo:
        for fila in csv.DictReader(archivo):
            dia = date.fromisoformat(fila["fecha_corte"])
            if dia < fecha_inicio:
                continue
            codigo = fila["codigo"]
            fila_prueba = {
                "codigo": codigo,
                "fecha": dia,
                "promedio_28_dias": float(fila["promedio_28_dias"]),
                **{columna: float(fila[columna]) for columna in HORIZONTES.values()},
            }
            filas.append(fila_prueba)
            fechas_prueba[codigo].add(dia)
    if not filas:
        raise ValueError("No hay filas de prueba en el dataset de pronóstico.")
    return filas, fechas_prueba, fecha_inicio


def calcular_pronosticos_por_fecha(fechas_prueba):
    if not ARCHIVO_DIARIO.is_file():
        raise FileNotFoundError("Falta el dataset diario de tendencias; ejecuta preparar_modelo_inicial.py.")

    pronosticos = {}
    codigo_actual = None
    indice_dia = 0
    ultima_venta_idx = None
    tamano_croston = None
    intervalo_croston = None
    probabilidad_tsb = None
    tamano_tsb = None
    historial_semanal = [deque(maxlen=4) for _ in range(7)]

    with ARCHIVO_DIARIO.open("r", encoding="utf-8-sig", newline="") as archivo:
        for fila in csv.DictReader(archivo):
            codigo = fila["codigo"]
            if codigo != codigo_actual:
                codigo_actual = codigo
                indice_dia = 0
                ultima_venta_idx = None
                tamano_croston = None
                intervalo_croston = None
                probabilidad_tsb = None
                tamano_tsb = None
                historial_semanal = [deque(maxlen=4) for _ in range(7)]

            dia = date.fromisoformat(fila["fecha"])
            cantidad = float(fila["unidades_vendidas"] or 0)
            es_atipico = fila["es_dia_atipico"].lower() == "true"

            # Los días atípicos se saltan para mantener el mismo criterio de depuración del dataset.
            if not es_atipico:
                ocurrio_demanda = cantidad > 0
                if ocurrio_demanda:
                    if tamano_croston is None:
                        tamano_croston = cantidad
                        intervalo_croston = max(indice_dia + 1, 1)
                    else:
                        intervalo = indice_dia - ultima_venta_idx
                        tamano_croston = ALFA_CROSTON * cantidad + (1 - ALFA_CROSTON) * tamano_croston
                        intervalo_croston = ALFA_CROSTON * intervalo + (1 - ALFA_CROSTON) * intervalo_croston
                    ultima_venta_idx = indice_dia

                    if probabilidad_tsb is None:
                        probabilidad_tsb = 1.0
                        tamano_tsb = cantidad
                    else:
                        probabilidad_tsb += BETA_TSB * (1.0 - probabilidad_tsb)
                        tamano_tsb += ALFA_TSB * (cantidad - tamano_tsb)
                elif probabilidad_tsb is not None:
                    probabilidad_tsb += BETA_TSB * (0.0 - probabilidad_tsb)

                historial_semanal[dia.weekday()].append(cantidad)

            if dia in fechas_prueba.get(codigo, ()):
                tasa_sba = 0.0
                if tamano_croston is not None and intervalo_croston:
                    tasa_sba = (1.0 - ALFA_CROSTON / 2.0) * tamano_croston / intervalo_croston
                tasa_tsb = (probabilidad_tsb or 0.0) * (tamano_tsb or 0.0)

                promedios_semana = [
                    sum(historial_semanal[weekday]) / len(historial_semanal[weekday]) if historial_semanal[weekday] else 0.0
                    for weekday in range(7)
                ]
                referencia_semana = {
                    horizonte: sum(promedios_semana[(dia.weekday() + paso) % 7] for paso in range(1, horizonte + 1))
                    for horizonte in HORIZONTES
                }
                pronosticos[(codigo, dia)] = {
                    "croston_sba": tasa_sba,
                    "tsb": tasa_tsb,
                    "mismo_dia_semana_4_semanas": referencia_semana,
                }
            indice_dia += 1

    return pronosticos


def formato_numero(valor):
    return f"{valor:,.3f}".replace(",", "X").replace(".", ",").replace("X", ".")


def main():
    filas, fechas_prueba, fecha_inicio = cargar_filas_prueba()
    pronosticos = calcular_pronosticos_por_fecha(fechas_prueba)
    if len(pronosticos) != len(filas):
        raise ValueError(f"Se esperaban {len(filas):,} pronósticos diarios y se generaron {len(pronosticos):,}.")

    resumen_lineal = json.loads(ARCHIVO_EVALUACION_LINEAL.read_text(encoding="utf-8"))["modelos_por_horizonte"]
    resultados = {
        "metodo": "Evaluación móvil por fecha: en cada corte solo se usan días observados hasta ese corte.",
        "fecha_inicio_prueba": fecha_inicio.isoformat(),
        "parametros": {"alfa_sba": ALFA_CROSTON, "alfa_tsb": ALFA_TSB, "beta_tsb": BETA_TSB},
        "filas_prueba": len(filas),
        "modelos_por_horizonte": {},
    }
    metodos = ["promedio_28_dias", "mismo_dia_semana_4_semanas", "croston_sba", "tsb", "regresion_lineal"]
    reporte = [
        "# Comparación inicial de modelos de demanda", "",
        f"Prueba cronológica desde **{fecha_inicio.isoformat()}**, con {len(filas):,} filas. SBA y TSB se actualizan diariamente con los datos disponibles hasta cada fecha de corte. Los días marcados como atípicos no actualizan esos métodos ni la referencia semanal.".replace(",", "."),
        "",
        "Se comparan dos referencias, dos métodos para demanda intermitente y la regresión lineal inicial. En todos los métodos se recortan predicciones negativas a cero.",
        "",
    ]

    for horizonte, objetivo in HORIZONTES.items():
        real = np.array([fila[objetivo] for fila in filas], dtype=float)
        predicciones = {
            "promedio_28_dias": np.array([fila["promedio_28_dias"] * horizonte for fila in filas]),
            "mismo_dia_semana_4_semanas": np.array([pronosticos[(fila["codigo"], fila["fecha"])]["mismo_dia_semana_4_semanas"][horizonte] for fila in filas]),
            "croston_sba": np.array([pronosticos[(fila["codigo"], fila["fecha"])]["croston_sba"] * horizonte for fila in filas]),
            "tsb": np.array([pronosticos[(fila["codigo"], fila["fecha"])]["tsb"] * horizonte for fila in filas]),
        }
        porcentaje_cero = float(np.mean(real == 0) * 100)
        resultados_horizonte = {
            "objetivo": objetivo,
            "porcentaje_objetivo_cero": porcentaje_cero,
            "metricas": {},
        }
        for metodo in metodos:
            if metodo == "regresion_lineal":
                metrica = resumen_lineal[str(horizonte)]["metricas_regresion_lineal"]
            else:
                metrica = metricas(real, predicciones[metodo])
            resultados_horizonte["metricas"][metodo] = metrica
        resultados["modelos_por_horizonte"][str(horizonte)] = resultados_horizonte

        mejor_mae = min(metodos, key=lambda m: resultados_horizonte["metricas"][m]["mae"])
        mejor_wape = min(metodos, key=lambda m: resultados_horizonte["metricas"][m]["wape_porcentaje"])
        reporte.extend([
            f"## Pronóstico a {horizonte} días", "",
            f"- **Variable objetivo:** `{objetivo}`; **objetivos en cero:** {formato_numero(porcentaje_cero)} %.",
            "",
            "| Método | MAE (unidades) | RMSE | WAPE | Sesgo | R² |",
            "| --- | ---: | ---: | ---: | ---: | ---: |",
        ])
        for metodo in metodos:
            m = resultados_horizonte["metricas"][metodo]
            reporte.append(f"| {metodo} | {formato_numero(m['mae'])} | {formato_numero(m['rmse'])} | {formato_numero(m['wape_porcentaje'])} % | {formato_numero(m['sesgo_promedio'])} | {formato_numero(m['r2'])} |")
        reporte.extend([
            "",
            f"- **Menor MAE:** `{mejor_mae}`. **Menor WAPE:** `{mejor_wape}`.",
            "",
        ])

    ARCHIVO_JSON.write_text(json.dumps(resultados, ensure_ascii=False, indent=2), encoding="utf-8")
    ARCHIVO_REPORTE.write_text("\n".join(reporte), encoding="utf-8")
    print(f"Comparación guardada: {ARCHIVO_REPORTE}")
    print(f"Métricas estructuradas: {ARCHIVO_JSON}")


if __name__ == "__main__":
    main()
