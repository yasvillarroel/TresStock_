# Pruebas de usuarios

Estado inicial: todos los casos están pendientes de ejecución manual.

## USU-01 — Respetar permisos de usuario

- Tipo: Seguridad.
- Entorno: Consulta.
- Precondiciones: Cuenta con rol Usuario y acceso al navegador.

### Pasos

1. Iniciar sesión como Usuario.
2. Comprobar que Administración no se ofrece.
3. Abrir /api/usuarios en la misma sesión.

### Resultado esperado

El menú no ofrece Administración y la API rechaza el acceso con 403.

### Registro de ejecución

- Estado: PENDIENTE.
- Fecha y responsable:
- Navegador, dispositivo y versión del proyecto:
- Datos utilizados:
- Resultado obtenido:
- Evidencia: `pruebas/evidencias/USU-01/`.
- Incidencia asociada, si corresponde:

---

## USU-02 — Crear una cuenta desde Administración

- Tipo: Funcional.
- Entorno: Base de pruebas.
- Precondiciones: Usar exclusivamente la base separada de pruebas y cuentas de demostración. Administrador conectado.

### Pasos

1. Crear una cuenta Usuario con correo único, nombre y contraseña válidos.
2. Iniciar sesión con esa cuenta en otro navegador.

### Resultado esperado

La cuenta se crea y accede con permisos de Usuario.

### Registro de ejecución

- Estado: PENDIENTE.
- Fecha y responsable:
- Navegador, dispositivo y versión del proyecto:
- Datos utilizados:
- Resultado obtenido:
- Evidencia: `pruebas/evidencias/USU-02/`.
- Incidencia asociada, si corresponde:

---

## USU-03 — Impedir desactivar la cuenta propia

- Tipo: Seguridad / validación.
- Entorno: Base de pruebas.
- Precondiciones: Usar exclusivamente la base separada de pruebas y cuentas de demostración. Administrador conectado.

### Pasos

1. Intentar desactivar la propia cuenta desde Administración.

### Resultado esperado

La interfaz o la API impiden la operación y la cuenta sigue activa.

### Registro de ejecución

- Estado: PENDIENTE.
- Fecha y responsable:
- Navegador, dispositivo y versión del proyecto:
- Datos utilizados:
- Resultado obtenido:
- Evidencia: `pruebas/evidencias/USU-03/`.
- Incidencia asociada, si corresponde:

---

## USU-04 — Conservar un administrador activo

- Tipo: Seguridad / integración.
- Entorno: Base de pruebas.
- Precondiciones: Usar exclusivamente la base separada de pruebas y cuentas de demostración. Preparar una base de prueba con un solo administrador activo.

### Pasos

1. Intentar desactivar o quitar el rol al último administrador.

### Resultado esperado

La operación se rechaza y permanece al menos un administrador activo.

### Registro de ejecución

- Estado: PENDIENTE.
- Fecha y responsable:
- Navegador, dispositivo y versión del proyecto:
- Datos utilizados:
- Resultado obtenido:
- Evidencia: `pruebas/evidencias/USU-04/`.
- Incidencia asociada, si corresponde:
