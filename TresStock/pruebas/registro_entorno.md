# Verificación del entorno separado

- Fecha: 16 de noviembre de 2026 (America/Santiago).
- Aplicación comprobada: backend actual del proyecto.
- Base usada: `tresstock_pruebas`, en un clúster nuevo de una carpeta temporal.
- Base habitual del proyecto: no utilizada ni modificada.
- Comprobaciones realizadas: conexión de la API con PostgreSQL, generación de CSRF, inicio de sesión de demostración y cookies con nombres separados.
- Archivos de ejemplo preparados: ventas históricas, ventas diarias, ventas con producto faltante y productos con stock decimal.
- SMTP: desactivado; no se enviaron correos.

Esta verificación permite comenzar la ronda manual. No significa que todos los casos de la matriz hayan sido ejecutados ni aprobados.
