# Pruebas de alertas vencimientos

Estado inicial: todos los casos están pendientes de ejecución manual.

## ALR-01 — Registrar y consultar un lote

- Tipo: Integración.
- Entorno: Base de pruebas.
- Precondiciones: Usar exclusivamente la base separada de pruebas y cuentas de demostración.

### Pasos

1. Sumar 5 unidades a QA-P001 con fecha de vencimiento futura.
2. Abrir Alertas y Vencimientos.
3. Buscar QA-P001.

### Resultado esperado

El lote aparece activo con cantidad y fecha correctas; el inventario aumenta en 5.

### Registro de ejecución

- Estado: PENDIENTE.
- Fecha y responsable:
- Navegador, dispositivo y versión del proyecto:
- Datos utilizados:
- Resultado obtenido:
- Evidencia: `pruebas/evidencias/ALR-01/`.
- Incidencia asociada, si corresponde:

---

## ALR-02 — Registrar una merma parcial

- Tipo: Integración.
- Entorno: Base de pruebas.
- Precondiciones: Usar exclusivamente la base separada de pruebas y cuentas de demostración. Lote de 5 unidades y stock general suficiente.

### Pasos

1. Registrar merma de 2 unidades e indicar motivo.
2. Marcar descontar stock.
3. Consultar lotes activos, inactivos e inventario.

### Resultado esperado

Quedan 3 unidades activas, se registra la merma de 2 y el stock general baja exactamente en 2.

### Registro de ejecución

- Estado: PENDIENTE.
- Fecha y responsable:
- Navegador, dispositivo y versión del proyecto:
- Datos utilizados:
- Resultado obtenido:
- Evidencia: `pruebas/evidencias/ALR-02/`.
- Incidencia asociada, si corresponde:

---

## ALR-03 — Rechazar una fecha inválida

- Tipo: Validación.
- Entorno: Base de pruebas.
- Precondiciones: Usar exclusivamente la base separada de pruebas y cuentas de demostración. Lote activo.

### Pasos

1. Intentar cambiar el vencimiento a una fecha anterior a hoy.

### Resultado esperado

La fecha se rechaza y el lote conserva su fecha original.

### Registro de ejecución

- Estado: PENDIENTE.
- Fecha y responsable:
- Navegador, dispositivo y versión del proyecto:
- Datos utilizados:
- Resultado obtenido:
- Evidencia: `pruebas/evidencias/ALR-03/`.
- Incidencia asociada, si corresponde:
