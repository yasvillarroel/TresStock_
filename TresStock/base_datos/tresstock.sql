-- TRESSTOCK - BASE DE DATOS
-- PostgreSQL

-- 0. SCHEMA

DROP SCHEMA IF EXISTS base_datos CASCADE;

CREATE SCHEMA base_datos;

SET search_path TO base_datos;


-- ============================================================
-- 1. PRODUCTOS
--
-- Información proveniente principalmente de DimaSoft.
--
-- codigo
-- cod_barra
-- descripcion
-- familia
-- precio_publico
-- imagen
-- ============================================================

CREATE TABLE productos (
    codigo          VARCHAR(50) PRIMARY KEY,
    cod_barra       VARCHAR(50) NOT NULL,
    descripcion     VARCHAR(255) NOT NULL,
    familia         VARCHAR(100),
    precio_publico  DECIMAL(12,2) NOT NULL DEFAULT 0,
    imagen          VARCHAR(255),

    CONSTRAINT chk_precio_publico
        CHECK (precio_publico >= 0)
);

-- ============================================================
-- 2. CODIGOS ASOCIADOS
--
-- Un producto puede tener uno o varios codigos de barras.
-- Cada codigo puede representar un formato o cantidad diferente.
-- ============================================================

CREATE TABLE codigos_asociados (
    id_codigo           SERIAL PRIMARY KEY,
    codigo_producto     VARCHAR(50) NOT NULL,
    codigo_barras       VARCHAR(50) NOT NULL,
    tipo_formato        VARCHAR(50) NOT NULL,
    cantidad_unidades   NUMERIC(12,4) NOT NULL DEFAULT 1,

    CONSTRAINT fk_codigo_asociado_producto
        FOREIGN KEY (codigo_producto)
        REFERENCES productos(codigo)
        ON DELETE CASCADE,

    CONSTRAINT uq_codigo_barras
        UNIQUE (codigo_barras),

    CONSTRAINT chk_cantidad_unidades
        CHECK (cantidad_unidades > 0)
);


-- ============================================================
-- 3. VENTAS
--
-- Representa una boleta/venta.
-- Una venta puede contener varios productos.
-- ============================================================

CREATE TABLE ventas (
    id_venta        SERIAL PRIMARY KEY,
    boleta          VARCHAR(50) NOT NULL,
    fecha_hora      TIMESTAMP NOT NULL,
    -- permite totales negativos en ventas o correcciones de DimaSoft
    total           DECIMAL(12,2) NOT NULL DEFAULT 0,

    CONSTRAINT uq_venta_boleta
        UNIQUE (boleta)
);


-- ============================================================
-- 4. DETALLE DE VENTA
--
-- Cada fila representa un producto dentro de una venta.
--
-- Ejemplo:
-- Boleta 1001
--   ├── Producto A
--   ├── Producto B
--   └── Producto C
-- Todos tendrán el mismo id_venta.
-- ============================================================

CREATE TABLE detalle_venta (
    id_detalle      SERIAL PRIMARY KEY,
    id_venta        INTEGER NOT NULL,
    codigo          VARCHAR(50) NOT NULL,
    precio          DECIMAL(12,2) NOT NULL,
    -- permite cantidades decimales para productos vendidos por peso
    cantidad        NUMERIC(12,4) NOT NULL,
    -- permite valorizados negativos en correcciones de DimaSoft
    valorizado      DECIMAL(12,2) NOT NULL,

    CONSTRAINT fk_detalle_venta
        FOREIGN KEY (id_venta)
        REFERENCES ventas(id_venta)
        ON DELETE CASCADE,

    CONSTRAINT fk_detalle_producto
        FOREIGN KEY (codigo)
        REFERENCES productos(codigo),

    -- permite cantidades negativas para correcciones registradas en DimaSoft
    CONSTRAINT chk_cantidad_no_cero
        CHECK (cantidad <> 0),

    CONSTRAINT chk_precio_detalle
        CHECK (precio >= 0)
);


