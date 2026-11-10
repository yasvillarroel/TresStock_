# Evaluación LightGBM hurdle para pronóstico de demanda

El modelo estima primero la probabilidad de que las ventas futuras sean mayores que cero y luego las unidades esperadas cuando sí hay venta. El pronóstico de unidades es `probabilidad × cantidad positiva estimada`.

- **Entrenamiento:** 2025-04-28 a 2026-04-25 (713.341 filas).
- **Prueba:** 2026-05-25 a 2026-08-31 (323.383 filas).
- La separación replica la prueba temporal anterior, con 30 días de brecha.
- El código de producto, mes y día de semana se entregan a LightGBM como categóricas, sin expandir el código en miles de columnas one-hot.
- Los pronósticos negativos se recortan a cero antes de calcular las métricas.

## Horizonte de 7 días

- **Objetivo en cero en la prueba:** 87,356 %.
- **Hurdle LightGBM:** MAE 0,416 · RMSE 1,641 · WAPE 65,580 % · sesgo 0,053 · R² 0,946.
- **Promedio 28 días:** MAE 0,341 · WAPE 53,646 %.
- **Diferencia de MAE frente al promedio:** -0,076 unidades (positivo significa mejora).
- **Diferencia de WAPE frente al promedio:** -11,934 puntos porcentuales (positivo significa mejora).
- **Predictores más influyentes (clasificador / cantidad):** promedio_28_dias (2285786 / 262539161); codigo (1328200 / 38097411); promedio_7_dias (381531 / 70387134); mes (49721 / 2235229); unidades_mismo_dia_semana_anterior (8645 / 0).
- **Artefacto:** modelo usado solo para evaluación; binario eliminado para ahorrar espacio.

## Horizonte de 14 días

- **Objetivo en cero en la prueba:** 82,648 %.
- **Hurdle LightGBM:** MAE 0,720 · RMSE 2,683 · WAPE 56,655 % · sesgo 0,102 · R² 0,963.
- **Promedio 28 días:** MAE 0,572 · WAPE 44,972 %.
- **Diferencia de MAE frente al promedio:** -0,148 unidades (positivo significa mejora).
- **Diferencia de WAPE frente al promedio:** -11,683 puntos porcentuales (positivo significa mejora).
- **Predictores más influyentes (clasificador / cantidad):** promedio_28_dias (2522054 / 1078307137); codigo (2125066 / 207399797); promedio_7_dias (434615 / 210831219); mes (75576 / 8946777); unidades_mismo_dia_semana_anterior (7559 / 0).
- **Artefacto:** modelo usado solo para evaluación; binario eliminado para ahorrar espacio.

## Horizonte de 30 días

- **Objetivo en cero en la prueba:** 76,475 %.
- **Hurdle LightGBM:** MAE 1,353 · RMSE 5,232 · WAPE 49,734 % · sesgo 0,170 · R² 0,967.
- **Promedio 28 días:** MAE 1,104 · WAPE 40,580 %.
- **Diferencia de MAE frente al promedio:** -0,249 unidades (positivo significa mejora).
- **Diferencia de WAPE frente al promedio:** -9,154 puntos porcentuales (positivo significa mejora).
- **Predictores más influyentes (clasificador / cantidad):** codigo (3297132 / 1202501619); promedio_28_dias (2526333 / 5068135655); promedio_7_dias (425288 / 496224716); mes (123212 / 35277313); unidades_mismo_dia_semana_anterior (3325 / 0).
- **Artefacto:** modelo usado solo para evaluación; binario eliminado para ahorrar espacio.
