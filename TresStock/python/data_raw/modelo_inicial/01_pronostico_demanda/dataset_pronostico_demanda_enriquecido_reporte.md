# Dataset experimental enriquecido para pronóstico de demanda

- **Fuente:** `info_inicial.csv` (CSV inicial; solo lectura).
- **Filas:** 1.124.935.
- **Variables:** 20.
- **Periodo:** 2025-04-01 a 2026-09-30.
- Este archivo se mantiene separado del dataset base y no modifica la base de datos.

## Variables adicionales evaluadas

- `boletas_7_dias` y `boletas_28_dias`: cantidad de boletas distintas con el producto en las ventanas hasta la fecha de corte.
- `precio_venta_promedio_28_dias`: precio efectivo medio ponderado por unidades positivas en los últimos 28 días; queda en 0 si no hubo ventas observadas.
- `descuento_porcentaje_28_dias`: descuento agregado ponderado en la ventana; queda en 0 si no hubo precio regular observable.
- `boletas_00_06_28_dias`, `boletas_06_12_28_dias`, `boletas_12_18_28_dias` y `boletas_18_24_28_dias`: boletas distintas por bloque horario en los últimos 28 días.

Las variables se calculan solo con fechas hasta `fecha_corte`; no se usan datos futuros como predictores. El objetivo sigue siendo unidades positivas vendidas en los siguientes 7, 14 o 30 días.

## Alcance

Es un dataset para un experimento comparativo. No reemplaza el dataset base ni despliega un modelo. El precio observado puede no representar promociones planificadas y las ventas no indican si el producto estuvo disponible durante todo el periodo.
