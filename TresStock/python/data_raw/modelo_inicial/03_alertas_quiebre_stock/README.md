# Objetivo: alertas de quiebre de stock

## Propósito

Identificar productos cuyo inventario podría agotarse antes de que llegue una reposición y mostrar cuánta atención requieren.

## Datos y revisión inicial

El archivo `dataset_alertas_quiebre.csv` tiene 4.125 productos y estas variables históricas: última fecha con venta, días desde esa venta, promedio de demanda diaria reciente y unidades vendidas en los últimos 28 días.

Los campos `stock_actual_pendiente_bd`, `stock_minimo_pendiente_bd`, `plazo_entrega_pendiente_bd` y `cobertura_stock_dias_pendiente_bd` están vacíos en las 4.125 filas. No es posible decidir qué producto está en riesgo real sin stock vigente y plazo de entrega. La fecha de corte del CSV inicial también es el 30 de septiembre de 2026; una alerta futura debe usar una fecha de corte actualizada.

## Pruebas realizadas y métricas

MAE/WAPE evalúan errores de pronóstico de demanda, pero no dicen si una alerta de quiebre fue correcta o si llegó con tiempo suficiente. Para validar alertas se necesitan resultados históricos por fecha: cuándo se agotó cada producto, cuándo se pidió, cuándo llegó el proveedor y si se atendieron las ventas.

El CSV inicial no aporta stock histórico ni etiquetas de quiebre. Por lo tanto, no se puede entrenar ni evaluar con precisión/recall una clasificación de riesgo; tampoco se debe afirmar que ya predice quiebres.

### Búsqueda del enfoque adecuado

Se consideraron dos alternativas:

| Enfoque | Requisitos | Decisión |
| --- | --- | --- |
| Regla de cobertura y demanda durante el plazo | Stock disponible, demanda futura estimada, plazo y órdenes entrantes | Seleccionada para el primer despliegue, una vez conectadas las variables operativas |
| Clasificador (por ejemplo, regresión logística o boosting) | Etiquetas históricas por fecha de si hubo quiebre antes de reponer; inventario, plazo, órdenes y demanda conocidos en ese instante | No se puede entrenar hoy: faltan snapshots y etiquetas reales |

Un estudio de predicción de stockouts con datos minoristas encontró que niveles actuales de inventario, demanda reciente y pronósticos próximos eran variables importantes. TresStock aún no tiene esos datos históricos sincronizados por fecha. No sería válido generar etiquetas retrospectivas a partir del stock actual.

## Método seleccionado

Se recomienda una **regla de riesgo determinística**, no un modelo de ML, para la primera versión. Con información operativa actualizada:

```text
demanda_diaria = promedio de ventas recientes (o pronóstico vigente)
dias_cobertura = stock_disponible / demanda_diaria
riesgo = alto si stock_actual <= 0
riesgo = alto si demanda esperada durante el plazo > stock disponible
riesgo = preventivo si dias_cobertura <= plazo de entrega
```

`stock_disponible` debe descontar compromisos o sumar órdenes entrantes según la política que defina TresStock. Si la demanda estimada es cero, la cobertura no debe dividir por cero: se marca sin consumo reciente y se revisa por antigüedad de la última venta o criticidad.

### Parámetros candidatos por ajustar

La regla compara demanda acumulada durante el plazo del proveedor con unidades disponibles. El umbral natural es el plazo real; para generar anticipación operativa se podría evaluar un colchón de 0, 1 o 3 días adicionales. **No elegimos un colchón todavía**, porque no hay fechas de quiebre ni de recepción con que medir alertas anticipadas y falsas alarmas.

Cuando se acumulen etiquetas, probar clasificación logística como referencia interpretable y un modelo de árboles como LightGBM. Ajustar umbral de alerta usando recall/precisión y días de anticipación, ponderando el costo de una falsa alarma y de un quiebre no detectado. No usar accuracy como criterio único por el desequilibrio entre productos con y sin quiebre.

## Por qué no un modelo de machine learning todavía

Un clasificador necesita ejemplos históricos de “se quebró” y “no se quebró” calculados a una fecha pasada, usando solo las variables disponibles en ese momento. No hay snapshots de inventario ni resultados de reposición por fecha en este CSV. Sin esas etiquetas, las métricas de clasificación serían inventadas o tendrían filtración temporal.

## Cómo evaluar más adelante

Al comenzar a guardar snapshots y fechas de recepción, evaluar alertas sobre ventanas futuras con:

- **recall:** proporción de quiebres reales que la alerta anticipó;
- **precisión:** proporción de alertas que terminaron en quiebre;
- **anticipación:** días entre alerta y agotamiento;
- **falsas alarmas y quiebres no anticipados**, separando sus costos cuando existan.

MAE/WAPE pueden seguir midiendo la demanda prevista como dato de entrada, pero no reemplazan esas métricas de alerta.

## Decisión actual

**Usar reglas de riesgo explicables, no ML**, una vez disponibles stock actual, plazos y órdenes en camino. Con el dataset actual solo pueden describirse ventas y antigüedad de la última venta; no emitir una alerta operativa válida.

## Referencia metodológica

- [A machine learning approach to inventory stockout prediction](https://doi.org/10.1016/j.jdec.2025.06.002): estudio minorista que utiliza niveles de inventario actuales, ventas recientes y pronósticos de corto plazo; requiere datos y etiquetas históricos por SKU.

## Archivos

- Dataset inicial: `dataset_alertas_quiebre.csv`.
- Estadísticas descriptivas: `dataset_alertas_quiebre_reporte.md`.
- Preparación del dataset: `../preparar_modelo_inicial.py`.
