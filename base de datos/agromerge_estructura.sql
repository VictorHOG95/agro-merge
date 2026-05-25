Use agro_merge_db;

-- ================================================================
--  AGROMERGE — Sistema Web de Comercialización
--  Estructura completa de la Base de Datos
--  Motor    : MySQL 8.0+
--  Charset  : utf8mb4 / utf8mb4_unicode_ci
--  Engine   : InnoDB
-- ================================================================

DROP DATABASE IF EXISTS agromerge;


-- ================================================================
-- TABLA 1: usuarios
-- Almacena los tres roles del sistema: comprador, vendedor, admin
-- ================================================================
CREATE TABLE usuarios (
  id_usuario       INT            NOT NULL AUTO_INCREMENT,
  nombre           VARCHAR(100)   NOT NULL,
  email            VARCHAR(150)   NOT NULL,
  contrasena       VARCHAR(255)   NOT NULL,
  foto_perfil      VARCHAR(255)       NULL DEFAULT NULL,
  rol              ENUM(
                     'comprador',
                     'vendedor',
                     'admin'
                   )              NOT NULL DEFAULT 'comprador',
  estado           ENUM(
                     'activo',
                     'inactivo'
                   )              NOT NULL DEFAULT 'activo',
  fecha_registro   DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id_usuario),
  UNIQUE  KEY uq_usuarios_email (email),
  INDEX   idx_usuarios_rol       (rol),
  INDEX   idx_usuarios_estado    (estado)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Usuarios del sistema: compradores, vendedores y administradores';


