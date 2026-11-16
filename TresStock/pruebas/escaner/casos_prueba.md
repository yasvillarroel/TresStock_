# Pruebas de escaner

Estado inicial: todos los casos están pendientes de ejecución manual.

## ESC-01 — Escanear un producto conocido

- Tipo: Funcional / dispositivo.
- Entorno: Base de pruebas.
- Precondiciones: Teléfono con cámara y contexto HTTPS; código impreso de un producto de prueba.

### Pasos

1. Abrir Escanear producto.
2. Autorizar la cámara.
3. Apuntar al código registrado.

### Resultado esperado

Se identifica el producto correcto y se muestran sus datos y existencias.

### Registro de ejecución

- Estado: PENDIENTE.
- Fecha y responsable:
- Navegador, dispositivo y versión del proyecto:
- Datos utilizados:
- Resultado obtenido:
- Evidencia: `pruebas/evidencias/ESC-01/`.
- Incidencia asociada, si corresponde:

---

## ESC-02 — Denegar permiso de cámara

- Tipo: Usabilidad / dispositivo.
- Entorno: Consulta.
- Precondiciones: Navegador con permisos de cámara restablecidos.

### Pasos

1. Abrir el escáner y denegar el permiso.
2. Cerrar la vista o navegar a Inventario.

### Resultado esperado

La aplicación permite salir y continuar navegando; registrar cualquier mensaje confuso o pantalla bloqueada.

### Registro de ejecución

- Estado: PENDIENTE.
- Fecha y responsable:
- Navegador, dispositivo y versión del proyecto:
- Datos utilizados:
- Resultado obtenido:
- Evidencia: `pruebas/evidencias/ESC-02/`.
- Incidencia asociada, si corresponde:

---

## ESC-03 — Rechazar un código principal como asociación

- Tipo: Regresión / integración.
- Entorno: Base de pruebas.
- Precondiciones: Usar exclusivamente la base separada de pruebas y cuentas de demostración. Dos productos de prueba distintos.

### Pasos

1. Intentar asociar al segundo producto el código principal o de barras del primero.

### Resultado esperado

La operación informa el conflicto y no modifica ninguno de los productos.

### Registro de ejecución

- Estado: PENDIENTE.
- Fecha y responsable:
- Navegador, dispositivo y versión del proyecto:
- Datos utilizados:
- Resultado obtenido:
- Evidencia: `pruebas/evidencias/ESC-03/`.
- Incidencia asociada, si corresponde:
