# Pruebas de proveedores

Estado inicial: todos los casos están pendientes de ejecución manual.

## PRV-01 — Crear y editar proveedor

- Tipo: Funcional.
- Entorno: Base de pruebas.
- Precondiciones: Usar exclusivamente la base separada de pruebas y cuentas de demostración.

### Pasos

1. Crear QA Proveedor con un plazo de entrega de 7 días.
2. Modificar un dato y recargar.

### Resultado esperado

El proveedor se guarda una sola vez y conserva la modificación.

### Registro de ejecución

- Estado: PENDIENTE.
- Fecha y responsable:
- Navegador, dispositivo y versión del proyecto:
- Datos utilizados:
- Resultado obtenido:
- Evidencia: `pruebas/evidencias/PRV-01/`.
- Incidencia asociada, si corresponde:

---

## PRV-02 — Validar plazo de entrega

- Tipo: Validación.
- Entorno: Base de pruebas.
- Precondiciones: Usar exclusivamente la base separada de pruebas y cuentas de demostración.

### Pasos

1. Intentar guardar un proveedor con plazo 0, negativo o decimal.

### Resultado esperado

Los valores inválidos se rechazan y no se crea un registro incompleto.

### Registro de ejecución

- Estado: PENDIENTE.
- Fecha y responsable:
- Navegador, dispositivo y versión del proyecto:
- Datos utilizados:
- Resultado obtenido:
- Evidencia: `pruebas/evidencias/PRV-02/`.
- Incidencia asociada, si corresponde:
