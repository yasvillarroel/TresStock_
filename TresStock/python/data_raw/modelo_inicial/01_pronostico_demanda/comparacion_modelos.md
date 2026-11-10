# Comparación inicial de modelos de demanda

Prueba cronológica desde **2026-05-25**. con 323.383 filas. SBA y TSB se actualizan diariamente con los datos disponibles hasta cada fecha de corte. Los días marcados como atípicos no actualizan esos métodos ni la referencia semanal.

Se comparan dos referencias, dos métodos para demanda intermitente y la regresión lineal inicial. En todos los métodos se recortan predicciones negativas a cero.

## Pronóstico a 7 días

- **Variable objetivo:** `objetivo_7_dias`; **objetivos en cero:** 87,356 %.

| Método | MAE (unidades) | RMSE | WAPE | Sesgo | R² |
| --- | ---: | ---: | ---: | ---: | ---: |
| promedio_28_dias | 0,341 | 1,540 | 53,646 % | 0,003 | 0,952 |
| mismo_dia_semana_4_semanas | 0,341 | 1,540 | 53,647 % | 0,003 | 0,952 |
| croston_sba | 3,367 | 6,474 | 530,160 % | 3,047 | 0,154 |
| tsb | 0,343 | 1,559 | 53,943 % | 0,007 | 0,951 |
| regresion_lineal | 0,406 | 1,513 | 63,913 % | 0,060 | 0,954 |

- **Menor MAE:** `promedio_28_dias`. **Menor WAPE:** `promedio_28_dias`.

## Pronóstico a 14 días

- **Variable objetivo:** `objetivo_14_dias`; **objetivos en cero:** 82,648 %.

| Método | MAE (unidades) | RMSE | WAPE | Sesgo | R² |
| --- | ---: | ---: | ---: | ---: | ---: |
| promedio_28_dias | 0,572 | 2,519 | 44,972 % | 0,005 | 0,967 |
| mismo_dia_semana_4_semanas | 0,572 | 2,519 | 44,972 % | 0,005 | 0,967 |
| croston_sba | 6,601 | 12,818 | 519,408 % | 6,093 | 0,146 |
| tsb | 0,584 | 2,590 | 45,935 % | 0,014 | 0,965 |
| regresion_lineal | 0,701 | 2,424 | 55,194 % | 0,128 | 0,969 |

- **Menor MAE:** `promedio_28_dias`. **Menor WAPE:** `promedio_28_dias`.

## Pronóstico a 30 días

- **Variable objetivo:** `objetivo_30_dias`; **objetivos en cero:** 76,475 %.

| Método | MAE (unidades) | RMSE | WAPE | Sesgo | R² |
| --- | ---: | ---: | ---: | ---: | ---: |
| promedio_28_dias | 1,104 | 5,022 | 40,580 % | 0,014 | 0,970 |
| mismo_dia_semana_4_semanas | 1,104 | 4,997 | 40,559 % | 0,014 | 0,970 |
| croston_sba | 13,947 | 27,347 | 512,595 % | 13,058 | 0,105 |
| tsb | 1,151 | 5,229 | 42,307 % | 0,033 | 0,967 |
| regresion_lineal | 1,340 | 4,423 | 49,264 % | 0,278 | 0,977 |

- **Menor MAE:** `mismo_dia_semana_4_semanas`. **Menor WAPE:** `mismo_dia_semana_4_semanas`.
