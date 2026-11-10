# Objetivo: estacionalidad y tendencias

## Propósito

Describir cómo cambian las ventas por día de semana, mes y periodo, para detectar patrones y ayudar a interpretar la demanda de cada producto.

## Datos revisados

El archivo `dataset_estacionalidad_tendencias.csv` tiene 1.551.070 filas producto-día y cubre del 1 de abril de 2025 al 30 de septiembre de 2026. Incluye unidades positivas, correcciones negativas y una marca de días producto atípicos. Para los resúmenes de abajo se excluyeron los 7.843 días-producto marcados como atípicos, sin borrar sus registros.

### Patrón por día de semana

La suma de unidades del catálogo por día calendario, promediada entre fechas del mismo día de semana, fue:

| Día | Unidades promedio por fecha |
| --- | ---: |
| Lunes | 632,77 |
| Martes | 646,17 |
| Miércoles | 639,26 |
| Jueves | 619,53 |
| Viernes | 594,77 |
| Sábado | 316,16 |
| Domingo | 0,00 |

La diferencia semanal es clara en estos datos, especialmente el sábado y el domingo. **Antes de tratarla como estacionalidad real hay que confirmar que los domingos la tienda no abre y que las fechas sin ventas no corresponden a importaciones faltantes.** Un calendario comercial de días abiertos evitaría que el sistema aprenda que el domingo es simplemente una demanda normal igual a cero.

### Evolución mensual observada

Unidades promedio por fecha calendario, con los días-producto atípicos excluidos:

| Periodo | Unidades/día | Periodo | Unidades/día |
| --- | ---: | --- | ---: |
| Abr 2025 | 541,13 | Abr 2026 | 483,17 |
| May 2025 | 477,06 | May 2026 | 466,85 |
| Jun 2025 | 477,49 | Jun 2026 | 496,87 |
| Jul 2025 | 482,77 | Jul 2026 | 508,06 |
| Ago 2025 | 483,28 | Ago 2026 | 513,65 |
| Sep 2025 | 480,24 | Sep 2026 | 538,62 |

Es una descripción, no una prueba de causa ni una predicción. Solo hay dos observaciones anuales comparables para abril-septiembre, así que no alcanza para afirmar un patrón estacional anual estable. Hay que revisar además si el catálogo, horarios, precios, días abiertos y completitud de importaciones se mantuvieron comparables.

## Pruebas realizadas y métricas

Este objetivo busca **detectar y describir patrones**, no pronosticar una cantidad futura por sí mismo. MAE/WAPE no son apropiados para decir si una tendencia descriptiva está “correcta”; solo aplicarían si se definiera una variable futura que predecir y un periodo de prueba.

Se realizaron resúmenes descriptivos por día de semana y por mes, usando unidades agregadas por fecha. No se ajustó una regresión de tendencia ni un modelo de ML. Las variaciones se presentan como observaciones y deben confirmarse con datos futuros y un calendario de operación.

### Búsqueda del enfoque adecuado

Se consideraron:

| Enfoque | Uso | Decisión |
| --- | --- | --- |
| Agregados/medianas por día abierto y por mes | Detectar y comunicar patrones directamente | Seleccionado para el objetivo descriptivo |
| Descomposición STL robusta con periodo semanal 7 | Separar estacionalidad semanal, tendencia y residuo; reducir influencia de valores atípicos | Candidato para visualización después de corregir calendario y días faltantes |
| Regresión con calendario o boosting | Predecir venta futura usando patrones y variables de producto | No es el objetivo descriptivo; se evaluaría dentro del objetivo 1 con fechas futuras |

MAE/WAPE no eligen entre visualizaciones/descomposiciones porque aquí no hay una variable futura objetivo. STL documenta un componente estacional de periodo fijo y permite robustez a valores extremos; el periodo semanal 7 está respaldado por la frecuencia diaria. Una temporada anual de 365 días no se puede establecer con solo 18 meses (no hay ciclos completos repetidos suficientes para distinguirla de una tendencia).

La búsqueda de ventana de suavizado de STL queda pendiente de un calendario limpio. Probar sus ventanas sobre domingos artificialmente en cero haría que el resultado interprete el cierre o falta de importación como estacionalidad.

## Método seleccionado

Para la primera versión conviene una **descomposición descriptiva simple**, no ML:

1. Agregar las ventas limpias por código y fecha.
2. Excluir días marcados para revisión solo en los promedios de referencia, manteniéndolos disponibles.
3. Calcular promedios/medianas por día abierto de semana, mes y ventanas recientes.
4. Mostrar cobertura de fechas, cantidad de días observados y advertencias por importaciones faltantes.
5. Comparar productos solo cuando tengan suficiente historial y usar un conjunto comparable de productos.

Una tendencia inferencial o un modelo estacional solo se justificaría después de confirmar el calendario de ventas y acumular más ciclos anuales completos. Para predecir demanda, se debe seguir evaluando dentro del objetivo 1 con MAE/WAPE y fechas futuras.

## Decisión actual

**Usar estadística descriptiva y visualización; no entrenar un modelo de ML para este objetivo inicial.** Hay una señal semanal fuerte en el CSV, pero el domingo en cero y el periodo corto requieren validación operativa antes de convertirla en regla. Las comparaciones mensuales son exploratorias.

## Referencias metodológicas

- [Statsmodels: STL seasonal-trend decomposition](https://www.statsmodels.org/stable/generated/statsmodels.tsa.seasonal.STL.html): descomposición estacional y de tendencia por LOESS, con opción robusta.
- [Cleveland et al. (1990), STL: A Seasonal-Trend Decomposition Procedure Based on Loess](https://www.jstor.org/stable/1392332): artículo metodológico original.

## Archivos

- Dataset inicial: `dataset_estacionalidad_tendencias.csv`.
- Estadísticas descriptivas: `dataset_estacionalidad_tendencias_reporte.md`.
- Preparación de los cuatro datasets: `../preparar_modelo_inicial.py`.
