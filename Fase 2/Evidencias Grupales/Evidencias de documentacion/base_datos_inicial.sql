-- TRESSTOCK - BASE DE DATOS
-- PostgreSQL

-- 0. SCHEMA
DROP SCHEMA base_datos CASCADE;
CREATE SCHEMA IF NOT EXISTS base_datos
    AUTHORIZATION postgres;

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
-- ============================================================

CREATE TABLE productos (
    codigo          VARCHAR(50) PRIMARY KEY,
    cod_barra       VARCHAR(50),
    descripcion     VARCHAR(255) NOT NULL,
    familia         VARCHAR(100),
    precio_publico  DECIMAL(12,2) NOT NULL DEFAULT 0,

    CONSTRAINT chk_precio_publico
        CHECK (precio_publico >= 0)
);


-- ============================================================
-- 2. VENTAS
--
-- Representa una boleta/venta.
-- Una venta puede contener varios productos.
-- ============================================================

CREATE TABLE ventas (
    id_venta        SERIAL PRIMARY KEY,
    boleta          VARCHAR(50) NOT NULL,
    fecha_hora      TIMESTAMP NOT NULL,
    total           DECIMAL(12,2) NOT NULL DEFAULT 0,

    CONSTRAINT uq_venta_boleta
        UNIQUE (boleta),

    CONSTRAINT chk_total_venta
        CHECK (total >= 0)
);


-- ============================================================
-- 3. DETALLE DE VENTA
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
    cantidad        INTEGER NOT NULL,
    valorizado      DECIMAL(12,2) NOT NULL,

    CONSTRAINT fk_detalle_venta
        FOREIGN KEY (id_venta)
        REFERENCES ventas(id_venta)
        ON DELETE CASCADE,

    CONSTRAINT fk_detalle_producto
        FOREIGN KEY (codigo)
        REFERENCES productos(codigo),

    CONSTRAINT chk_cantidad_positiva
        CHECK (cantidad > 0),

    CONSTRAINT chk_precio_detalle
        CHECK (precio >= 0),

    CONSTRAINT chk_valorizado_detalle
        CHECK (valorizado >= 0)
);


-- ============================================================
-- 4. INVENTARIO
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


-- ============================================================
-- 5. MOVIMIENTOS DE INVENTARIO
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
-- 6. PREDICCIONES
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
-- 7. RECOMENDACIONES
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
-- 8. USUARIOS Y ROLES
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

-- ============================================================
-- 9. PROVEEDORES
-- ============================================================

CREATE TABLE proveedores (
    id_proveedor    SERIAL PRIMARY KEY,
    nombre          VARCHAR(150) NOT NULL,
    telefono        VARCHAR(30),
    email           VARCHAR(150),
    direccion       VARCHAR(255)
);

-- Relación producto-proveedor (un producto puede tener más de un proveedor)
CREATE TABLE producto_proveedor (
    codigo          VARCHAR(50) NOT NULL,
    id_proveedor    INTEGER NOT NULL,

    PRIMARY KEY (codigo, id_proveedor),

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
-- 10. VENCIMIENTOS
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
-- 11. ÍNDICES
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
