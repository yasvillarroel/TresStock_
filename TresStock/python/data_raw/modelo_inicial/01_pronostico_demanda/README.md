# Objetivo: pronóstico de demanda

## Propósito

Estimar las unidades que se venderán por producto durante los próximos 7, 14 o 30 días. Se preparó un objetivo independiente por horizonte. El trabajo actual es una comparación inicial de métodos; todavía no se integra un pronóstico a la aplicación ni se automatizan decisiones de compra.

## Datos usados

- El origen es `python/data_raw/info_inicial.csv`.
- Se generó el dataset por producto y fecha en `dataset_pronostico_demanda.csv`.
- Los predictores disponibles son código de producto, día de semana, mes, unidades del día de corte, unidades del mismo día de semana anterior y promedios de venta de 7 y 28 días.
- Las variables objetivo son `objetivo_7_dias`, `objetivo_14_dias` y `objetivo_30_dias`.
- El periodo de prueba contiene 323.383 filas, desde el 25 de mayo hasta el 31 de agosto de 2026. Se dejó una separación de 30 días entre el entrenamiento y la prueba, para evitar que objetivos futuros del entrenamiento se extiendan dentro del periodo evaluado.
- Entre 76,5 % y 87,4 % de los valores objetivo de prueba son cero. La demanda por producto es muy intermitente.

## Pruebas realizadas

### 1. Referencias sencillas

Antes de comparar algoritmos, se midieron dos métodos simples:

- **Promedio de 28 días:** promedio diario de unidades de los últimos 28 días multiplicado por los días del horizonte.
- **Promedio por día de semana:** para cada día futuro, usa el promedio de las últimas cuatro observaciones del mismo día de semana y suma el horizonte.

Estas referencias son importantes porque un modelo más complejo solo conviene si mejora de forma consistente una solución sencilla.

### 2. Regresión lineal

Se entrenó una regresión lineal por horizonte. Producto, día de semana y mes se codificaron como variables categóricas; las demás entradas fueron las ventas recientes. El modelo se comparó con el promedio de 28 días.

| Horizonte | MAE regresión | WAPE regresión | MAE promedio 28 días | WAPE promedio 28 días |
| --- | ---: | ---: | ---: | ---: |
| 7 días | 0,406 | 63,913 % | **0,341** | **53,646 %** |
| 14 días | 0,701 | 55,194 % | **0,572** | **44,972 %** |
| 30 días | 1,340 | 49,264 % | **1,104** | **40,580 %** |

La regresión no mejoró MAE ni WAPE frente al promedio de 28 días en ningún horizonte. Aunque tuvo RMSE algo menor en la prueba, sus errores absolutos típicos y relativos fueron peores.

### 3. Métodos para demanda intermitente: Croston-SBA y TSB

Se evaluaron Croston-SBA y TSB. Ambos se actualizaron por día usando solo datos disponibles hasta cada fecha de corte. Los días identificados como atípicos no actualizaron esos estados. En esta primera comparación se usaron α=0,1 para SBA y α=β=0,1 para TSB.

| Horizonte | Método | MAE | WAPE |
| --- | --- | ---: | ---: |
| 7 días | Croston-SBA | 3,367 | 530,160 % |
| 7 días | TSB | 0,343 | 53,943 % |
| 14 días | Croston-SBA | 6,601 | 519,408 % |
| 14 días | TSB | 0,584 | 45,935 % |
| 30 días | Croston-SBA | 13,947 | 512,595 % |
| 30 días | TSB | 1,151 | 42,307 % |

TSB quedó cerca del promedio de 28 días, pero fue ligeramente peor en MAE y WAPE para los tres horizontes. SBA sobreestimó fuertemente la demanda en esta prueba.

### 4. LightGBM hurdle

Se probó un enfoque en dos etapas: un clasificador estima si habrá demanda positiva y un regresor estima cuántas unidades se venderían dado que sí hay demanda. El producto, mes y día de semana se entregaron como variables categóricas. La prueba temporal fue la misma que para la regresión.

| Horizonte | MAE LightGBM | WAPE LightGBM | MAE promedio 28 días | WAPE promedio 28 días |
| --- | ---: | ---: | ---: | ---: |
| 7 días | 0,416 | 65,580 % | **0,341** | **53,646 %** |
| 14 días | 0,720 | 56,655 % | **0,572** | **44,972 %** |
| 30 días | 1,353 | 49,734 % | **1,104** | **40,580 %** |

LightGBM tampoco superó la referencia en MAE o WAPE.

### 5. Búsqueda de parámetros

Se hizo una búsqueda interna sin usar el periodo de prueba para escoger parámetros:

