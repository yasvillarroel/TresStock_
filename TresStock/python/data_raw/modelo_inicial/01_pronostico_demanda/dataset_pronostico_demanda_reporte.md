# Reporte descriptivo: pronostico

- **Archivo:** `dataset_pronostico_demanda.csv`
- **Filas:** 1.124.935
- **Variables:** 12
- **Nota:** media, mediana, desviación estándar y cuartiles solo aplican a variables numéricas.

## Variables

Cada bloque muestra una variable por separado para facilitar su lectura.

### codigo

- **Tipo:** categórica
- **Filas con dato:** 1.124.935 · **Vacías:** 0 · **Valores distintos:** 3.848
- **Moda y frecuencia:** 7809611721631 (491); 7802225572996 (491); 7802000017858 (491)

### descripcion

- **Tipo:** categórica
- **Filas con dato:** 1.124.935 · **Vacías:** 0 · **Valores distintos:** 3.486
- **Moda y frecuencia:** BOLSA DE REGALO MUJER (1.676); NESCAFE MOKA 18 GR (1.409); JUEGO DE MESA BASTA (1.397)

### fecha_corte

- **Tipo:** fecha
- **Filas con dato:** 1.124.935 · **Vacías:** 0 · **Valores distintos:** 491
- **Moda y frecuencia:** 2026-08-31 00:00:00 (3.447); 2026-08-28 00:00:00 (3.439); 2026-08-30 00:00:00 (3.439)
- **Rango:** desde `2025-04-28` hasta `2026-08-31`.

### dia_semana

- **Tipo:** numérica
- **Filas con dato:** 1.124.935 · **Vacías:** 0 · **Valores distintos:** 7
- **Moda y frecuencia:** 0,0000 (161.981); 4,0000 (161.265); 6,0000 (161.192)
- **Mínimo:** `0` · **Q1:** `1,0000` · **Media:** `3,0026` · **Mediana:** `3,0000` · **Q3:** `5,0000` · **Máximo:** `6` · **Desviación estándar:** `2,0024`.

### mes

- **Tipo:** numérica
- **Filas con dato:** 1.124.935 · **Vacías:** 0 · **Valores distintos:** 12
- **Moda y frecuencia:** 8,0000 (154.402); 7,0000 (144.492); 6,0000 (129.764)
- **Mínimo:** `1` · **Q1:** `4,0000` · **Media:** `6,3260` · **Mediana:** `6,0000` · **Q3:** `8,0000` · **Máximo:** `12` · **Desviación estándar:** `3,0815`.

### unidades_dia_corte

- **Tipo:** numérica
- **Filas con dato:** 1.124.935 · **Vacías:** 0 · **Valores distintos:** 917
- **Moda y frecuencia:** 0,0000 (1.069.166); 1,0000 (31.509); 2,0000 (10.752)
- **Mínimo:** `0,0000` · **Q1:** `0,0000` · **Media:** `0,1191` · **Mediana:** `0,0000` · **Q3:** `0,0000` · **Máximo:** `109,0000` · **Desviación estándar:** `1,2589`.

### unidades_mismo_dia_semana_anterior

- **Tipo:** numérica
- **Filas con dato:** 1.124.935 · **Vacías:** 0 · **Valores distintos:** 923
- **Moda y frecuencia:** 0,0000 (1.068.425); 1,0000 (32.040); 2,0000 (10.904)
- **Mínimo:** `0,0000` · **Q1:** `0,0000` · **Media:** `0,1203` · **Mediana:** `0,0000` · **Q3:** `0,0000` · **Máximo:** `110,0000` · **Desviación estándar:** `1,2728`.

### promedio_7_dias

- **Tipo:** numérica
- **Filas con dato:** 1.124.935 · **Vacías:** 0 · **Valores distintos:** 2.129
- **Moda y frecuencia:** 0,0000 (932.069); 0,1429 (78.736); 0,2857 (35.142)
- **Mínimo:** `0,0000` · **Q1:** `0,0000` · **Media:** `0,1195` · **Mediana:** `0,0000` · **Q3:** `0,0000` · **Máximo:** `70,7143` · **Desviación estándar:** `1,0650`.

### promedio_28_dias

- **Tipo:** numérica
- **Filas con dato:** 1.124.935 · **Vacías:** 0 · **Valores distintos:** 4.120
- **Moda y frecuencia:** 0,0000 (764.256); 0,0357 (104.514); 0,0714 (60.079)
- **Mínimo:** `0,0000` · **Q1:** `0,0000` · **Media:** `0,1220` · **Mediana:** `0,0000` · **Q3:** `0,0357` · **Máximo:** `59,5714` · **Desviación estándar:** `1,0591`.

### objetivo_7_dias

- **Tipo:** numérica
- **Filas con dato:** 1.124.935 · **Vacías:** 0 · **Valores distintos:** 2.118
- **Moda y frecuencia:** 0,0000 (935.017); 1,0000 (77.133); 2,0000 (34.455)
- **Mínimo:** `0,0000` · **Q1:** `0,0000` · **Media:** `0,8306` · **Mediana:** `0,0000` · **Q3:** `0,0000` · **Máximo:** `495,0000` · **Desviación estándar:** `7,3744`.

### objetivo_14_dias

- **Tipo:** numérica
- **Filas con dato:** 1.124.935 · **Vacías:** 0 · **Valores distintos:** 3.037
- **Moda y frecuencia:** 0,0000 (866.503); 1,0000 (90.185); 2,0000 (44.535)
- **Mínimo:** `0,0000` · **Q1:** `0,0000` · **Media:** `1,6584` · **Mediana:** `0,0000` · **Q3:** `0,0000` · **Máximo:** `871,0000` · **Desviación estándar:** `14,5524`.

### objetivo_30_dias

- **Tipo:** numérica
- **Filas con dato:** 1.124.935 · **Vacías:** 0 · **Valores distintos:** 4.462
- **Moda y frecuencia:** 0,0000 (781.424); 1,0000 (96.891); 2,0000 (56.410)
- **Mínimo:** `0,0000` · **Q1:** `0,0000` · **Media:** `3,5454` · **Mediana:** `0,0000` · **Q3:** `1,0000` · **Máximo:** `1.721,0000` · **Desviación estándar:** `30,7384`.


## Lectura rápida

- Revisa primero las columnas con valores vacíos; algunos campos de inventario y proveedores quedan pendientes de completar desde PostgreSQL.
- Compara mínimo, cuartiles, mediana y máximo para detectar escalas o valores que requieran revisión.
- En variables categóricas, la moda y los valores distintos ayudan a encontrar códigos o etiquetas inesperadas.