-- ================================================================
-- TABLA 2: vendedores
-- Perfil extendido del usuario con rol = vendedor
-- Relación: usuarios (1) ──── (1) vendedores
-- ================================================================
CREATE TABLE vendedores (
  id_vendedor      INT            NOT NULL AUTO_INCREMENT,
  id_usuario       INT            NOT NULL,
  nombre_tienda    VARCHAR(150)   NOT NULL,
  descripcion      TEXT               NULL DEFAULT NULL,
  telefono         VARCHAR(20)        NULL DEFAULT NULL,

  PRIMARY KEY (id_vendedor),
  UNIQUE  KEY uq_vendedores_usuario (id_usuario),
  INDEX   idx_vendedores_tienda     (nombre_tienda),

  CONSTRAINT fk_vendedores_usuario
    FOREIGN KEY (id_usuario)
    REFERENCES  usuarios (id_usuario)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Perfil de tienda de cada vendedor registrado';


-- ================================================================
-- TABLA 3: categorias
-- Clasificación de productos agrícolas
-- ================================================================
CREATE TABLE categorias (
  id_categoria     INT            NOT NULL AUTO_INCREMENT,
  nombre           VARCHAR(100)   NOT NULL,
  descripcion      TEXT               NULL DEFAULT NULL,

  PRIMARY KEY (id_categoria),
  UNIQUE  KEY uq_categorias_nombre (nombre)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Categorías para clasificar los productos del catálogo';


-- ================================================================
-- TABLA 4: productos
-- Publicados por vendedores y aprobados por administradores
-- Relaciones:
--   vendedores  (1) ──── (N) productos
--   categorias  (1) ──── (N) productos
-- ================================================================
CREATE TABLE productos (
  id_producto       INT             NOT NULL AUTO_INCREMENT,
  id_vendedor       INT             NOT NULL,
  id_categoria      INT                 NULL DEFAULT NULL,
  nombre            VARCHAR(200)    NOT NULL,
  descripcion       TEXT                NULL DEFAULT NULL,
  precio            DECIMAL(10,2)   NOT NULL,
  stock             INT             NOT NULL DEFAULT 0,
  imagen            VARCHAR(255)        NULL DEFAULT NULL,
  estado            ENUM(
                      'borrador',
                      'pendiente',
                      'aprobado',
                      'rechazado',
                      'inactivo'
                    )               NOT NULL DEFAULT 'borrador',
  fecha_publicacion DATETIME            NULL DEFAULT NULL,
  fecha_creacion    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id_producto),
  INDEX idx_productos_vendedor  (id_vendedor),
  INDEX idx_productos_categoria (id_categoria),
  INDEX idx_productos_estado    (estado),
  INDEX idx_productos_precio    (precio),

  CONSTRAINT fk_productos_vendedor
    FOREIGN KEY (id_vendedor)
    REFERENCES  vendedores (id_vendedor)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT fk_productos_categoria
    FOREIGN KEY (id_categoria)
    REFERENCES  categorias (id_categoria)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Productos publicados por vendedores en el catálogo';


-- ================================================================
-- TABLA 5: carrito
-- Un carrito activo por usuario comprador
-- Relación: usuarios (1) ──── (1) carrito
-- ================================================================
CREATE TABLE carrito (
  id_carrito       INT            NOT NULL AUTO_INCREMENT,
  id_usuario       INT            NOT NULL,
  fecha_creacion   DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id_carrito),
  UNIQUE  KEY uq_carrito_usuario (id_usuario),

  CONSTRAINT fk_carrito_usuario
    FOREIGN KEY (id_usuario)
    REFERENCES  usuarios (id_usuario)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Carrito de compras activo por cada usuario';


-- ================================================================
-- TABLA 6: detalle_carrito
-- Productos dentro del carrito (tabla pivote carrito ↔ productos)
-- Relaciones:
--   carrito   (1) ──── (N) detalle_carrito
--   productos (1) ──── (N) detalle_carrito
-- ================================================================
CREATE TABLE detalle_carrito (
  id_detalle_carrito INT            NOT NULL AUTO_INCREMENT,
  id_carrito         INT            NOT NULL,
  id_producto        INT            NOT NULL,
  cantidad           INT            NOT NULL DEFAULT 1,
  precio_unitario    DECIMAL(10,2)  NOT NULL,

  PRIMARY KEY (id_detalle_carrito),
  UNIQUE  KEY uq_detcarrito_item      (id_carrito, id_producto),
  INDEX   idx_detcarrito_producto     (id_producto),

  CONSTRAINT fk_detcarrito_carrito
    FOREIGN KEY (id_carrito)
    REFERENCES  carrito (id_carrito)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT fk_detcarrito_producto
    FOREIGN KEY (id_producto)
    REFERENCES  productos (id_producto)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT chk_detcarrito_cantidad
    CHECK (cantidad > 0)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Ítems dentro del carrito de compras';


-- ================================================================
-- TABLA 7: pedidos
-- Generados cuando el comprador confirma su carrito
-- Relación: usuarios (1) ──── (N) pedidos
-- ================================================================
CREATE TABLE pedidos (
  id_pedido          INT             NOT NULL AUTO_INCREMENT,
  id_comprador       INT             NOT NULL,
  estado             ENUM(
                       'pendiente',
                       'confirmado',
                       'enviado',
                       'entregado',
                       'cancelado'
                     )               NOT NULL DEFAULT 'pendiente',
  total              DECIMAL(10,2)   NOT NULL,
  direccion_entrega  VARCHAR(255)    NOT NULL,
  fecha_pedido       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id_pedido),
  INDEX idx_pedidos_comprador (id_comprador),
  INDEX idx_pedidos_estado    (estado),
  INDEX idx_pedidos_fecha     (fecha_pedido),

  CONSTRAINT fk_pedidos_comprador
    FOREIGN KEY (id_comprador)
    REFERENCES  usuarios (id_usuario)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Pedidos realizados por los compradores';


-- ================================================================
-- TABLA 8: detalle_pedido
-- Productos incluidos en cada pedido (tabla pivote pedidos ↔ productos)
-- Relaciones:
--   pedidos   (1) ──── (N) detalle_pedido
--   productos (1) ──── (N) detalle_pedido
-- ================================================================
CREATE TABLE detalle_pedido (
  id_detalle        INT             NOT NULL AUTO_INCREMENT,
  id_pedido         INT             NOT NULL,
  id_producto       INT             NOT NULL,
  cantidad          INT             NOT NULL,
  precio_unitario   DECIMAL(10,2)   NOT NULL,

  PRIMARY KEY (id_detalle),
  INDEX idx_detpedido_pedido   (id_pedido),
  INDEX idx_detpedido_producto (id_producto),

  CONSTRAINT fk_detpedido_pedido
    FOREIGN KEY (id_pedido)
    REFERENCES  pedidos (id_pedido)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT fk_detpedido_producto
    FOREIGN KEY (id_producto)
    REFERENCES  productos (id_producto)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,

  CONSTRAINT chk_detpedido_cantidad
    CHECK (cantidad > 0)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Detalle de productos incluidos en cada pedido';


-- ================================================================
-- TABLA 9: pagos
-- Registro del pago asociado a un pedido
-- Relación: pedidos (1) ──── (1) pagos
-- ================================================================
CREATE TABLE pagos (
  id_pago           INT             NOT NULL AUTO_INCREMENT,
  id_pedido         INT             NOT NULL,
  metodo_pago       VARCHAR(50)     NOT NULL,
  estado_pago       ENUM(
                      'pendiente',
                      'completado',
                      'fallido'
                    )               NOT NULL DEFAULT 'pendiente',
  monto             DECIMAL(10,2)   NOT NULL,
  fecha_pago        DATETIME            NULL DEFAULT NULL,

  PRIMARY KEY (id_pago),
  UNIQUE  KEY uq_pagos_pedido    (id_pedido),
  INDEX   idx_pagos_estado       (estado_pago),
  INDEX   idx_pagos_fecha        (fecha_pago),

  CONSTRAINT fk_pagos_pedido
    FOREIGN KEY (id_pedido)
    REFERENCES  pedidos (id_pedido)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Registros de pago vinculados a cada pedido';


-- ================================================================
-- TABLA 10: notificaciones
-- Mensajes enviados a compradores y vendedores por el sistema
-- Relación: usuarios (1) ──── (N) notificaciones
-- ================================================================
CREATE TABLE notificaciones (
  id_notificacion   INT             NOT NULL AUTO_INCREMENT,
  id_usuario        INT             NOT NULL,
  mensaje           TEXT            NOT NULL,
  tipo              VARCHAR(50)     NOT NULL
                    COMMENT 'pedido | aprobacion | rechazo | pago | sistema',
  leida             TINYINT(1)      NOT NULL DEFAULT 0,
  fecha             DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id_notificacion),
  INDEX idx_notif_usuario (id_usuario),
  INDEX idx_notif_leida   (leida),
  INDEX idx_notif_fecha   (fecha),

  CONSTRAINT fk_notif_usuario
    FOREIGN KEY (id_usuario)
    REFERENCES  usuarios (id_usuario)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Notificaciones del sistema para usuarios';


-- ================================================================
-- DATOS INICIALES
-- ================================================================

-- Categorías base para productos agrícolas
INSERT INTO categorias (nombre, descripcion) VALUES
  ('Frutas',      'Frutas frescas de temporada y cultivo orgánico'),
  ('Verduras',    'Verduras y hortalizas de huerta propia'),
  ('Granos',      'Cereales, legumbres y semillas'),
  ('Lácteos',     'Productos lácteos artesanales del campo'),
  ('Carnes',      'Carnes frescas y derivados'),
  ('Procesados',  'Productos agrícolas procesados y conservas');

-- Usuario administrador por defecto
-- IMPORTANTE: reemplazar el hash por uno generado con bcrypt en producción
INSERT INTO usuarios (nombre, email, contrasena, rol, estado) VALUES
  ('Administrador', 'admin@agromerge.com',
   '$2b$12$REEMPLAZAR_CON_HASH_BCRYPT', 'admin', 'activo');
   
   USE agro_merge_db;
ALTER TABLE usuarios ADD codigo_verificacion VARCHAR(4) NULL;


-- ================================================================
-- RESUMEN DE RELACIONES
-- ================================================================
--
--  usuarios        (1) ──── (1)  vendedores
--  usuarios        (1) ──── (1)  carrito
--  usuarios        (1) ──── (N)  pedidos
--  usuarios        (1) ──── (N)  notificaciones
--  vendedores      (1) ──── (N)  productos
--  categorias      (1) ──── (N)  productos
--  carrito         (1) ──── (N)  detalle_carrito
--  productos       (1) ──── (N)  detalle_carrito
--  productos       (1) ──── (N)  detalle_pedido
--  pedidos         (1) ──── (N)  detalle_pedido
--  pedidos         (1) ──── (1)  pagos
--
-- ================================================================
-- FIN DEL SCRIPT — agromerge v1.0
-- ================================================================
