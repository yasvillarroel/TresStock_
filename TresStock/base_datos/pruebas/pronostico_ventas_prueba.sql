-- Datos ficticios para probar el pronóstico de ventas en Inventario.
-- Ejecuta este archivo después de crear el esquema y tener productos existentes.
-- Inserta 28 días de ventas para hasta tres productos y no modifica el SQL principal.
-- Para borrar estas ventas al terminar, ejecuta la consulta de limpieza al final.

DO $$
DECLARE
    producto RECORD;
    indice_producto INTEGER := 0;
    dia INTEGER;
    fecha_base DATE;
    fecha_venta DATE;
    unidades NUMERIC(12, 4);
    precio NUMERIC(12, 2) := 1000;
    id_venta_nueva INTEGER;
    boleta_prueba VARCHAR(50);
BEGIN
    SELECT GREATEST(CURRENT_DATE, COALESCE(MAX(fecha_hora)::date, CURRENT_DATE))
    INTO fecha_base
    FROM base_datos.ventas;

    FOR producto IN
        SELECT codigo
        FROM base_datos.productos
        WHERE controla_stock = TRUE
        ORDER BY codigo
        LIMIT 3
    LOOP
        indice_producto := indice_producto + 1;

        FOR dia IN 0..27 LOOP
            fecha_venta := fecha_base - dia;
            unidades := indice_producto;
            boleta_prueba := 'PRONOSTICO_TEST_' || SUBSTRING(MD5(producto.codigo), 1, 8) || '_' || TO_CHAR(fecha_venta, 'YYYYMMDD');

            INSERT INTO base_datos.ventas (boleta, fecha_hora, total)
            VALUES (boleta_prueba, fecha_venta + TIME '12:00', precio * unidades)
            ON CONFLICT (boleta) DO NOTHING
            RETURNING id_venta INTO id_venta_nueva;

            IF id_venta_nueva IS NOT NULL THEN
                INSERT INTO base_datos.detalle_venta (id_venta, codigo, precio, cantidad, valorizado)
                VALUES (id_venta_nueva, producto.codigo, precio, unidades, precio * unidades);
            END IF;

            id_venta_nueva := NULL;
        END LOOP;
    END LOOP;

    IF indice_producto = 0 THEN
        RAISE NOTICE 'No hay productos en base_datos.productos; no se insertaron ventas.';
    ELSE
        RAISE NOTICE 'Se generaron ventas de prueba para % producto(s), con fecha de corte %.', indice_producto, fecha_base;
    END IF;
END;
$$;

-- Verifica las ventas de prueba y muestra el pronóstico calculado para esos productos.
WITH periodo AS (
    SELECT MAX(fecha_hora)::date AS fecha_fin
    FROM base_datos.ventas
),
demanda_28_dias AS (
    SELECT dv.codigo, SUM(GREATEST(dv.cantidad, 0)) AS unidades
    FROM base_datos.detalle_venta dv
    INNER JOIN base_datos.ventas v ON v.id_venta = dv.id_venta
    CROSS JOIN periodo p
    WHERE v.boleta LIKE 'PRONOSTICO_TEST_%'
      AND v.fecha_hora >= (p.fecha_fin - INTERVAL '27 days')::timestamp
      AND v.fecha_hora < (p.fecha_fin + 1)::timestamp
    GROUP BY dv.codigo
)
SELECT
    p.codigo,
    p.descripcion,
    SUM(d28.unidades) AS unidades_28_dias,
    ROUND(SUM(d28.unidades) * 7 / 28, 3) AS pronostico_7_dias,
    ROUND(SUM(d28.unidades) * 14 / 28, 3) AS pronostico_14_dias,
    ROUND(SUM(d28.unidades) * 30 / 28, 3) AS pronostico_30_dias
FROM demanda_28_dias d28
INNER JOIN base_datos.productos p ON p.codigo = d28.codigo
GROUP BY p.codigo, p.descripcion
ORDER BY p.descripcion;

-- Limpieza opcional: elimina únicamente las ventas insertadas por este script.
-- La FK de detalle_venta elimina sus detalles en cascada.
-- DELETE FROM base_datos.ventas WHERE boleta LIKE 'PRONOSTICO_TEST_%';