- **Ventanas de validación:** periodos de 30 días desde el 1 de noviembre de 2025, el 1 de enero de 2026 y el 1 de marzo de 2026.
- **Selección:** menor WAPE promedio entre ventanas; MAE como desempate.
- **TSB:** se probaron α y β entre 0,05 y 0,30.
- **Croston-SBA:** se probaron valores de α entre 0,05 y 0,50.
- **LightGBM hurdle:** se probaron tres configuraciones de árboles, tasa de aprendizaje, hojas, tamaño mínimo de hoja y regularización.

Los parámetros elegidos fueron:

| Horizonte | TSB | SBA | LightGBM |
| --- | --- | --- | --- |
| 7 días | α=0,10; β=0,10 | α=0,50 | Configuración 2 |
| 14 días | α=0,05; β=0,10 | α=0,50 | Configuración 2 |
| 30 días | α=0,05; β=0,10 | α=0,50 | Configuración 2 |

Después de elegir parámetros, los modelos se midieron en la ventana de prueba ya establecida:

| Horizonte | TSB MAE / WAPE | SBA MAE / WAPE | LightGBM MAE / WAPE | Promedio 28 días MAE / WAPE |
| --- | ---: | ---: | ---: | ---: |
| 7 días | 0,343 / 53,943 % | 2,528 / 398,083 % | 0,416 / 65,580 % | **0,341 / 53,646 %** |
| 14 días | 0,582 / 45,804 % | 4,951 / 389,595 % | 0,720 / 56,655 % | **0,572 / 44,972 %** |
| 30 días | 1,150 / 42,253 % | 10,443 / 383,818 % | 1,353 / 49,734 % | **1,104 / 40,580 %** |

El promedio de 28 días siguió obteniendo el menor MAE y WAPE en todos los horizontes, incluso después del ajuste. La búsqueda no cambió la decisión.

## Método seleccionado

Para la estimación general de **7, 14 y 30 días se selecciona el promedio diario de los últimos 28 días multiplicado por el horizonte**. Motivos:

1. Tuvo el menor MAE y WAPE en los tres horizontes.
2. Es más sencillo de explicar y mantener que los modelos entrenados.
3. Los dos modelos de machine learning probados no aportaron una mejora consistente.
4. SBA y TSB, aun con parámetros ajustados, tampoco superaron la referencia.

En 30 días, el promedio por día de semana obtuvo WAPE de 40,559 %, apenas 0,021 puntos porcentuales menor que el promedio de 28 días (40,580 %). Su MAE fue igual (1,104) y su RMSE fue ligeramente menor (4,997 frente a 5,022). La diferencia es pequeña, por lo que se mantiene el promedio de 28 días como opción única y consistente para los tres horizontes. El promedio por día de semana queda como candidato para futuras validaciones.

## Límites y cautelas

- La ventana de prueba se consultó durante los experimentos iniciales antes de ajustar parámetros. La búsqueda posterior eligió parámetros solo con las ventanas internas, pero este conjunto ya no debe considerarse una prueba final completamente intacta.
- Debe realizarse una evaluación futura nueva cuando haya suficientes importaciones posteriores al 31 de agosto de 2026.
- Un gran porcentaje de los objetivos es cero; por eso conviene medir también el desempeño sobre productos con demanda positiva y por grupos de rotación, antes de tomar decisiones de inventario.
- Los promedios son una referencia de demanda histórica; no constituyen por sí solos una cantidad de compra. Reposición debe considerar stock vigente, plazo del proveedor y órdenes pendientes.
- El promedio no informa incertidumbre. Una futura presentación debería dar contexto de periodo y evitar tratar la estimación como certeza.

## Archivos relacionados

- Dataset y variables: `dataset_pronostico_demanda.csv`.
- Estadísticas descriptivas de variables: `dataset_pronostico_demanda_reporte.md`.
- Comparación original: `comparacion_modelos.md`.
- Evaluación de regresión lineal: `evaluacion_pronostico.md`.
- Evaluación LightGBM hurdle: `evaluacion_lightgbm_hurdle.md`.
- Búsqueda de parámetros: `ajuste_parametros.md`.
- Script de entrenamiento lineal: `entrenar_pronostico.py`.
- Script de comparación SBA/TSB: `comparar_modelos_intermitentes.py`.
- Script LightGBM: `entrenar_hurdle_lightgbm.py`.
- Script de ajuste: `ajustar_parametros_pronostico.py`.

Los modelos de las pruebas se entrenan en memoria y no se guardan como binarios. Ningún modelo de machine learning fue seleccionado para uso operativo.
