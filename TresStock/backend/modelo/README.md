# Modelo de pronóstico de demanda

## Estado

Este directorio contiene el modelo LightGBM de referencia y sus archivos para ejecutarlo en el backend. El uso normal del sistema no requiere Python: Node.js carga `modelo_demanda_lightgbm.json` y calcula el pronóstico directamente. Python y LightGBM solo se necesitan para volver a entrenar o actualizar el artefacto.

## Archivos

- `modelo_demanda_lightgbm.txt`: modelo LightGBM en formato nativo.
- `modelo_demanda_lightgbm.json`: estructura del modelo que evalúa Node.js, incluida para que cualquier instalación del proyecto pueda predecir sin instalar Python.
- `dataset_estacionalidad_tendencias.csv.gz`: dataset diario comprimido usado para recrear el entrenamiento (alrededor de 6 MB).
- `metricas_evaluacion.json`: métricas de la prueba temporal y resultados de búsqueda de parámetros.
- `metadatos_modelo.json`: variables, categorías, periodo, parámetros y métricas vinculadas al artefacto.
- `entrenar_modelo_demanda.py`: prepara las variables y reentrena el artefacto desde el dataset histórico.
- `predecir_pronostico.py`: recibe ventas diarias recientes por stdin y devuelve la proyección recursiva de 7, 14 y 30 días.
- `pronostico_lightgbm.js`: evalúa el artefacto JSON en Node.js y genera la proyección recursiva de 7, 14 y 30 días.
- `actualizar_dataset_modelo.py`: reemplaza el dataset comprimido cuando se genere una versión limpia más reciente.
- `requirements-modelo.txt`: versiones de las dependencias Python necesarias.

## Objetivo y variables

Predice las unidades vendidas de un producto en un día abierto. La salida es una cantidad numérica por producto y día. Se excluyen los domingos bajo el supuesto de cierre del local y los días-producto etiquetados como atípicos.

Variables de entrada:

- `codigo`: código del producto, tratado como categoría.
- `dia_semana` y `mes`: calendario.
- `indice_fecha`: días transcurridos desde el 1 de abril de 2025.
- Venta del mismo día de semana de hace 7 y 14 días.
- Promedios móviles de 7 y 28 días, y promedio de las cuatro observaciones semanales previas del mismo día.

Las variables de ventas recientes se construyen a partir del historial diario por producto. Para predecir una nueva fecha, el servicio que consuma el modelo deberá calcularlas con datos hasta el día anterior; no se deben incluir ventas futuras.

## Parámetros utilizados

| Parámetro | Valor |
| --- | ---: |
| Objetivo | `regression_l1` |
| Iteraciones (`n_estimators`) | 250 |
| Tasa de aprendizaje | 0,04 |
| Hojas (`num_leaves`) | 63 |
| Profundidad máxima | Sin límite (`-1`) |
| Mínimo de filas por hoja | 100 |
| Submuestra de filas | 0,85 |
| Submuestra de variables | 0,85 |
| Regularización L2 | 1,0 |
| Semilla | 42 |

La búsqueda de parámetros probó seis combinaciones de `num_leaves` y `min_child_samples` en la validación del 9 de julio al 5 de agosto de 2026. El mejor MAE de validación fue 0,1126 con 63 hojas y mínimo 100 filas por hoja. Después se reentrenó el artefacto final con el historial disponible. Los parámetros y las métricas exactas están también en `metadatos_modelo.json`.

## Métricas de prueba temporal

Se reservaron las fechas del 6 de agosto al 30 de septiembre de 2026, excluyendo domingos y días-producto atípicos. Estas cifras corresponden al modelo evaluado antes de reentrenarlo con todo el historial:

| Métrica | Resultado |
| --- | ---: |
| MAE | 0,1165 |
| RMSE | 0,6027 |
| WAPE | 75,65 % |
| Sesgo (predicción menos real) | -0,0836 |
| R² | 0,7299 |
| Precision de venta, umbral 0,5 | 78,56 % |
| Recall de venta, umbral 0,5 | 27,76 % |
| F1 de venta, umbral 0,5 | 41,03 % |
| Accuracy de venta, umbral 0,5 | 94,25 % |

La accuracy de venta no debe leerse sola: el clasificador trivial que siempre predice “sin venta” alcanza 92,80 %, ya que solo 7,20 % de los registros de prueba tuvieron venta. El recall bajo muestra que el umbral de 0,5 omite muchas fechas con venta. Esa evaluación binaria es auxiliar; el modelo principal es de regresión.

El conjunto mezcla productos por unidad y por kilogramo y no incluye la familia del producto. Por eso los errores agregados en unidades y kilos deben interpretarse con cautela. El WAPE alto también indica que el pronóstico todavía no es suficientemente preciso para decidir compras sin revisión.

## Regenerar el artefacto

El dataset comprimido, el script de entrenamiento, la configuración y las métricas están dentro de este directorio. Esta sección solo aplica cuando se quiere reentrenar el modelo; para ejecutar TresStock basta con instalar las dependencias habituales de Node indicadas en el `package.json` del proyecto.

```powershell
python -m venv .\backend\modelo\venv
.\backend\modelo\venv\Scripts\python.exe -m pip install -r .\backend\modelo\requirements-modelo.txt
.\backend\modelo\venv\Scripts\python.exe .\backend\modelo\entrenar_modelo_demanda.py
```

El entrenamiento genera tanto el archivo nativo `.txt` como el `.json` que usa Node. El entorno Python es solo una herramienta de desarrollo y no interviene al iniciar el backend.

El entrenamiento lee `dataset_estacionalidad_tendencias.csv.gz` de esta carpeta y reemplaza el modelo y sus metadatos. No altera una base de datos.

Para incorporar un historial limpio nuevo, se puede actualizar el dataset comprimido con un CSV diario generado por el proceso de limpieza y después reentrenar:

```powershell
python .\backend\modelo\actualizar_dataset_modelo.py "C:\ruta\dataset_estacionalidad_tendencias.csv"
python .\backend\modelo\entrenar_modelo_demanda.py
```

La actualización automática del artefacto después de nuevas importaciones requiere automatizar el reentrenamiento; actualmente el endpoint usa el modelo guardado y solo renueva las variables recientes de ventas.

## Integración actual en Análisis

La vista de Análisis ofrece el método **LightGBM · experimental**. Su endpoint es `GET /api/inventario/pronostico-modelo` y requiere una sesión de inventario. El backend consulta los últimos 35 días de ventas y evalúa el artefacto JSON dentro de Node.js; no busca ni ejecuta Python y no requiere `PYTHON_EXECUTABLE` ni `requirements-modelo.txt`.

El endpoint consulta los últimos 35 días del historial de ventas para preparar los rezagos. El predictor acumula los pronósticos diarios futuros y trata el domingo como día cerrado. Para códigos actuales que no estaban en el entrenamiento usa como alternativa el promedio de las ventas positivas de los últimos 28 días. Los resultados de productos unitarios se redondean hacia arriba; los productos de balanza mantienen hasta cuatro decimales. La reposición recomendada sigue mostrando el método actual.
