# Perfil de las ventas después de la limpieza

Se describen las 296.531 líneas válidas normalizadas antes de agregarlas por producto y día. Se excluyeron 15 líneas inválidas.

Cada variable se presenta por separado. `Válidos` indica los valores que pudieron interpretarse; `vacíos` e `inválidos` se cuentan antes de excluir filas.

## numero_boleta

- **Tipo:** categórica
- **Registros:** 296.531 · **Válidos:** 296.531 · **Vacíos:** 0 · **Inválidos:** 0 · **Valores distintos:** 107.343
- **Moda:** omitida para no exponer datos personales o identificadores de boleta.

## fecha_hora

- **Tipo:** fecha y hora
- **Registros:** 296.531 · **Válidos:** 296.531 · **Vacíos:** 0 · **Inválidos:** 0 · **Valores distintos:** 92.356
- **Moda:** `2025-04-05 10:44:00` (45).
- **Rango:** desde `2025-04-01 06:34:00` hasta `2026-09-30 21:17:00`.

## codigo

- **Tipo:** categórica
- **Registros:** 296.531 · **Válidos:** 296.531 · **Vacíos:** 0 · **Inválidos:** 0 · **Valores distintos:** 4.130
- **Moda:** `9037` (25.843).
- **Valores más frecuentes:** `9037` (25.843); `9157` (9.049); `9149` (5.715).

## descripcion

- **Tipo:** categórica
- **Registros:** 296.531 · **Válidos:** 296.531 · **Vacíos:** 0 · **Inválidos:** 0 · **Valores distintos:** 3.812
- **Moda:** `PAN KG` (25.844).
- **Valores más frecuentes:** `PAN KG` (25.844); `HUEVO EXTRA` (6.207); `+ 100` (5.715).

## precio_unitario

- **Tipo:** numérica
- **Registros:** 296.531 · **Válidos:** 296.531 · **Vacíos:** 0 · **Inválidos:** 0 · **Valores distintos:** 199
- **Moda:** `2700.00` (27.644).
- **Estadísticos:** mínimo `50,0000`, Q1 `500,0000`, media `1.943,2362`, mediana `1.200,0000`, Q3 `2.500,0000`, máximo `26.000,0000`, desviación estándar `2.329,8416`.

## precio_con_descuento

- **Tipo:** numérica
- **Registros:** 296.531 · **Válidos:** 296.531 · **Vacíos:** 0 · **Inválidos:** 0 · **Valores distintos:** 598
- **Moda:** `1000.00` (15.695).
- **Estadísticos:** mínimo `50,0000`, Q1 `500,0000`, media `1.943,2388`, mediana `1.200,0000`, Q3 `2.500,0000`, máximo `26.000,0000`, desviación estándar `2.329,8538`.

## cantidad

- **Tipo:** numérica
- **Registros:** 296.531 · **Válidos:** 296.531 · **Vacíos:** 0 · **Inválidos:** 0 · **Valores distintos:** 400
- **Moda:** `1.00` (231.248).
- **Estadísticos:** mínimo `-20,0000`, Q1 `1,0000`, media `1,0205`, mediana `1,0000`, Q3 `1,0000`, máximo `243,0000`, desviación estándar `1,1663`.

## valor_linea

- **Tipo:** numérica
- **Registros:** 296.531 · **Válidos:** 296.531 · **Vacíos:** 0 · **Inválidos:** 0 · **Valores distintos:** 4.356
- **Moda:** `1000` (16.144).
- **Estadísticos:** mínimo `-24.000,0000`, Q1 `498,0000`, media `1.351,3574`, mediana `1.000,0000`, Q3 `1.776,0000`, máximo `250.000,0000`, desviación estándar `1.465,2004`.
