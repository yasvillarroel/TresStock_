# Pruebas de index

Estado inicial: todos los casos están pendientes de ejecución manual.

## PWA-01 — Verificar diseño en varios tamaños

- Tipo: Responsive.
- Entorno: Consulta.
- Precondiciones: Aplicación abierta.

### Pasos

1. Revisar 320, 390, 768 y 1366 px.
2. Abrir formularios sin guardarlos.
3. Comprobar tablas, botones y menús.

### Resultado esperado

No hay desbordamiento horizontal de la página; las tablas anchas pueden desplazarse dentro de su contenedor y las acciones se pueden alcanzar.

### Registro de ejecución

- Estado: PENDIENTE.
- Fecha y responsable:
- Navegador, dispositivo y versión del proyecto:
- Datos utilizados:
- Resultado obtenido:
- Evidencia: `pruebas/evidencias/PWA-01/`.
- Incidencia asociada, si corresponde:

---

## PWA-02 — Instalar y abrir la PWA

- Tipo: PWA / dispositivo.
- Entorno: Consulta.
- Precondiciones: Aplicación servida desde localhost o HTTPS; navegador compatible.

### Pasos

1. Instalar la aplicación desde el navegador.
2. Cerrar la ventana y abrirla desde su icono.
3. Iniciar sesión si se solicita.

### Resultado esperado

Se abre la aplicación con nombre e icono correctos y permite acceder al sistema. Registrar navegador y sistema operativo.

### Registro de ejecución

- Estado: PENDIENTE.
- Fecha y responsable:
- Navegador, dispositivo y versión del proyecto:
- Datos utilizados:
- Resultado obtenido:
- Evidencia: `pruebas/evidencias/PWA-02/`.
- Incidencia asociada, si corresponde:

---

## PWA-03 — Comprobar pérdida de conexión

- Tipo: PWA / manejo de errores.
- Entorno: Consulta.
- Precondiciones: Usar una sesión de pruebas.

### Pasos

1. Abrir una vista y desactivar la conexión.
2. Intentar una consulta y luego restablecer la conexión.
3. Recargar y comprobar la recuperación.

### Resultado esperado

No se informa una operación exitosa si la API no respondió. Registrar el comportamiento real: el Service Worker actual no implementa caché ni operaciones offline.

### Registro de ejecución

- Estado: PENDIENTE.
- Fecha y responsable:
- Navegador, dispositivo y versión del proyecto:
- Datos utilizados:
- Resultado obtenido:
- Evidencia: `pruebas/evidencias/PWA-03/`.
- Incidencia asociada, si corresponde:
