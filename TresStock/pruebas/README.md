# Pruebas de TresStock

## Resultados de las pruebas

Los resultados de las pruebas manuales ejecutadas por el equipo se registran en [Pruebas_TresStock.xlsx](resultados/Pruebas_TresStock.xlsx).

El Excel es el registro de referencia para consultar los resultados obtenidos, estados, responsables, fechas y capturas de evidencia de cada caso ejecutado.

Los archivos `casos_prueba.md` y `matriz_pruebas.md` conservan la definición y planificación de las pruebas. Sus estados pueden corresponder al registro inicial; para consultar los resultados de la ejecución, utilizar el Excel.

El caso SES-06 se ejecutó en el entorno habitual con SMTP configurado y una cuenta exclusiva para pruebas. El entorno local separado mantiene el envío de correos desactivado.

Para repetir los casos que crean productos, importan ventas o modifican existencias, utilizar el entorno separado descrito a continuación. Las pruebas automáticas de regresión usan dependencias simuladas y pueden ejecutarse sin modificar PostgreSQL.

## Repetir la ronda de pruebas

1. Ejecutar `npm test` desde la carpeta TresStock.
2. Para la ronda completa, iniciar el entorno aislado con `node pruebas/entorno_local.cjs`. El programa mostrará la dirección y las cuentas de demostración.
3. Ejecutar SES-01: inicio de sesión con una cuenta válida.
4. Ejecutar SES-03: campos obligatorios.
5. Ejecutar MEN-01 y CAB-01: navegación e identidad.
6. Ejecutar PWA-01 y MEN-02: adaptación a teléfono y menú.
7. En la base de pruebas, ejecutar PRO-01 y luego INV-01, INV-02, INV-03 e INV-04 en ese orden. Los saldos esperados son 10 → 15 → 12 → 12 → 20.
8. Continuar con VEN-01 a VEN-04 y USU-01.

Si el entorno aislado no se inicia, completar solo los casos de consulta con una cuenta ya existente y sin guardar cambios. Las pruebas de acceso pueden crear registros técnicos de sesión; las de contraseña incorrecta se reservan para cuentas de demostración.

## Entorno local separado

Requiere Node.js, las dependencias del proyecto instaladas y PostgreSQL instalado en Windows. Desde la carpeta TresStock:

```powershell
node pruebas/entorno_local.cjs
```

Abrir **http://127.0.0.1:3001**. No usar Live Server para esta ronda: esa configuración conecta al backend habitual del puerto 3000.

- Administrador: `admin.pruebas@example.invalid`, contraseña `PruebaAdmin123`.
- Usuario: `usuario.pruebas@example.invalid`, contraseña `PruebaUsuario123`.
- Productos iniciales: QA-P001 y QA-P002, ambos con stock 10, y QA-SERV sin control de existencias.
- PostgreSQL usa el puerto 55441 y la base `tresstock_pruebas`, dentro de una carpeta temporal independiente.
- Las imágenes subidas y los secretos de pruebas quedan en esa carpeta temporal; no se guardan en el repositorio.
- Usa cookies con nombres distintos de los de la aplicación habitual.
- SMTP y consultas de imágenes externas están desactivados. SES-06 necesita otro entorno de pruebas con un servicio de correo configurado.
- Ctrl+C detiene el entorno. Los datos se conservan para continuar después; no se restablece automáticamente el stock al volver a iniciarlo.

La terminal muestra una carpeta `archivos_ejemplo` con tres CSV y un Excel decimal. Para VEN-01, utilizar `ventas_historicas.csv`. Después de preparar el stock inicial, configurar en Ventas el inicio del control como **2026-01-01**; para VEN-02 y VEN-03, utilizar `ventas_diarias.csv` con fecha **2026-01-02**. Para VEN-04, utilizar `ventas_producto_faltante.csv` y registrar QA-P999 antes de reintentar. Para PRO-04, utilizar `productos_decimales.xlsx`.

Si Windows tiene PostgreSQL en otra ubicación, definir `TRESSTOCK_PG_BIN` con la ruta de su carpeta `bin` antes de ejecutar el comando. Si otro programa usa los puertos 3001 o 55441, el entorno debe detenerse con un error; no debe cerrarse ese programa ni reutilizarse su base de datos.

## Cómo documentar cada caso

Consultar los pasos y las precondiciones del archivo `casos_prueba.md` del módulo correspondiente. Los casos están indexados en [matriz_pruebas.md](matriz_pruebas.md).

Registrar la ejecución en `resultados/Pruebas_TresStock.xlsx`, indicando el resultado obtenido, estado, fecha, responsable, datos utilizados, navegador, dispositivo y evidencia.

Utilizar uno de estos estados según lo observado:

- PENDIENTE: la prueba aún no se ha ejecutado o falta completar sus comprobaciones.
- APROBADO: se ejecutaron las comprobaciones y el resultado coincide con lo esperado.
- FALLIDO: el comportamiento observado no coincide con lo esperado.
- BLOQUEADO: falta una condición del entorno que impide ejecutar la prueba.

Las capturas de evidencia se encuentran incorporadas en el Excel. Conservar también los archivos originales cuando estén disponibles. No registrar contraseñas, tokens ni códigos de verificación; ocultar los datos personales que no sean necesarios en las capturas.

Ante un fallo, anotar los pasos para reproducirlo, el resultado esperado y el obtenido. Si se repite la prueba, identificar la fecha y el resultado de la nueva ejecución, conservando constancia de la incidencia anterior.

Antes de repetir una prueba que modifica datos, revisar sus precondiciones y preparar los saldos necesarios en la base aislada. El entorno conserva los cambios entre sesiones.

## Alcance de las pruebas automáticas

`backend/pruebas/regresiones_backend.test.js` comprueba servicios y middleware con dependencias simuladas. No sustituye las pruebas manuales del navegador, la cámara, la instalación de la PWA, el correo SMTP ni la integración real con PostgreSQL. El resultado de la ejecución realizada está en [registro_automaticas.md](registro_automaticas.md).

## Teléfonos y PWA

Para comenzar, usar la emulación de tamaños del navegador. Para probar cámara e instalación en un teléfono real se necesita un entorno de pruebas accesible desde ese teléfono y servido por HTTPS. Una dirección localhost del PC no es accesible como localhost desde el teléfono.

El Service Worker actual solo controla instalación y activación: no hay caché offline implementada. PWA-03 documenta esa limitación y el manejo de errores; no supone que se pueda trabajar sin conexión.

## Antes de dar una versión por aprobada

Completar los casos prioritarios, revisar fallos y volver a ejecutar los casos afectados después de corregirlos. No declarar aprobado todo el sistema solo porque `npm test` termina sin errores.
