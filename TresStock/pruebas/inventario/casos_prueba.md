# Pruebas de inventario

Estado inicial: todos los casos están pendientes de ejecución manual.

## INV-01 — Sumar existencias

- Tipo: Funcional / integración.
- Entorno: Base de pruebas.
- Precondiciones: Usar exclusivamente la base separada de pruebas y cuentas de demostración. QA-P001 con stock inicial 10.

### Pasos

1. Abrir Ajustar inventario para QA-P001.
2. Elegir sumar, cantidad 5 y un motivo válido.
3. Guardar y consultar el historial.

### Resultado esperado

El stock queda en 15 y existe una entrada de 5 con usuario y motivo.

### Registro de ejecución

- Estado: PENDIENTE.
- Fecha y responsable:
- Navegador, dispositivo y versión del proyecto:
- Datos utilizados:
- Resultado obtenido:
- Evidencia: `pruebas/evidencias/INV-01/`.
- Incidencia asociada, si corresponde:

---

## INV-02 — Restar existencias

- Tipo: Funcional / integración.
- Entorno: Base de pruebas.
- Precondiciones: Usar exclusivamente la base separada de pruebas y cuentas de demostración. QA-P001 con stock inicial 15.

### Pasos

1. Restar 3 con un motivo válido.
2. Consultar el saldo y el historial.

### Resultado esperado

El stock queda en 12 y existe una salida de 3.

### Registro de ejecución

- Estado: PENDIENTE.
- Fecha y responsable:
- Navegador, dispositivo y versión del proyecto:
- Datos utilizados:
- Resultado obtenido:
- Evidencia: `pruebas/evidencias/INV-02/`.
- Incidencia asociada, si corresponde:

---

## INV-03 — Impedir una resta excesiva

- Tipo: Validación.
- Entorno: Base de pruebas.
- Precondiciones: Usar exclusivamente la base separada de pruebas y cuentas de demostración. QA-P001 con stock inicial 12.

### Pasos

1. Intentar restar 13.
2. Revisar saldo e historial.

### Resultado esperado

La operación se rechaza; el stock sigue en 12 y no se registra un movimiento exitoso.

### Registro de ejecución

- Estado: PENDIENTE.
- Fecha y responsable:
- Navegador, dispositivo y versión del proyecto:
- Datos utilizados:
- Resultado obtenido:
- Evidencia: `pruebas/evidencias/INV-03/`.
- Incidencia asociada, si corresponde:

---

## INV-04 — Fijar existencias

- Tipo: Funcional / integración.
- Entorno: Base de pruebas.
- Precondiciones: Usar exclusivamente la base separada de pruebas y cuentas de demostración. QA-P001 con stock inicial 12.

### Pasos

1. Fijar el stock en 20 con un motivo válido.
2. Consultar el historial.

### Resultado esperado

El stock queda en 20 y el ajuste permite identificar el saldo anterior y el nuevo.

### Registro de ejecución

- Estado: PENDIENTE.
- Fecha y responsable:
- Navegador, dispositivo y versión del proyecto:
- Datos utilizados:
- Resultado obtenido:
- Evidencia: `pruebas/evidencias/INV-04/`.
- Incidencia asociada, si corresponde:
