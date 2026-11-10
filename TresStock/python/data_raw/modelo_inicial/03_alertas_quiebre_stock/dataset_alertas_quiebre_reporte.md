# Reporte descriptivo: quiebre

- **Archivo:** `dataset_alertas_quiebre.csv`
- **Filas:** 4.125
- **Variables:** 12
- **Nota:** media, mediana, desviación estándar y cuartiles solo aplican a variables numéricas.

## Variables

Cada bloque muestra una variable por separado para facilitar su lectura.

### codigo

- **Tipo:** categórica
- **Filas con dato:** 4.125 · **Vacías:** 0 · **Valores distintos:** 4.125
- **Moda y frecuencia:** 9999998742683 (1); 0 (1); 001010012 (1)

### descripcion

- **Tipo:** categórica
- **Filas con dato:** 4.125 · **Vacías:** 0 · **Valores distintos:** 3.726
- **Moda y frecuencia:** BOLSA DE REGALO MUJER (4); $ 200 (4); HUEVO CHUBI 30 GR (4)

### fecha_corte

- **Tipo:** fecha
- **Filas con dato:** 4.125 · **Vacías:** 0 · **Valores distintos:** 1
- **Moda y frecuencia:** 2026-09-30 00:00:00 (4.125)
- **Rango:** desde `2026-09-30` hasta `2026-09-30`.

### ultima_fecha_con_venta

- **Tipo:** fecha
- **Filas con dato:** 4.125 · **Vacías:** 0 · **Valores distintos:** 459
- **Moda y frecuencia:** 2026-09-30 00:00:00 (406); 2026-09-29 00:00:00 (163); 2026-09-28 00:00:00 (118)
- **Rango:** desde `2025-04-01` hasta `2026-09-30`.

### dias_desde_ultima_venta

- **Tipo:** numérica
- **Filas con dato:** 4.125 · **Vacías:** 0 · **Valores distintos:** 459
- **Moda y frecuencia:** 0,0000 (406); 1,0000 (163); 2,0000 (118)
- **Mínimo:** `0` · **Q1:** `12,0000` · **Media:** `164,8228` · **Mediana:** `104,0000` · **Q3:** `296,0000` · **Máximo:** `547` · **Desviación estándar:** `167,1301`.

### promedio_diario_7_dias

- **Tipo:** numérica
- **Filas con dato:** 4.125 · **Vacías:** 0 · **Valores distintos:** 64
- **Moda y frecuencia:** 0,0000 (3.293); 0,1429 (294); 0,2857 (131)
- **Mínimo:** `0,0000` · **Q1:** `0,0000` · **Media:** `0,1521` · **Mediana:** `0,0000` · **Q3:** `0,0000` · **Máximo:** `41,0000` · **Desviación estándar:** `1,0574`.

### promedio_diario_28_dias

- **Tipo:** numérica
- **Filas con dato:** 4.125 · **Vacías:** 0 · **Valores distintos:** 114
- **Moda y frecuencia:** 0,0000 (2.753); 0,0357 (359); 0,0714 (159)
- **Mínimo:** `0,0000` · **Q1:** `0,0000` · **Media:** `0,1474` · **Mediana:** `0,0000` · **Q3:** `0,0357` · **Máximo:** `36,6786` · **Desviación estándar:** `0,8650`.

### unidades_28_dias

- **Tipo:** numérica
- **Filas con dato:** 4.125 · **Vacías:** 0 · **Valores distintos:** 114
- **Moda y frecuencia:** 0,0000 (2.753); 1,0000 (359); 2,0000 (159)
- **Mínimo:** `0,0000` · **Q1:** `0,0000` · **Media:** `4,1273` · **Mediana:** `0,0000` · **Q3:** `1,0000` · **Máximo:** `1.027,0000` · **Desviación estándar:** `24,2207`.

### stock_actual_pendiente_bd

- **Tipo:** numérica
- **Filas con dato:** 0 · **Vacías:** 4.125 · **Valores distintos:** 0
- **Moda y frecuencia:** —
- No hay datos para calcular estadísticas; el campo espera información externa de PostgreSQL.

### stock_minimo_pendiente_bd

- **Tipo:** numérica
- **Filas con dato:** 0 · **Vacías:** 4.125 · **Valores distintos:** 0
- **Moda y frecuencia:** —
- No hay datos para calcular estadísticas; el campo espera información externa de PostgreSQL.

### plazo_entrega_pendiente_bd

- **Tipo:** numérica
- **Filas con dato:** 0 · **Vacías:** 4.125 · **Valores distintos:** 0
- **Moda y frecuencia:** —
- No hay datos para calcular estadísticas; el campo espera información externa de PostgreSQL.

### cobertura_stock_dias_pendiente_bd

- **Tipo:** numérica
- **Filas con dato:** 0 · **Vacías:** 4.125 · **Valores distintos:** 0
- **Moda y frecuencia:** —
- No hay datos para calcular estadísticas; el campo espera información externa de PostgreSQL.


## Lectura rápida

- Revisa primero las columnas con valores vacíos; algunos campos de inventario y proveedores quedan pendientes de completar desde PostgreSQL.
- Compara mínimo, cuartiles, mediana y máximo para detectar escalas o valores que requieran revisión.
- En variables categóricas, la moda y los valores distintos ayudan a encontrar códigos o etiquetas inesperadas.
