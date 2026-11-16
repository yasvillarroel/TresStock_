# Pruebas de TresStock

## Situación inicial

Actualmente el equipo solo dispone de la base del proyecto. No ejecutar aún los casos que crean cuentas, importan archivos o modifican existencias sobre esa base. Las pruebas automáticas de regresión usan dependencias simuladas y pueden ejecutarse sin tocar PostgreSQL.

## Primera ronda

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

Abrir el archivo `casos_prueba.md` del módulo, seguir sus pasos y completar el registro. Usar uno de estos estados: PENDIENTE, APROBADO, FALLIDO o BLOQUEADO. Registrar lo observado, incluso si difiere de lo esperado.

Guardar capturas con el ID del caso, por ejemplo `pruebas/evidencias/INV-01/stock_despues.png`. No incluir contraseñas, tokens ni correos de personas reales en las evidencias. Ante un fallo, anotar pasos para reproducirlo, resultado esperado, resultado obtenido y su impacto.

Los casos están indexados en [matriz_pruebas.md](matriz_pruebas.md). Cada prueba declara sus precondiciones: si ya se modificó un saldo, volver a prepararlo en la base aislada antes de repetirla.

## Alcance de las pruebas automáticas

`backend/pruebas/regresiones_backend.test.js` comprueba servicios y middleware con dependencias simuladas. No sustituye las pruebas manuales del navegador, la cámara, la instalación de la PWA, el correo SMTP ni la integración real con PostgreSQL. El resultado de la ejecución realizada está en [registro_automaticas.md](registro_automaticas.md).

## Teléfonos y PWA

Para comenzar, usar la emulación de tamaños del navegador. Para probar cámara e instalación en un teléfono real se necesita un entorno de pruebas accesible desde ese teléfono y servido por HTTPS. Una dirección localhost del PC no es accesible como localhost desde el teléfono.

El Service Worker actual solo controla instalación y activación: no hay caché offline implementada. PWA-03 documenta esa limitación y el manejo de errores; no supone que se pueda trabajar sin conexión.

## Antes de dar una versión por aprobada

Completar los casos prioritarios, revisar fallos y volver a ejecutar los casos afectados después de corregirlos. No declarar aprobado todo el sistema solo porque `npm test` termina sin errores.
