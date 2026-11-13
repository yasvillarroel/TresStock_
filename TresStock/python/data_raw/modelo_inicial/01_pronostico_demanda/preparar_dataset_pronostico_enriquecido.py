"""Prepara un dataset experimental de demanda con variables adicionales del CSV."""
import sys
from pathlib import Path


CARPETA_OBJETIVO = Path(__file__).resolve().parent
CARPETA_MODELO = CARPETA_OBJETIVO.parent
sys.path.insert(0, str(CARPETA_MODELO))

import preparar_modelo_inicial as preparador


ARCHIVO_DATASET = CARPETA_OBJETIVO / "dataset_pronostico_demanda_enriquecido.csv"
ARCHIVO_REPORTE = CARPETA_OBJETIVO / "dataset_pronostico_demanda_enriquecido_reporte.md"


def main():
    datos = preparador.normalizar_ventas()
    series = preparador.construir_series(datos)
    dias_atipicos = preparador.detectar_dias_atipicos(datos["ventas"])
    ruta, filas, columnas = preparador.escribir_pronostico_enriquecido(
        datos, series, dias_atipicos, ARCHIVO_DATASET
    )
    reporte = [
        "# Dataset experimental enriquecido para pronóstico de demanda",
        "",
        f"- **Fuente:** `{preparador.ARCHIVO_ORIGEN.name}` (CSV inicial; solo lectura).",
        f"- **Filas:** {preparador.formatear_entero(filas)}.",
        f"- **Variables:** {len(columnas)}.",
        f"- **Periodo:** {datos['fecha_inicial']} a {datos['fecha_final']}.",
        "- Este archivo se mantiene separado del dataset base y no modifica la base de datos.",
        "",
        "## Variables adicionales evaluadas",
        "",
        "- `boletas_7_dias` y `boletas_28_dias`: cantidad de boletas distintas con el producto en las ventanas hasta la fecha de corte.",
        "- `precio_venta_promedio_28_dias`: precio efectivo medio ponderado por unidades positivas en los últimos 28 días; queda en 0 si no hubo ventas observadas.",
        "- `descuento_porcentaje_28_dias`: descuento agregado ponderado en la ventana; queda en 0 si no hubo precio regular observable.",
        "- `boletas_00_06_28_dias`, `boletas_06_12_28_dias`, `boletas_12_18_28_dias` y `boletas_18_24_28_dias`: boletas distintas por bloque horario en los últimos 28 días.",
        "",
        "Las variables se calculan solo con fechas hasta `fecha_corte`; no se usan datos futuros como predictores. El objetivo sigue siendo unidades positivas vendidas en los siguientes 7, 14 o 30 días.",
        "",
        "## Alcance",
        "",
        "Es un dataset para un experimento comparativo. No reemplaza el dataset base ni despliega un modelo. El precio observado puede no representar promociones planificadas y las ventas no indican si el producto estuvo disponible durante todo el periodo.",
        "",
    ]
    ARCHIVO_REPORTE.write_text("\n".join(reporte), encoding="utf-8")
    print(f"Dataset experimental: {ruta}")
    print(f"Reporte: {ARCHIVO_REPORTE}")
    print(f"Filas: {filas:,}; variables: {len(columnas)}")
    print("El CSV original y la base de datos no se modificaron.")


if __name__ == "__main__":
    main()
