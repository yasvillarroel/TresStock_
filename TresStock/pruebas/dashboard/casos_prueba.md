# Pruebas de dashboard

Estado inicial: todos los casos están pendientes de ejecución manual.

## DAS-01 — Comparar indicadores con Inventario

- Tipo: Integración.
- Entorno: Base de pruebas.
- Precondiciones: Usar exclusivamente la base separada de pruebas y cuentas de demostración. Preparar un producto con stock 7, mínimo 5 y seguridad 5; otro agotado y un servicio sin control de stock.

### Pasos

1. Abrir Dashboard.
2. Comparar los indicadores con Inventario.

### Resultado esperado

El primer producto cuenta como stock bajo; el servicio no cuenta como agotado; ambos módulos coinciden.

### Registro de ejecución

- Estado: PENDIENTE.
- Fecha y responsable:
- Navegador, dispositivo y versión del proyecto:
- Datos utilizados:
- Resultado obtenido:
- Evidencia: `pruebas/evidencias/DAS-01/`.
- Incidencia asociada, si corresponde:

---

## DAS-02 — Consultar gráficos y rankings

- Tipo: Funcional.
- Entorno: Consulta.
- Precondiciones: Existen ventas cargadas.

### Pasos

1. Abrir gráficos y ranking de productos más vendidos.
2. Cambiar entre períodos disponibles.

### Resultado esperado

Los gráficos y el ranking cargan sin errores; el período mostrado coincide con la consulta.

### Registro de ejecución

- Estado: PENDIENTE.
- Fecha y responsable:
- Navegador, dispositivo y versión del proyecto:
- Datos utilizados:
- Resultado obtenido:
- Evidencia: `pruebas/evidencias/DAS-02/`.
- Incidencia asociada, si corresponde:
