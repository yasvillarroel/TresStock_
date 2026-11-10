# Ajuste de parámetros para pronóstico de demanda

Se eligieron parámetros por WAPE promedio de tres ventanas cronológicas internas de 30 días (noviembre 2025, enero 2026 y marzo 2026); MAE desempata. El conjunto de prueba va después de las validaciones y no intervino en la selección de parámetros.

- **Validaciones:** 2025-11-01, 2026-01-01, 2026-03-01.
- **Prueba de referencia:** 2026-05-25 a 2026-08-31.
- **Nota:** Este periodo ya se revisó en experimentos iniciales; los parámetros se eligieron solo con las validaciones internas, pero conviene confirmar los resultados con ventas futuras nuevas.
- SBA y TSB usan solo ventas conocidas hasta cada fecha de corte; días atípicos no actualizan sus estados.
- Para LightGBM se probaron tres configuraciones por horizonte en cada ventana; cada horizonte tiene un clasificador y un regresor.
- Los modelos entrenados se usaron únicamente en memoria para las pruebas; no se conservaron archivos binarios.

## Horizonte: 7 días

- **TSB elegido:** α=0.1, β=0.1; validación WAPE medio 56,574 %, prueba WAPE 53,943 %, MAE 0,343.
- **Croston-SBA elegido:** α=0.5; validación WAPE medio 341,862 %, prueba WAPE 398,083 %, MAE 2,528.
- **LightGBM hurdle elegido:** configuración 2 `{"n_estimators": 350, "learning_rate": 0.04, "num_leaves": 31, "min_child_samples": 100, "reg_lambda": 1.0}`; validación WAPE media 62,163 %, prueba WAPE 65,580 %, MAE 0,416.
- **Referencia promedio 28 días:** prueba WAPE 53,646 %, MAE 0,341.

| Modelo / parámetro | WAPE validación | MAE validación | WAPE prueba | MAE prueba |
| --- | ---: | ---: | ---: | ---: |
| TSB α=0.1, β=0.1 | 56,574 % | 0,446 | 53,943 % | 0,343 |
| SBA α=0.5 | 341,862 % | 2,655 | 398,083 % | 2,528 |
| LightGBM config 2 | 62,163 % | 0,491 | 65,580 % | 0,416 |
| Promedio 28 días | — | — | 53,646 % | 0,341 |

## Horizonte: 14 días

- **TSB elegido:** α=0.05, β=0.1; validación WAPE medio 48,814 %, prueba WAPE 45,804 %, MAE 0,582.
- **Croston-SBA elegido:** α=0.5; validación WAPE medio 334,615 %, prueba WAPE 389,595 %, MAE 4,951.
- **LightGBM hurdle elegido:** configuración 2 `{"n_estimators": 350, "learning_rate": 0.04, "num_leaves": 31, "min_child_samples": 100, "reg_lambda": 1.0}`; validación WAPE media 54,074 %, prueba WAPE 56,655 %, MAE 0,720.
- **Referencia promedio 28 días:** prueba WAPE 44,972 %, MAE 0,572.

| Modelo / parámetro | WAPE validación | MAE validación | WAPE prueba | MAE prueba |
| --- | ---: | ---: | ---: | ---: |
| TSB α=0.05, β=0.1 | 48,814 % | 0,767 | 45,804 % | 0,582 |
| SBA α=0.5 | 334,615 % | 5,177 | 389,595 % | 4,951 |
| LightGBM config 2 | 54,074 % | 0,852 | 56,655 % | 0,720 |
| Promedio 28 días | — | — | 44,972 % | 0,572 |

## Horizonte: 30 días

- **TSB elegido:** α=0.05, β=0.1; validación WAPE medio 45,453 %, prueba WAPE 42,253 %, MAE 1,150.
- **Croston-SBA elegido:** α=0.5; validación WAPE medio 332,283 %, prueba WAPE 383,818 %, MAE 10,443.
- **LightGBM hurdle elegido:** configuración 2 `{"n_estimators": 350, "learning_rate": 0.04, "num_leaves": 31, "min_child_samples": 100, "reg_lambda": 1.0}`; validación WAPE media 47,931 %, prueba WAPE 49,734 %, MAE 1,353.
- **Referencia promedio 28 días:** prueba WAPE 40,580 %, MAE 1,104.

| Modelo / parámetro | WAPE validación | MAE validación | WAPE prueba | MAE prueba |
| --- | ---: | ---: | ---: | ---: |
| TSB α=0.05, β=0.1 | 45,453 % | 1,515 | 42,253 % | 1,150 |
| SBA α=0.5 | 332,283 % | 10,885 | 383,818 % | 10,443 |
| LightGBM config 2 | 47,931 % | 1,600 | 49,734 % | 1,353 |
| Promedio 28 días | — | — | 40,580 % | 1,104 |
