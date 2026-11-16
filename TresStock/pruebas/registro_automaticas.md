# Registro de pruebas automáticas

- Fecha: 15 de noviembre de 2026 (America/Santiago).
- Archivo ejecutado: `backend/pruebas/regresiones_backend.test.js` del proyecto.
- Ejecución: Node.js con `--test`.
- Resultado: 19 pruebas aprobadas, 0 fallidas, 0 omitidas.
- Base de datos real: no utilizada.
- SMTP: no utilizado; no se enviaron correos.

## Cobertura de esta ejecución

- Versiones de sesión, secreto requerido y rechazo de tokens antiguos.
- Sesiones antes y después de cambiar la contraseña.
- Respuesta pública del inicio de sesión.
- Rechazo de ventas incompletas y reimportación sin duplicados.
- Stock decimal válido e inválido en el flujo de importación.
- Colisiones de códigos y eliminación de asociaciones antiguas en conflicto.

Estos resultados no certifican aún los recorridos manuales, el dashboard real, el correo, la cámara ni la instalación de la PWA. Los casos manuales permanecen pendientes.

Para repetir desde la carpeta del proyecto:

```powershell
npm test
```
