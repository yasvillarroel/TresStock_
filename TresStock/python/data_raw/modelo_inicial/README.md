# Modelo inicial de TresStock

## Propósito

Este documento describe el CSV histórico de origen y los cuatro objetivos analíticos acordados para la primera versión. Es documentación del diseño: todavía no significa que los modelos estén entrenados ni que las recomendaciones se generen automáticamente.

## Dataset de origen

- **Archivo:** `python/data_raw/info_inicial.csv`
- **Tamaño observado:** aproximadamente 107 MB.
- **Filas:** 296.546.
- **Columnas por fila:** 32.
- **Periodo de ventas:** 1 de abril de 2025 a 30 de septiembre de 2026.
- **Códigos distintos observados:** 4.130.
- **Cantidades negativas:** 771 filas; se deben conservar como correcciones o devoluciones hasta definir su tratamiento analítico.
- **Código vacío:** 11 filas; deben revisarse durante la limpieza.
- **Codificación observada:** compatible con Windows-1252; confirmar durante la lectura formal para preservar tildes y caracteres.

El archivo es una exportación del sistema de ventas, no un dataset analítico listo para entrenar. Las filas repiten información de encabezado y boleta junto con la línea de producto. También incluyen datos auxiliares como forma de pago, cliente, stock impreso, etiquetas `TOTAL`/`TOTALES` y acumulados de la boleta. Estos campos deben identificarse antes de normalizar las ventas.

### Campos de venta candidatos

En las filas observadas, la línea de venta aparece al final del registro y contiene estos campos candidatos:

| Campo candidato | Ejemplo observado | Uso previsto |
| --- | --- | --- |
| Fecha de venta | `01/04/2025` | Calendario, agregación diaria y estacionalidad |
| Código | `9149` | Identificación del producto |
| Descripción | `+ 100` | Nombre descriptivo para revisión; no usar como identidad si existe código |
| Precio | `100,00` | Control de calidad y análisis comercial; no es necesario para predecir unidades |
| Precio con descuento | `100,00` | Campo por validar; determinar si difiere del precio normal |
| Cantidad | `1,00` o `-1,00` | Unidades vendidas o corrección/devolución |
| Stock impreso | `-27.876,40` | No tratar como historial confiable de inventario sin validar su significado |
| Total de línea | `100` | Validación de importes; no confundir con totales repetidos de boleta |

Los números usan formato local con coma decimal y, en algunos campos, punto de miles. La limpieza deberá convertir fechas y valores a tipos consistentes, retirar filas de encabezado y totales, validar los códigos y cantidades, y dejar intacto el CSV original.

## Objetivos analíticos

### 1. Pronóstico de demanda

- **Pregunta:** ¿Cuántas unidades se venderán de cada producto en los próximos 7, 14 o 30 días?
- **Variables de entrada candidatas:** código de producto, fecha, día de semana, mes, ventas recientes, venta del mismo día de semana anterior y promedios móviles de 7 y 28 días.
- **Variable objetivo:** total de unidades vendidas por producto durante el horizonte futuro elegido (7, 14 o 30 días). Se prepara un objetivo por horizonte.
- **Fuente necesaria:** CSV limpio agregado por producto y día; cada nueva importación de ventas debe aportar únicamente sus nuevas salidas.
- **Nota:** el CSV trae cantidades negativas. Debe acordarse si las devoluciones restan demanda, se modelan aparte o se excluyen de ciertas métricas.

### 2. Reposición recomendada

- **Pregunta:** ¿Qué productos reponer y qué cantidad sugerir?
- **Datos necesarios:** demanda histórica/pronosticada, stock actual, stock mínimo y plazos de entrega de proveedores. Las órdenes de compra pendientes mejorarían la cantidad sugerida si se pueden consultar o registrar.
- **Resultado esperado:** producto, urgencia y cantidad recomendada, con explicación basada en consumo durante el plazo de reposición.
- **Fuente:** ventas limpias más snapshot operativo de inventario y proveedores desde PostgreSQL.

### 3. Alertas de quiebre de stock

- **Pregunta:** ¿Qué productos podrían agotarse antes de recibir la próxima reposición?
- **Datos necesarios:** stock actual, demanda reciente o pronosticada y plazo de entrega del proveedor.
- **Resultado esperado:** nivel de riesgo, cobertura estimada y productos que requieren atención.
- **Fuente:** ventas limpias más inventario y plazos actuales de PostgreSQL. El stock impreso dentro del CSV no reemplaza el inventario vigente.

### 4. Estacionalidad y tendencias

- **Pregunta:** ¿Qué productos suben o bajan sus ventas según el día de semana, el mes o el periodo?
- **Variables:** fecha, código de producto y unidades vendidas agregadas por día; de ahí se derivan día de semana, mes y periodos de comparación.
- **Resultado esperado:** patrones y cambios de demanda por producto o grupo de productos.
- **Fuente:** historial diario limpio y acumulado. El periodo disponible es de unos 18 meses, suficiente para observar patrones iniciales, pero limitado para concluir ciclos anuales repetidos.

## Flujo de datos previsto

1. Conservar `info_inicial.csv` como fuente original inmutable.
2. Perfilar y limpiar el archivo, documentando filas rechazadas y transformaciones.
3. Crear un detalle normalizado de ventas y un agregado diario por producto.
4. Generar desde los datos limpios las variables y objetivos necesarios para cada análisis.
5. Cuando se importe un CSV diario en TresStock, anexar al historial analítico solo las nuevas salidas efectivamente registradas, con la fecha de venta correspondiente.
6. Consultar PostgreSQL para los datos operativos actuales necesarios para reposición, quiebre y análisis de movimientos.

El flujo debe ser idempotente: volver a procesar un lote ya importado no debe duplicar sus ventas. La preparación del dataset no modifica el CSV original ni la base de datos.

## Búsqueda de método por objetivo

Se revisó si cada objetivo requiere un modelo supervisado, una regla de inventario o estadística descriptiva. No se fuerza ML donde faltan etiquetas o donde el objetivo es describir patrones.

| Objetivo | Métodos evaluados/considerados | Selección actual | Estado de parámetros |
| --- | --- | --- | --- |
| Pronóstico de demanda | Promedio de 28 días, patrón semanal, regresión lineal, Croston-SBA, TSB y LightGBM hurdle | Promedio de 28 días: mejor MAE/WAPE general en la prueba; patrón semanal queda candidato a 30 días por mejora WAPE mínima | Ajustados por validación temporal; ninguno ML superó la referencia |
| Reposición | Regla mínimo/máximo, política order-up-to `(R,S)`, regresión/boosting de cantidad | Regla explicable usando demanda durante el plazo, una vez integrados datos operativos | No se pueden optimizar servicio/seguridad sin stock histórico, órdenes y costo de quiebre/sobrante |
| Alertas de quiebre | Regla de cobertura/plazo, regresión logística, boosting clasificador | Regla determinística hasta tener historial etiquetado de quiebres | No se pueden ajustar umbral o clasificador sin snapshots y fechas de agotamiento/recepción |
| Estacionalidad y tendencias | Agregados por calendario; STL robusta semanal; regresión/boosting | Agregados descriptivos; posible STL semanal cuando se confirme el calendario de apertura | No hay MAE/WAPE para un objetivo descriptivo; periodo semanal 7 es conocido, el suavizado queda por validar |

### Hallazgos que condicionan la selección

- La demanda del CSV es intermitente: entre 76,5 % y 87,4 % de los objetivos de prueba fueron cero. Las referencias simples superaron los modelos de ML probados.
- En la base actual hay inventario vigente, movimientos y relaciones con proveedores, pero no una tabla histórica de órdenes de compra ni snapshots de stock por fecha. Sin snapshots no se puede reconstruir qué stock se conocía antes de un quiebre.
- En las ventas agregadas por fecha se observan 0 unidades los domingos y un nivel claramente menor los sábados. Hay que validar si corresponde al horario del negocio o a cargas faltantes antes de usarlo como patrón.
- MAE/WAPE evalúan demanda pronosticada. Para reposición se deben medir servicio, quiebres, sobrantes y costos; para alertas, precisión, recall y anticipación; para tendencias descriptivas, cobertura y consistencia del calendario.

## Documentación por objetivo

- [Pronóstico de demanda](01_pronostico_demanda/README.md)
- [Reposición recomendada](02_reposicion_recomendada/README.md)
- [Alertas de quiebre de stock](03_alertas_quiebre_stock/README.md)
- [Estacionalidad y tendencias](04_estacionalidad_tendencias/README.md)

## Alcance y próximos datos

Las pruebas de pronóstico se ejecutaron y los binarios entrenados se eliminaron; sus scripts y métricas se conservaron. Los demás objetivos ya tienen una selección metodológica, pero no deben presentarse como modelos validados con los CSV iniciales. Para completar sus búsquedas hacen falta snapshots fechados de stock, órdenes/recepciones, etiquetas de quiebre y calendario de días abiertos. El CSV original se conserva sin modificar.

