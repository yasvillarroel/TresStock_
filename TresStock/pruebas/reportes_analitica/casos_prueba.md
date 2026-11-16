# Pruebas de reportes analitica

Estado inicial: todos los casos están pendientes de ejecución manual.

## ANA-01 — Pronóstico con datos controlados

- Tipo: Integración / cálculo.
- Entorno: Base de pruebas.
- Precondiciones: Usar exclusivamente la base separada de pruebas y cuentas de demostración. Producto por unidad con 56 unidades positivas vendidas en los últimos 28 días registrados.

### Pasos

1. Seleccionar el método Promedio móvil.
2. Consultar el producto y sus proyecciones.

### Resultado esperado

Los pronósticos son 14 unidades a 7 días, 28 a 14 días y 60 a 30 días. No se compara este resultado con LightGBM.

### Registro de ejecución

- Estado: PENDIENTE.
- Fecha y responsable:
- Navegador, dispositivo y versión del proyecto:
- Datos utilizados:
- Resultado obtenido:
- Evidencia: `pruebas/evidencias/ANA-01/`.
- Incidencia asociada, si corresponde:

---

## ANA-02 — Consultar reposición y explicación

- Tipo: Funcional.
- Entorno: Consulta.
- Precondiciones: Existen productos con ventas y existencias.

### Pasos

1. Abrir Reposición recomendada.
2. Cambiar filtros y abrir ¿Cómo se calcula?.

### Resultado esperado

La tabla se actualiza, el filtro elegido se refleja en los resultados y la explicación es legible.

### Registro de ejecución

- Estado: PENDIENTE.
- Fecha y responsable:
- Navegador, dispositivo y versión del proyecto:
- Datos utilizados:
- Resultado obtenido:
- Evidencia: `pruebas/evidencias/ANA-02/`.
- Incidencia asociada, si corresponde:
