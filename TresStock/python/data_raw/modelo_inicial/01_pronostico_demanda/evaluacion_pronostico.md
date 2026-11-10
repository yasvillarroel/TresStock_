# Evaluación inicial del pronóstico de demanda

Se entrenó una regresión lineal independiente para cada horizonte. La prueba contiene fechas posteriores al entrenamiento; se dejó un intervalo de 30 días entre ambos para reducir filtración entre etiquetas futuras.

- **Entrenamiento:** 2025-04-28 a 2026-04-25 (713.341 filas).
- **Evaluación:** 2026-05-25 a 2026-08-31 (323.383 filas).
- **Filas apartadas en la brecha temporal:** 88.211.
- Las predicciones negativas se recortan a cero al calcular métricas, porque la demanda no puede ser negativa.
- WAPE mide el error absoluto total como porcentaje de las unidades reales; menor es mejor.

## Horizonte de 7 días

- **Objetivo:** `objetivo_7_dias`.
- **Regresión lineal:** MAE 0,406 unidades · RMSE 1,513 · WAPE 63,913% · sesgo 0,060 · R² 0,954.
- **Referencia (promedio diario de 28 días × 7):** MAE 0,341 · RMSE 1,540 · WAPE 53,646%.
- **Comparación:** la regresión no mejora el MAE de la referencia por 0,065 unidades.
- **Modelo guardado:** `modelos\regresion_lineal_7_dias.joblib`.

## Horizonte de 14 días

- **Objetivo:** `objetivo_14_dias`.
- **Regresión lineal:** MAE 0,701 unidades · RMSE 2,424 · WAPE 55,194% · sesgo 0,128 · R² 0,969.
- **Referencia (promedio diario de 28 días × 14):** MAE 0,572 · RMSE 2,519 · WAPE 44,972%.
- **Comparación:** la regresión no mejora el MAE de la referencia por 0,130 unidades.
- **Modelo guardado:** `modelos\regresion_lineal_14_dias.joblib`.

## Horizonte de 30 días

- **Objetivo:** `objetivo_30_dias`.
- **Regresión lineal:** MAE 1,340 unidades · RMSE 4,423 · WAPE 49,264% · sesgo 0,278 · R² 0,977.
- **Referencia (promedio diario de 28 días × 30):** MAE 1,104 · RMSE 5,022 · WAPE 40,580%.
- **Comparación:** la regresión no mejora el MAE de la referencia por 0,236 unidades.
- **Modelo guardado:** `modelos\regresion_lineal_30_dias.joblib`.
