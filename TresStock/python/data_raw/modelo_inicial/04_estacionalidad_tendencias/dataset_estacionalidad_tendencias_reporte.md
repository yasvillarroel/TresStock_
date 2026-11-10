# Reporte descriptivo: tendencias

- **Archivo:** `dataset_estacionalidad_tendencias.csv`
- **Filas:** 1.551.070
- **Variables:** 9
- **Nota:** media, mediana, desviación estándar y cuartiles solo aplican a variables numéricas.

## Variables

Cada bloque muestra una variable por separado para facilitar su lectura.

### codigo

- **Tipo:** categórica
- **Filas con dato:** 1.551.070 · **Vacías:** 0 · **Valores distintos:** 4.125
- **Moda y frecuencia:** 9153 (548); 7801220311111 (548); 7801300012068 (548)

### descripcion

- **Tipo:** categórica
- **Filas con dato:** 1.551.070 · **Vacías:** 0 · **Valores distintos:** 3.726
- **Moda y frecuencia:** BOLSA DE REGALO MUJER (1.904); HUEVO CHUBI 30 GR (1.636); $ 200 (1.589)

### fecha

- **Tipo:** fecha
- **Filas con dato:** 1.551.070 · **Vacías:** 0 · **Valores distintos:** 548
- **Moda y frecuencia:** 2026-09-30 00:00:00 (4.125); 2026-09-29 00:00:00 (4.119); 2026-09-28 00:00:00 (4.111)
- **Rango:** desde `2025-04-01` hasta `2026-09-30`.

### dia_semana

- **Tipo:** numérica
- **Filas con dato:** 1.551.070 · **Vacías:** 0 · **Valores distintos:** 7
- **Moda y frecuencia:** 2,0000 (223.470); 1,0000 (222.744); 0,0000 (221.771)
- **Mínimo:** `0` · **Q1:** `1,0000` · **Media:** `2,9949` · **Mediana:** `3,0000` · **Q3:** `5,0000` · **Máximo:** `6` · **Desviación estándar:** `2,0002`.

### mes

- **Tipo:** numérica
- **Filas con dato:** 1.551.070 · **Vacías:** 0 · **Valores distintos:** 12
- **Moda y frecuencia:** 9,0000 (192.570); 8,0000 (189.443); 7,0000 (179.195)
- **Mínimo:** `1` · **Q1:** `4,0000` · **Media:** `6,5338` · **Mediana:** `7,0000` · **Q3:** `9,0000` · **Máximo:** `12` · **Desviación estándar:** `3,0200`.

### anio

- **Tipo:** numérica
- **Filas con dato:** 1.551.070 · **Vacías:** 0 · **Valores distintos:** 2
- **Moda y frecuencia:** 2.026,0000 (971.794); 2.025,0000 (579.276)
- **Mínimo:** `2025` · **Q1:** `2.025,0000` · **Media:** `2.025,6265` · **Mediana:** `2.026,0000` · **Q3:** `2.026,0000` · **Máximo:** `2026` · **Desviación estándar:** `0,4837`.

### unidades_vendidas

- **Tipo:** numérica
- **Filas con dato:** 1.551.070 · **Vacías:** 0 · **Valores distintos:** 1.169
- **Moda y frecuencia:** 0,0000 (1.417.924); 1,0000 (72.917); 2,0000 (26.632)
- **Mínimo:** `0,0000` · **Q1:** `0,0000` · **Media:** `0,1957` · **Mediana:** `0,0000` · **Q3:** `0,0000` · **Máximo:** `252,0000` · **Desviación estándar:** `1,4624`.

### correcciones_negativas

- **Tipo:** numérica
- **Filas con dato:** 1.551.070 · **Vacías:** 0 · **Valores distintos:** 24
- **Moda y frecuencia:** 0,0000 (1.550.386); 1,0000 (564); 2,0000 (64)
- **Mínimo:** `0,0000` · **Q1:** `0,0000` · **Media:** `0,0006` · **Mediana:** `0,0000` · **Q3:** `0,0000` · **Máximo:** `21,0000` · **Desviación estándar:** `0,0432`.

### es_dia_atipico

- **Tipo:** categórica
- **Filas con dato:** 1.551.070 · **Vacías:** 0 · **Valores distintos:** 2
- **Moda y frecuencia:** false (1.543.227); true (7.843)


## Lectura rápida

- Revisa primero las columnas con valores vacíos; algunos campos de inventario y proveedores quedan pendientes de completar desde PostgreSQL.
- Compara mínimo, cuartiles, mediana y máximo para detectar escalas o valores que requieran revisión.
- En variables categóricas, la moda y los valores distintos ayudan a encontrar códigos o etiquetas inesperadas.
