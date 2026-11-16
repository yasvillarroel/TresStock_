# Pruebas de inicio sesion

Estado inicial: todos los casos están pendientes de ejecución manual.

## SES-01 — Iniciar sesión

- Tipo: Funcional.
- Entorno: Consulta.
- Precondiciones: Cuenta activa de pruebas.

### Pasos

1. Abrir inicio de sesión.
2. Ingresar un correo y una contraseña válidos.
3. Presionar Iniciar sesión.

### Resultado esperado

Se abre la aplicación y la cabecera muestra la identidad correcta.

### Registro de ejecución

- Estado: APROBADO.
- Fecha y responsable: 16-11-2026 Yasna Villarroel
- Navegador, dispositivo y versión del proyecto:
- Datos utilizados: 
    Cuenta: admin.pruebas@example.invalid
    Contraseña: PruebaAdmin123
    Rol: Administrador
    Entorno: http://127.0.0.1:3001
- Resultado obtenido: El sistema permitió iniciar sesión con las credenciales válidas y abrió la página principal. La cabecera mostró correctamente el nombre “Administrador de pruebas”.
- Evidencia: `pruebas/evidencias/SES-01/`.
- Incidencia asociada, si corresponde: No aplica. No se detectaron incidencias.

---

## SES-02 — Rechazar contraseña incorrecta

- Tipo: Validación.
- Entorno: Base de pruebas.
- Precondiciones: Usar exclusivamente la base separada de pruebas y cuentas de demostración.

### Pasos

1. Ingresar una contraseña incorrecta una vez.
2. Intentar iniciar sesión.

### Resultado esperado

Se muestra un error, no se crea una sesión y no se accede a las vistas privadas.

### Registro de ejecución

- Estado: PENDIENTE.
- Fecha y responsable:
- Navegador, dispositivo y versión del proyecto:
- Datos utilizados:
- Resultado obtenido:
- Evidencia: `pruebas/evidencias/SES-02/`.
- Incidencia asociada, si corresponde:

---

## SES-03 — Campos obligatorios

- Tipo: Validación.
- Entorno: Consulta.
- Precondiciones: Formulario de acceso abierto.

### Pasos

1. Intentar ingresar sin correo.
2. Repetir sin contraseña.

### Resultado esperado

El formulario impide continuar e identifica el dato faltante.

### Registro de ejecución

- Estado: PENDIENTE.
- Fecha y responsable:
- Navegador, dispositivo y versión del proyecto:
- Datos utilizados:
- Resultado obtenido:
- Evidencia: `pruebas/evidencias/SES-03/`.
- Incidencia asociada, si corresponde:

---

## SES-04 — Cerrar sesión

- Tipo: Funcional / seguridad.
- Entorno: Consulta.
- Precondiciones: Sesión iniciada.

### Pasos

1. Cerrar sesión desde el perfil.
2. Usar Atrás y recargar la página principal.

### Resultado esperado

La aplicación solicita iniciar sesión nuevamente; los datos privados no se vuelven a cargar.

### Registro de ejecución

- Estado: PENDIENTE.
- Fecha y responsable:
- Navegador, dispositivo y versión del proyecto:
- Datos utilizados:
- Resultado obtenido:
- Evidencia: `pruebas/evidencias/SES-04/`.
- Incidencia asociada, si corresponde:

---

## SES-05 — Invalidar una sesión tras cambiar la contraseña

- Tipo: Seguridad / integración.
- Entorno: Base de pruebas.
- Precondiciones: Usar exclusivamente la base separada de pruebas y cuentas de demostración. Preparar dos navegadores con la misma cuenta.

### Pasos

1. Iniciar sesión en ambos navegadores.
2. Desde un administrador distinto, cambiar la contraseña de esa cuenta.
3. Intentar consultar una sección en el otro navegador.
4. Iniciar sesión con la contraseña nueva.

### Resultado esperado

La sesión anterior es rechazada y la contraseña nueva permite iniciar sesión.

### Registro de ejecución

- Estado: PENDIENTE.
- Fecha y responsable:
- Navegador, dispositivo y versión del proyecto:
- Datos utilizados:
- Resultado obtenido:
- Evidencia: `pruebas/evidencias/SES-05/`.
- Incidencia asociada, si corresponde:

---

## SES-06 — Registro y recuperación por correo

- Tipo: Integración.
- Entorno: Base de pruebas + SMTP.
- Precondiciones: Cuenta y buzón controlados por el equipo; SMTP de pruebas configurado.

### Pasos

1. Solicitar registro y completar el código recibido.
2. Rechazar un código incorrecto.
3. Solicitar recuperación y establecer una contraseña nueva.

### Resultado esperado

El código válido completa la operación, el incorrecto se rechaza y la nueva contraseña funciona. No marcar aprobado si no se recibe el correo real.

### Registro de ejecución

- Estado: PENDIENTE.
- Fecha y responsable:
- Navegador, dispositivo y versión del proyecto:
- Datos utilizados:
- Resultado obtenido:
- Evidencia: `pruebas/evidencias/SES-06/`.
- Incidencia asociada, si corresponde:
