# Pruebas de productos

Estado inicial: todos los casos están pendientes de ejecución manual.

## PRO-01 — Crear un producto

- Tipo: Funcional.
- Entorno: Base de pruebas.
- Precondiciones: Usar exclusivamente la base separada de pruebas y cuentas de demostración.

### Pasos

1. Crear QA-P003 con código de barras nuevo, descripción, precio y control de stock.
2. Guardar y buscar el producto.

### Resultado esperado

El producto aparece una sola vez con los valores ingresados.

### Registro de ejecución

- Estado: PENDIENTE.
- Fecha y responsable:
- Navegador, dispositivo y versión del proyecto:
- Datos utilizados:
- Resultado obtenido:
- Evidencia: `pruebas/evidencias/PRO-01/`.
- Incidencia asociada, si corresponde:

---

## PRO-02 — Editar un producto

- Tipo: Funcional.
- Entorno: Base de pruebas.
- Precondiciones: Usar exclusivamente la base separada de pruebas y cuentas de demostración. QA-P003 existe.

### Pasos

1. Modificar descripción y precio de QA-P003.
2. Guardar y recargar.

### Resultado esperado

Se conservan los cambios y no se crea otro producto.

### Registro de ejecución

- Estado: PENDIENTE.
- Fecha y responsable:
- Navegador, dispositivo y versión del proyecto:
- Datos utilizados:
- Resultado obtenido:
- Evidencia: `pruebas/evidencias/PRO-02/`.
- Incidencia asociada, si corresponde:

---

## PRO-03 — Activar y desactivar

- Tipo: Funcional.
- Entorno: Base de pruebas.
- Precondiciones: Usar exclusivamente la base separada de pruebas y cuentas de demostración. QA-P003 existe.

### Pasos

1. Desactivar QA-P003.
2. Consultar los filtros de activos e inactivos.
3. Reactivarlo.

### Resultado esperado

El estado cambia y los filtros muestran el producto donde corresponde; no se elimina su historial.

### Registro de ejecución

- Estado: PENDIENTE.
- Fecha y responsable:
- Navegador, dispositivo y versión del proyecto:
- Datos utilizados:
- Resultado obtenido:
- Evidencia: `pruebas/evidencias/PRO-03/`.
- Incidencia asociada, si corresponde:

---

## PRO-04 — Importar existencias decimales

- Tipo: Integración.
- Entorno: Base de pruebas.
- Precondiciones: Usar exclusivamente la base separada de pruebas y cuentas de demostración.

### Pasos

1. Preparar Excel con las columnas CODIGO, COD. BARRA, DESCRIPCION, FAMILIA, P.Publico y STOCK ACTUAL.
2. Usar QA-KG001, familia BALANZA y stock 1,25.
3. Confirmar el reemplazo de stock e importar.
4. Consultar su inventario.

### Resultado esperado

La importación termina y el inventario conserva 1,25, sin redondearlo a entero.

### Registro de ejecución

- Estado: PENDIENTE.
- Fecha y responsable:
- Navegador, dispositivo y versión del proyecto:
- Datos utilizados:
- Resultado obtenido:
- Evidencia: `pruebas/evidencias/PRO-04/`.
- Incidencia asociada, si corresponde:
