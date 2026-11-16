# Pruebas de ventas

Estado inicial: todos los casos están pendientes de ejecución manual.

## VEN-01 — Importar ventas históricas

- Tipo: Integración.
- Entorno: Base de pruebas.
- Precondiciones: Usar exclusivamente la base separada de pruebas y cuentas de demostración. Productos del CSV registrados; fechas anteriores al inicio del control.

### Pasos

1. Anotar stock y número de ventas iniciales.
2. Importar un CSV de DimaSoft como histórico.
3. Consultar ventas, detalles y stock.

### Resultado esperado

Se guardan las ventas y sus detalles, y el stock no cambia.

### Registro de ejecución

- Estado: PENDIENTE.
- Fecha y responsable:
- Navegador, dispositivo y versión del proyecto:
- Datos utilizados:
- Resultado obtenido:
- Evidencia: `pruebas/evidencias/VEN-01/`.
- Incidencia asociada, si corresponde:

---

## VEN-02 — Importar ventas diarias

- Tipo: Integración.
- Entorno: Base de pruebas.
- Precondiciones: Usar exclusivamente la base separada de pruebas y cuentas de demostración. Fecha inicial de control configurada y QA-P001 con stock 20.

### Pasos

1. Importar como diaria una venta nueva de 2 unidades de QA-P001 posterior al inicio del control.
2. Consultar detalle, inventario e historial.

### Resultado esperado

La venta se registra, el stock queda en 18 y se registra su salida.

### Registro de ejecución

- Estado: PENDIENTE.
- Fecha y responsable:
- Navegador, dispositivo y versión del proyecto:
- Datos utilizados:
- Resultado obtenido:
- Evidencia: `pruebas/evidencias/VEN-02/`.
- Incidencia asociada, si corresponde:

---

## VEN-03 — Reimportar sin duplicar

- Tipo: Regresión / integración.
- Entorno: Base de pruebas.
- Precondiciones: Usar exclusivamente la base separada de pruebas y cuentas de demostración. Ejecutar VEN-02 antes.

### Pasos

1. Importar exactamente el mismo CSV diario otra vez.
2. Comparar ventas, detalles, movimientos y stock.

### Resultado esperado

No se duplican ventas ni detalles ni movimientos; el stock sigue en 18.

### Registro de ejecución

- Estado: PENDIENTE.
- Fecha y responsable:
- Navegador, dispositivo y versión del proyecto:
- Datos utilizados:
- Resultado obtenido:
- Evidencia: `pruebas/evidencias/VEN-03/`.
- Incidencia asociada, si corresponde:

---

## VEN-04 — Rechazar una venta incompleta

- Tipo: Regresión / integración.
- Entorno: Base de pruebas.
- Precondiciones: Usar exclusivamente la base separada de pruebas y cuentas de demostración.

### Pasos

1. Preparar una boleta nueva con un producto conocido y otro no registrado.
2. Anotar los saldos iniciales e importar.
3. Registrar el producto faltante e importar de nuevo.

### Resultado esperado

El primer intento no guarda ninguna venta ni cambia stock; el segundo registra la boleta completa una sola vez.

### Registro de ejecución

- Estado: PENDIENTE.
- Fecha y responsable:
- Navegador, dispositivo y versión del proyecto:
- Datos utilizados:
- Resultado obtenido:
- Evidencia: `pruebas/evidencias/VEN-04/`.
- Incidencia asociada, si corresponde:
