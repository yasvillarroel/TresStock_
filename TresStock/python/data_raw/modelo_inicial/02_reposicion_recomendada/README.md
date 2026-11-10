# Objetivo: reposición recomendada

## Propósito

Recomendar qué productos reponer y cuántas unidades pedir, tomando en cuenta la demanda esperada mientras llega el proveedor y el stock que ya existe o viene en camino.

## Datos y revisión inicial

El archivo `dataset_reposicion.csv` contiene 4.125 productos con ventas históricas agregadas a la fecha de corte del 30 de septiembre de 2026. Incluye ventas totales de 7, 28 y 90 días, promedios diarios y días con venta en los últimos 90 días.

En este dataset inicial están vacíos para los 4.125 productos:

- `stock_actual_pendiente_bd`
- `stock_minimo_pendiente_bd`
- `plazo_entrega_pendiente_bd`
- `ordenes_pendientes_compra`

Por eso todavía no se puede calcular una recomendación real de compra. El CSV de ventas no guarda el inventario vigente ni las órdenes pendientes; hay que unirlo con PostgreSQL y, para órdenes pendientes, hace falta que exista esa información en una tabla o flujo confiable.

## Pruebas realizadas y métricas

MAE y WAPE sirven para comparar predicciones de unidades vendidas contra ventas reales. No miden si una orden sugerida fue buena: dos pedidos pueden tener el mismo error de demanda y consecuencias de inventario distintas.

No se entrenó un modelo de reposición ni se calcularon MAE/WAPE para cantidades a pedir. No hay historial de decisiones de compra, recepción, quiebre o sobrantes para construir una etiqueta objetivo y evaluarla sin inventar resultados.

### Búsqueda del enfoque adecuado

Se consideraron tres enfoques:

| Enfoque | Qué necesita | Decisión |
| --- | --- | --- |
| Regla de mínimo/máximo o punto de pedido | Stock actual/mínimo, demanda durante el plazo y posición del inventario | Candidato inicial; transparente y ejecutable con los datos operativos correctos |
| Política de revisión periódica `(R, S)` / order-up-to | Periodo de revisión, plazo, demanda durante ambos periodos, inventario disponible y órdenes entrantes | Candidato si las compras se revisan en ciclos y se registra inventario en camino |
| Regresión o boosting para cantidad a pedir | Historial de pedidos y resultados (quiebre, sobrante, servicio, costos) | No seleccionable: no hay etiqueta de cantidad óptima ni resultados para entrenar |

La literatura de control periódico formula el nivel objetivo según un nivel de servicio o un costo, y no según MAE/WAPE del pedido. La regla seleccionada debe ser fácil de auditar hasta que se guarden resultados de compra y disponibilidad.

## Método seleccionado

Para la primera versión se recomienda una **regla de reposición explicable**, usando el pronóstico seleccionado en el objetivo 1 como demanda esperada durante el plazo del proveedor. Una fórmula inicial para revisar con el negocio sería:

```text
demanda_hasta_reposicion = demanda_diaria_estimada × plazo_entrega_dias
stock_objetivo = stock_minimo + demanda_hasta_reposicion
cantidad_sugerida = max(0, stock_objetivo - stock_actual - unidades_pendientes_de_llegada)
```

La fórmula no se debe activar hasta verificar qué significa `stock_minimo` en TresStock, cómo se expresa el plazo del proveedor y si las órdenes pendientes se pueden consultar. También se pueden limitar pedidos por empaque mínimo o múltiplo de compra cuando ese dato exista.

### Parámetros candidatos por ajustar

No hay un “mejor” valor estadístico para el stock de seguridad sin fijar el nivel de servicio esperado o el costo relativo de quiebre y sobrante. La búsqueda futura debe comparar, por ejemplo, niveles de servicio 90 %, 95 % y 98 %, usando una simulación cronológica con pedidos y recepciones. El periodo de revisión y el plazo real del proveedor deben venir del negocio/BD; no se deben sustituir por un plazo genérico.

La búsqueda de parámetros queda **pendiente por falta de inventario histórico, órdenes y costos**, no porque se haya omitido el ajuste. El SQL actual tiene inventario vigente y plazos ligados a proveedores, pero no una tabla histórica de snapshots ni de órdenes pendientes; los campos requeridos aparecen vacíos en este CSV.

## Por qué no un modelo de machine learning todavía

El modelo tendría que aprender qué cantidad pedir a partir de resultados observados (por ejemplo, costo de compra, ventas no atendidas, días agotado y sobrantes). El dataset disponible solo tiene ventas; no tiene un histórico fiable de esas decisiones y resultados. Entrenar un regresor ahora produciría una cifra sin una etiqueta de negocio adecuada.

## Cómo evaluar más adelante

Cuando se guarden snapshots de inventario, órdenes y recepciones por fecha, se puede hacer una simulación cronológica de políticas de pedido y comparar:

- porcentaje de demanda atendida y días con quiebre;
- unidades sobrantes y cobertura excedida;
- costo estimado de inventario y de pedidos, si están disponibles;
- MAE/WAPE de la demanda prevista, como métrica auxiliar del pronóstico, no de la cantidad ordenada.

La evaluación debe comparar la regla nueva con la política actual de stock mínimo y usar fechas futuras no vistas durante el diseño.

## Decisión actual

**Usar una regla de negocio explicable, no un modelo de ML**, una vez integrados stock, stock mínimo, plazos y órdenes pendientes. En el estado actual solo está lista la parte histórica de ventas; no se genera todavía una cantidad de compra válida.

## Referencia metodológica

- [Determining order-up-to levels under periodic review for compound binomial (intermittent) demand](https://www.sciencedirect.com/science/article/abs/pii/S0377221709006043): política `(T, S)` y cálculo del nivel de reposición según servicio/costo para demanda intermitente.

## Archivos

- Dataset inicial: `dataset_reposicion.csv`.
- Estadísticas descriptivas: `dataset_reposicion_reporte.md`.
- Preparación del dataset: `../preparar_modelo_inicial.py`.
