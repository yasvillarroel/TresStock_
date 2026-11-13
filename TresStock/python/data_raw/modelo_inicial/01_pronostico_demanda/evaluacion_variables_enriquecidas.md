# Evaluación de variables adicionales para pronóstico

Se comparó un LightGBM hurdle enriquecido con el LightGBM hurdle base, usando los mismos parámetros y fechas de entrenamiento/prueba. La prueba ya se había revisado en experimentos previos, así que esta exploración no es una evaluación final independiente.

- **Entrenamiento hasta:** 2026-04-25.
- **Prueba:** 2026-05-25 a 2026-08-31 (323.383 filas).
- **Variables nuevas:** boletas_7_dias, boletas_28_dias, precio_venta_promedio_28_dias, descuento_porcentaje_28_dias, boletas_00_06_28_dias, boletas_06_12_28_dias, boletas_12_18_28_dias, boletas_18_24_28_dias.
- Los predictores se calculan usando únicamente información disponible hasta cada fecha de corte.

| Horizonte | Promedio 28 días MAE / WAPE | Hurdle base MAE / WAPE | Hurdle enriquecido MAE / WAPE |
| --- | ---: | ---: | ---: |
| 7 días | 0,341 / 53,646 % | 0,416 / 65,580 % | 0,416 / 65,541 % |
| 14 días | 0,572 / 44,972 % | 0,720 / 56,655 % | 0,715 / 56,295 % |
| 30 días | 1,104 / 40,580 % | 1,353 / 49,734 % | 1,330 / 48,877 % |

## Lectura por horizonte

### 7 días
El modelo enriquecido mejoró el WAPE del LightGBM base en 0,039 puntos y mejoró el MAE en 0,000 unidades. El promedio de 28 días obtuvo WAPE 53,646 %.
Importancia del clasificador: boletas_28_dias (1.647.600,646), codigo (1.238.100,127), promedio_28_dias (972.770,929), boletas_7_dias (69.853,159), promedio_7_dias (56.585,621).

### 14 días
El modelo enriquecido mejoró el WAPE del LightGBM base en 0,359 puntos y mejoró el MAE en 0,005 unidades. El promedio de 28 días obtuvo WAPE 44,972 %.
Importancia del clasificador: codigo (1.970.218,491), boletas_28_dias (1.748.574,105), promedio_28_dias (1.097.085,062), promedio_7_dias (124.814,220), boletas_7_dias (84.237,273).

### 30 días
El modelo enriquecido mejoró el WAPE del LightGBM base en 0,857 puntos y mejoró el MAE en 0,023 unidades. El promedio de 28 días obtuvo WAPE 40,580 %.
Importancia del clasificador: codigo (3.111.466,189), promedio_28_dias (2.114.781,525), boletas_28_dias (716.763,452), promedio_7_dias (122.383,975), mes (111.783,735).

## Conclusión

Las variables nuevas mejoran ligeramente al LightGBM base, pero el promedio de 28 días mantiene menor MAE y WAPE en los tres horizontes. Se conserva el promedio como referencia seleccionada; el LightGBM enriquecido queda como experimento pendiente de una validación futura independiente.
