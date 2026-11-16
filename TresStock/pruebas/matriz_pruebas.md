# Matriz de pruebas de TresStock

41 casos manuales propuestos. Ninguno se marca aprobado por la ejecución de pruebas automáticas.

| ID | Módulo | Caso | Tipo | Entorno | Estado |
| --- | --- | --- | --- | --- | --- |
| SES-01 | inicio_sesion | Iniciar sesión | Funcional | Consulta | PENDIENTE |
| SES-02 | inicio_sesion | Rechazar contraseña incorrecta | Validación | Base de pruebas | PENDIENTE |
| SES-03 | inicio_sesion | Campos obligatorios | Validación | Consulta | PENDIENTE |
| SES-04 | inicio_sesion | Cerrar sesión | Funcional / seguridad | Consulta | PENDIENTE |
| SES-05 | inicio_sesion | Invalidar una sesión tras cambiar la contraseña | Seguridad / integración | Base de pruebas | PENDIENTE |
| SES-06 | inicio_sesion | Registro y recuperación por correo | Integración | Base de pruebas + SMTP | PENDIENTE |
| PRO-01 | productos | Crear un producto | Funcional | Base de pruebas | PENDIENTE |
| PRO-02 | productos | Editar un producto | Funcional | Base de pruebas | PENDIENTE |
| PRO-03 | productos | Activar y desactivar | Funcional | Base de pruebas | PENDIENTE |
| PRO-04 | productos | Importar existencias decimales | Integración | Base de pruebas | PENDIENTE |
| INV-01 | inventario | Sumar existencias | Funcional / integración | Base de pruebas | PENDIENTE |
| INV-02 | inventario | Restar existencias | Funcional / integración | Base de pruebas | PENDIENTE |
| INV-03 | inventario | Impedir una resta excesiva | Validación | Base de pruebas | PENDIENTE |
| INV-04 | inventario | Fijar existencias | Funcional / integración | Base de pruebas | PENDIENTE |
| VEN-01 | ventas | Importar ventas históricas | Integración | Base de pruebas | PENDIENTE |
| VEN-02 | ventas | Importar ventas diarias | Integración | Base de pruebas | PENDIENTE |
| VEN-03 | ventas | Reimportar sin duplicar | Regresión / integración | Base de pruebas | PENDIENTE |
| VEN-04 | ventas | Rechazar una venta incompleta | Regresión / integración | Base de pruebas | PENDIENTE |
| USU-01 | usuarios | Respetar permisos de usuario | Seguridad | Consulta | PENDIENTE |
| USU-02 | usuarios | Crear una cuenta desde Administración | Funcional | Base de pruebas | PENDIENTE |
| USU-03 | usuarios | Impedir desactivar la cuenta propia | Seguridad / validación | Base de pruebas | PENDIENTE |
| USU-04 | usuarios | Conservar un administrador activo | Seguridad / integración | Base de pruebas | PENDIENTE |
| PRV-01 | proveedores | Crear y editar proveedor | Funcional | Base de pruebas | PENDIENTE |
| PRV-02 | proveedores | Validar plazo de entrega | Validación | Base de pruebas | PENDIENTE |
| DAS-01 | dashboard | Comparar indicadores con Inventario | Integración | Base de pruebas | PENDIENTE |
| DAS-02 | dashboard | Consultar gráficos y rankings | Funcional | Consulta | PENDIENTE |
| ALR-01 | alertas_vencimientos | Registrar y consultar un lote | Integración | Base de pruebas | PENDIENTE |
| ALR-02 | alertas_vencimientos | Registrar una merma parcial | Integración | Base de pruebas | PENDIENTE |
| ALR-03 | alertas_vencimientos | Rechazar una fecha inválida | Validación | Base de pruebas | PENDIENTE |
| ESC-01 | escaner | Escanear un producto conocido | Funcional / dispositivo | Base de pruebas | PENDIENTE |
| ESC-02 | escaner | Denegar permiso de cámara | Usabilidad / dispositivo | Consulta | PENDIENTE |
| ESC-03 | escaner | Rechazar un código principal como asociación | Regresión / integración | Base de pruebas | PENDIENTE |
| ANA-01 | reportes_analitica | Pronóstico con datos controlados | Integración / cálculo | Base de pruebas | PENDIENTE |
| ANA-02 | reportes_analitica | Consultar reposición y explicación | Funcional | Consulta | PENDIENTE |
| MEN-01 | menu_lateral | Navegar por los módulos | Funcional | Consulta | PENDIENTE |
| MEN-02 | menu_lateral | Usar el menú en teléfono | Responsive | Consulta | PENDIENTE |
| CAB-01 | cabecera | Identidad y título de la vista | Funcional | Consulta | PENDIENTE |
| CAB-02 | cabecera | Consultar notificaciones | Funcional / responsive | Consulta | PENDIENTE |
| PWA-01 | index | Verificar diseño en varios tamaños | Responsive | Consulta | PENDIENTE |
| PWA-02 | index | Instalar y abrir la PWA | PWA / dispositivo | Consulta | PENDIENTE |
| PWA-03 | index | Comprobar pérdida de conexión | PWA / manejo de errores | Consulta | PENDIENTE |