-- ============================================================
-- 5. INVENTARIO
-- Representa el estado actual del stock.
-- Un producto posee un registro de inventario.
-- ============================================================

CREATE TABLE inventario (
    codigo          VARCHAR(50) PRIMARY KEY,
    stock_actual    INTEGER NOT NULL DEFAULT 0,
    stock_minimo    INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT fk_inventario_producto
        FOREIGN KEY (codigo)
        REFERENCES productos(codigo)
        ON DELETE CASCADE,

    CONSTRAINT chk_stock_actual
        CHECK (stock_actual >= 0),

    CONSTRAINT chk_stock_minimo
        CHECK (stock_minimo >= 0)
);


-- funcion crear inventario producto
CREATE OR REPLACE FUNCTION crear_inventario_producto()
RETURNS TRIGGER
AS $$
BEGIN

    INSERT INTO base_datos.inventario
    (codigo, stock_actual, stock_minimo)
    VALUES
    (NEW.codigo, 0, 0);

    RETURN NEW;

END;
$$ LANGUAGE plpgsql;

--trigger
CREATE TRIGGER trigger_crear_inventario
AFTER INSERT ON base_datos.productos
FOR EACH ROW
EXECUTE FUNCTION crear_inventario_producto();


-- ============================================================
-- 6. MOVIMIENTOS DE INVENTARIO
--
-- Registra el historial de cambios de stock.
-- Tipos:
-- ENTRADA
-- SALIDA
-- AJUSTE
-- ============================================================

CREATE TABLE movimientos_inventario (
    id_movimiento   SERIAL PRIMARY KEY,
    codigo          VARCHAR(50) NOT NULL,
    tipo            VARCHAR(20) NOT NULL,
    cantidad        INTEGER NOT NULL,
    fecha_hora      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    motivo          VARCHAR(255),

    CONSTRAINT fk_movimiento_producto
        FOREIGN KEY (codigo)
        REFERENCES productos(codigo),

    CONSTRAINT chk_tipo_movimiento
        CHECK (tipo IN ('ENTRADA', 'SALIDA', 'AJUSTE')),

    CONSTRAINT chk_cantidad_movimiento
        CHECK (cantidad > 0)
);


-- ============================================================
-- 7. PREDICCIONES
-- Resultados generados por Python / Machine Learning.
-- El modelo utiliza principalmente el histórico de ventas
-- ============================================================

CREATE TABLE predicciones (
    id_prediccion       SERIAL PRIMARY KEY,
    codigo              VARCHAR(50) NOT NULL,
    fecha_prediccion    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_objetivo      DATE NOT NULL,
    demanda_predicha    DECIMAL(12,2) NOT NULL,
    modelo              VARCHAR(100) NOT NULL,

    CONSTRAINT fk_prediccion_producto
        FOREIGN KEY (codigo)
        REFERENCES productos(codigo)
        ON DELETE CASCADE,

    CONSTRAINT chk_demanda_predicha
        CHECK (demanda_predicha >= 0)
);


-- ============================================================
-- 8. RECOMENDACIONES
--
-- Resultado generado a partir de:
--
-- • Predicciones
-- • Stock actual
-- • Stock mínimo
-- • Historial de ventas
-- • Reglas de negocio
--
-- Ejemplo:
-- "Se recomienda reponer 20 unidades de Coca-Cola."
-- ============================================================

CREATE TABLE recomendaciones (
    id_recomendacion    SERIAL PRIMARY KEY,
    codigo              VARCHAR(50) NOT NULL,
    fecha               TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tipo                VARCHAR(50) NOT NULL,
    mensaje             TEXT NOT NULL,
    prioridad           VARCHAR(20),

    CONSTRAINT fk_recomendacion_producto
        FOREIGN KEY (codigo)
        REFERENCES productos(codigo)
        ON DELETE CASCADE,

    CONSTRAINT chk_prioridad
        CHECK (prioridad IN ('BAJA', 'MEDIA', 'ALTA'))
);

-- ============================================================
-- 9. USUARIOS Y ROLES
-- ============================================================

CREATE TABLE roles (
    id_rol          SERIAL PRIMARY KEY,
    nombre          VARCHAR(50) NOT NULL UNIQUE,  -- 'ADMIN', 'TRABAJADOR'
    descripcion     VARCHAR(255)
);

CREATE TABLE usuarios (
    id_usuario      SERIAL PRIMARY KEY,
    nombre          VARCHAR(100) NOT NULL,
    email           VARCHAR(150) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    id_rol          INTEGER NOT NULL,
    activo          BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_usuario_rol
        FOREIGN KEY (id_rol)
        REFERENCES roles(id_rol)
);

-- Insertar roles
INSERT INTO base_datos.roles (nombre, descripcion)
VALUES
('Administrador', 'Acceso completo al sistema'),
('Usuario', 'Acceso a las funciones operativas del sistema');

-- ============================================================
-- 10. PROVEEDORES
--
-- nombre_comercial:
-- Nombre utilizado normalmente por el minimarket.
--
-- razon_social:
-- Nombre legal que aparece en la factura.
--
-- rut:
-- RUT de la empresa o persona que emite la factura.
-- ============================================================

CREATE TABLE proveedores (
    id_proveedor SERIAL PRIMARY KEY,
    nombre_comercial VARCHAR(150) NOT NULL,
    razon_social VARCHAR(200),
    rut VARCHAR(20) UNIQUE,
    telefono VARCHAR(30),
    email VARCHAR(150),
    direccion VARCHAR(255),
    -- creación campo de tiempo de entrega del proveedor
    tiempo_entrega_dias INTEGER DEFAULT 7,

    CONSTRAINT chk_tiempo_entrega_proveedor
        CHECK (
            tiempo_entrega_dias IS NULL
            OR tiempo_entrega_dias > 0
        )
);


-- ============================================================
-- PROVEEDORES INICIALES DEL MINIMARKET LOS TRES
-- ============================================================

INSERT INTO base_datos.proveedores
(
    nombre_comercial,
    razon_social,
    rut,
    telefono,
    email,
    direccion,
    tiempo_entrega_dias
)
VALUES
    ('Agrosuper', 'Agrosuper Comercializadora de Alimentos Limitada', '79.084.240-3', '6006007777', 'contacto@agrosuperventas.com', 'Ruta 5 Sur Servicio 1471, Puerto Montt', 7),
    ('ICB', 'ICB S.A.', '77.965.620-9', '966490324', 'ccc@icbfs.cl', 'Camino Tepual, Km 3, Parcela 9, Bodegas 5 y 6, Puerto Montt.', 7),
    ('Marino', 'Comercial e Inversiones Marino SpA', '77.814.271-6', '996943286', NULL, 'Lt 1 a la Vara Senda Sur, Puerto Montt', 7),
    ('Evercrisp', 'Evercrisp Snack Productos de Chile S.A.', '94.528.000-K', '800395176', 'joychilefoods@pepsico.com', 'Cardonal - Lotes 3 y 4, Puerto Montt', 7),
    ('MIK', 'Comercial MIK Ltda.', '77.619.710-6', '642207570', 'mik@telsur.cl', 'Juan de Dios Angulo #614, Osorno', 7),
    ('Allendes Hnos', 'Sociedad Comercial Allendes Hermanos Limitada', '77.784.000-2', '932684021', 'ventas@allendeshnos.cl', 'Parque Espacio Puerto, Bodega 7, Ruta 5 Sur, Lote 6, Km 117.5, Sector Chinchin, Puerto Montt.', 7),
    ('San Mateo', 'Comercial San Mateo SpA', '76.845.766-2', '994509309', 'ventas@comercialsanmateo.cl', 'Los Pellines #158, Presidente Ibáñez, Puerto Montt', 7),
    ('Coca-Cola', 'Coca-Cola Embonor S.A.', '93.281.000-K', '652321590', 'clientes@embonor.cl', 'Panamericana Norte 4500, Puerto Montt', 7),
    ('Mödinger Hermanos', 'Mödinger Hermanos Sociedad Anónima', '80.634.800-7', '652242650', 'modinger@modinger.cl', 'Av. Vicente Pérez Rosales 901, Llanquihue', 7),
    ('PF', 'Productos Fernández S.A.', '91.004.000-6', '71224430', 'contacto@pfalimentos.cl', 'Ruta 5 Sur, Km. 1025, Sector Alto Bonito ,Puerto Montt', 7),
    ('Candy Mascotas', 'Candy Mascotas SpA', '77.692.254-4', NULL, 'mauro_1609@hotmail.com', 'Pasaje Lonco Queipul 2520, Parque Fundadores, Puerto Montt.', 7),
    ('Ideal', 'Ideal S.A.', '82.623.500-4', '226758200', 'patricia.carmen@grupobimbo.com', 'Ruta 226 Km 3, Parcela 6, Bodega 5 y 6, Puerto Montt.', 7),
    ('Almonacid', 'Almonacid SpA', '77.645.932-1', '432351492', 'contacto@almonacid.cl', 'Avenida Las Industrias 13850, Bodega 1, Los Ángeles', 7),
    ('Mi Librería', 'Soc. Comercial Mi Librería Limitada', '76.118.130-0', '652508056', 'milibrerialtda@gmail.com', 'Egaña 121, Puerto Montt', 7),
    ('Sobo', 'Distribuidora y Servicios Logísticos Sobo SpA', '78.003.696-6', '56923840620', 'contacto@sobospa.cl', 'Freire 1249, Osorno', 7),
    ('Empresas Vican', 'María Andrea Rehbein González', '12.999.115-1', '945229054', NULL, 'Benjamín Franklin #2344, Sector Portal, Puerto Montt.', 7),
    ('Cecinas Ancud', 'Sociedad Comercial Cecinas Ancud Ltda.', '78.586.430-1', '966074305', 'contacto@cecinasancud.cl', 'Bima 36, Parque Industrial, Puerto Montt.', 7),
    ('Agrocomercial Codigua', 'Agrocomercial Codigua SpA', '77.471.270-4', '225847461', NULL, 'Suecia 0142, Oficina 1101, Piso 11, Providencia', 7),
    ('Nestlé', 'Nestlé Chile S.A.', '90.703.000-8', '957287613', 'mario.pulgar1@cl.nestle.com.', 'Ruta 226, Km 4, Lagunita Lote 1, Puerto Montt', 7),
    ('Comercial El Bosque', 'Comercial El Bosque SpA', NULL, '976122052', 'com.elbosque@hotmail.com', 'San Francisco 1070 Of. 14, Puerto Varas', 7),
    ('Dimak', 'Distribuidora y Comercial Dimak Limitada', '78.809.560-0', '953191577', 'ventas@dimak.cl', 'Camino Puerto Octay 1191, Osorno', 7),
    ('Comercial Itzel', 'Comercial Itzel SpA', '76.976.409-7', '56953690161', 'marceloparedes254@gmail.com', 'Ruta U V 617 Parcela 28 Colonia La Poza LT 28, Puerto Varas', 7),
    ('Arcor', 'Comercial Aldo Patricio Balkenhol Flores SpA', '76.803.580-6', '652721648', 'combalkenhol@gmail.com', 'Parcela Nº 2, Pasaje Harry Beyer, Sector Lagunitas, Puerto Montt.', 7),
    ('Soprole', 'Comercial Santa Elena S.A.', '84.472.400-4', '652253539', NULL, 'Ruta 5 Sur, Km 1.025 sector Alto Bonito, Puerto Montt', 7),
    ('Cecinas Río Frío', 'José Renato Andrade Pérez', '9.226.728-8', '994726023', 'ventas@cecinasriofrio.cl', 'Km 14 Camino a Fresia, Los Muermos', 14),
    ('Comercial Los Muermos', 'Comercializadora Los Muermos SpA', '77.833.765-7', NULL, 'comerciallosmuermos@gmail.com', 'Manío Cululil LT 4-B, Los Muermos.', 7),
    ('Sofilim', 'Sofilim SpA', '77.383.217-K', '98479 8818', 'facturas@sofilim.cl', 'Av. El Tepual 1360, Local 12, Puerto Montt', 7),
    ('Waldemar Barría', 'Waldemar Alfonso Barría Arellano', '16.934.044-7', '652311551', 'acgyt.osorio@gmail.com', 'Pje Manquehue, 1243 Puerto Montt, Los Lagos', 7),
    ('Fundo El Peumo', 'Comercializadora y Distribuidora Pizarro y Hermanos Ltda.', '76.131.587-0', '954038743', 'consultas@fundoelpeumo.cl', 'Ruta 226, El Tepual s/n, Cordonal Bajo, Puerto Montt', 7),
    ('Espol', 'Espol S.A.', '84.398.200-K', '800201555', 'contacto@espol.cl', 'León Gallo 0450, Temuco', 7),
    ('HN', 'Sociedad Comercial y Distribuidora HN Limitada', '76.603.980-4', '652435854', 'hn_ltda@hotmail.com', 'Lote Campanillas, Parcela 11, Bodegas 1 y 2, Sector Chin Chin, Puerto Montt', 7),
    ('CCU', 'Comercial CCU S.A.', '99.554.560-8', '6004502502', NULL, 'Bima 195, Puerto Montt.', 7);

-- ============================================================
-- RELACIÓN PRODUCTO - PROVEEDOR
--
-- Un producto puede tener más de un proveedor.
-- Un proveedor puede suministrar varios productos.
-- ============================================================

CREATE TABLE producto_proveedor (

    codigo          VARCHAR(50) NOT NULL,
    id_proveedor    INTEGER NOT NULL,

    PRIMARY KEY (
        codigo,
        id_proveedor
    ),

    CONSTRAINT fk_pp_producto
        FOREIGN KEY (codigo)
        REFERENCES productos(codigo)
        ON DELETE CASCADE,

    CONSTRAINT fk_pp_proveedor
        FOREIGN KEY (id_proveedor)
        REFERENCES proveedores(id_proveedor)
        ON DELETE CASCADE

);

-- ============================================================
-- 11. VENCIMIENTOS
-- ============================================================

CREATE TABLE lotes_vencimiento (
    id_lote         SERIAL PRIMARY KEY,
    codigo          VARCHAR(50) NOT NULL,
    cantidad        INTEGER NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    fecha_ingreso   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_lote_producto
        FOREIGN KEY (codigo)
        REFERENCES productos(codigo)
        ON DELETE CASCADE,

    CONSTRAINT chk_cantidad_lote
        CHECK (cantidad >= 0)
);


-- ============================================================
-- 12. ÍNDICES
-- Ayudan a acelerar consultas frecuentes.
-- ============================================================

CREATE INDEX idx_ventas_fecha
    ON ventas(fecha_hora);

CREATE INDEX idx_detalle_codigo
    ON detalle_venta(codigo);

CREATE INDEX idx_detalle_id_venta
    ON detalle_venta(id_venta);

CREATE INDEX idx_movimientos_codigo
    ON movimientos_inventario(codigo);

CREATE INDEX idx_movimientos_fecha
    ON movimientos_inventario(fecha_hora);

CREATE INDEX idx_predicciones_codigo
    ON predicciones(codigo);

CREATE INDEX idx_predicciones_fecha_objetivo
    ON predicciones(fecha_objetivo);

CREATE INDEX idx_recomendaciones_codigo
    ON recomendaciones(codigo);

CREATE INDEX idx_recomendaciones_fecha
    ON recomendaciones(fecha);
	
CREATE INDEX idx_lotes_codigo
    ON lotes_vencimiento(codigo);

CREATE INDEX idx_lotes_fecha_vencimiento
    ON lotes_vencimiento(fecha_vencimiento);

CREATE INDEX idx_pp_proveedor
    ON producto_proveedor(id_proveedor);

CREATE INDEX idx_usuarios_email
    ON usuarios(email);

-- FIN DEL SCHEMA
