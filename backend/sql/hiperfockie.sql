
DROP DATABASE IF EXISTS hiperfockie;
CREATE DATABASE hiperfockie
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;   -- sin distinguir mayúsculas ni acentos

USE hiperfockie;

CREATE TABLE usuarios (
  id                 INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  nombre             VARCHAR(80)       NOT NULL,
  correo             VARCHAR(120)      NOT NULL,
  password_hash      CHAR(60)          NOT NULL,
  acepto_aviso_en    DATETIME          NOT NULL,           -- RQF2
  intentos_fallidos  TINYINT UNSIGNED  NOT NULL DEFAULT 0,
  bloqueado_hasta    DATETIME          NULL,
  creado_en          DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_usuarios        PRIMARY KEY (id),
  CONSTRAINT uq_usuarios_correo UNIQUE (correo),
  CONSTRAINT ck_usuarios_nombre CHECK (CHAR_LENGTH(TRIM(nombre)) > 0),
  CONSTRAINT ck_usuarios_correo CHECK (correo LIKE '%_@_%._%')
) ENGINE = InnoDB;

CREATE TABLE tokens_recuperacion (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  usuario_id  INT UNSIGNED  NOT NULL,
  token_hash  CHAR(64)      NOT NULL,
  expira_en   DATETIME      NOT NULL,
  usado       BOOLEAN       NOT NULL DEFAULT FALSE,
  creado_en   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_tokens            PRIMARY KEY (id),
  CONSTRAINT uq_tokens_hash       UNIQUE (token_hash),
  CONSTRAINT fk_tokens_usuario    FOREIGN KEY (usuario_id)
    REFERENCES usuarios (id) ON DELETE CASCADE
) ENGINE = InnoDB;

CREATE TABLE focos (
  id          INT UNSIGNED                  NOT NULL AUTO_INCREMENT,
  usuario_id  INT UNSIGNED                  NOT NULL,
  tema_raiz   VARCHAR(200)                  NOT NULL,       -- RQNF7: 3-200
  estado      ENUM('activo', 'archivado')   NOT NULL DEFAULT 'activo',
  creado_en   DATETIME                      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_focos          PRIMARY KEY (id),
  CONSTRAINT fk_focos_usuario  FOREIGN KEY (usuario_id)
    REFERENCES usuarios (id) ON DELETE CASCADE,
  CONSTRAINT ck_focos_tema     CHECK (CHAR_LENGTH(tema_raiz) BETWEEN 3 AND 200),
  INDEX ix_focos_usuario_estado (usuario_id, estado)
) ENGINE = InnoDB;

CREATE TABLE nodos (
  id           INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  foco_id      INT UNSIGNED      NOT NULL,
  padre_id     INT UNSIGNED      NULL,
  titulo       VARCHAR(255)      NOT NULL,
  fuente       VARCHAR(20)       NOT NULL,
  url          VARCHAR(500)      NOT NULL,
  extracto     TEXT              NULL,                      -- extracto de la fuente, nunca IA (RN4)
  licencia     VARCHAR(60)       NOT NULL,                  -- RQNF22
  puntaje      DECIMAL(3,2)      NOT NULL DEFAULT 0.00,
  nivel        TINYINT UNSIGNED  NOT NULL DEFAULT 1,
  visitado_en  DATETIME          NULL,                      -- NULL = sugerido, aún no visitado
  CONSTRAINT pk_nodos          PRIMARY KEY (id),
  CONSTRAINT fk_nodos_foco     FOREIGN KEY (foco_id)
    REFERENCES focos (id) ON DELETE CASCADE,
  CONSTRAINT fk_nodos_padre    FOREIGN KEY (padre_id)
    REFERENCES nodos (id) ON DELETE CASCADE,
  CONSTRAINT ck_nodos_fuente   CHECK (fuente IN ('wikipedia', 'openalex', 'openlibrary')),  -- lista blanca (RQNF23)
  CONSTRAINT ck_nodos_puntaje  CHECK (puntaje BETWEEN 0 AND 1),
  CONSTRAINT ck_nodos_nivel    CHECK (nivel BETWEEN 1 AND 5),
  CONSTRAINT ck_nodos_raiz     CHECK ((padre_id IS NULL AND nivel = 1)
                                   OR (padre_id IS NOT NULL AND nivel > 1)),
  INDEX ix_nodos_foco_nivel (foco_id, nivel),             -- /api/focos/:id/arbol
  INDEX ix_nodos_padre      (padre_id),                   -- subtemas de un nodo
  INDEX ix_nodos_foco_url   (foco_id, url(191))           -- ¿ya visitado? (novedad = 0)
) ENGINE = InnoDB;

CREATE TABLE notas (
  id              INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  nodo_id         INT UNSIGNED  NOT NULL,
  usuario_id      INT UNSIGNED  NOT NULL,
  texto           TEXT          NOT NULL,
  creado_en       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en  DATETIME      NULL ON UPDATE CURRENT_TIMESTAMP,  -- para "editar" (RQF20)
  CONSTRAINT pk_notas          PRIMARY KEY (id),
  CONSTRAINT fk_notas_nodo     FOREIGN KEY (nodo_id)
    REFERENCES nodos (id) ON DELETE CASCADE,
  CONSTRAINT fk_notas_usuario  FOREIGN KEY (usuario_id)
    REFERENCES usuarios (id) ON DELETE CASCADE,
  CONSTRAINT ck_notas_texto    CHECK (CHAR_LENGTH(TRIM(texto)) > 0),
  INDEX ix_notas_nodo (nodo_id)
) ENGINE = InnoDB;

CREATE TABLE historial (
  id         INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  foco_id    INT UNSIGNED  NOT NULL,
  nodo_id    INT UNSIGNED  NOT NULL,
  orden      INT UNSIGNED  NOT NULL,
  accion     VARCHAR(30)   NOT NULL,
  creado_en  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_historial          PRIMARY KEY (id),
  CONSTRAINT uq_historial_orden    UNIQUE (foco_id, orden),
  CONSTRAINT fk_historial_foco     FOREIGN KEY (foco_id)
    REFERENCES focos (id) ON DELETE CASCADE,
  CONSTRAINT fk_historial_nodo     FOREIGN KEY (nodo_id)
    REFERENCES nodos (id) ON DELETE CASCADE,
  CONSTRAINT ck_historial_accion   CHECK (accion IN ('crear_foco', 'visitar', 'regresar', 'anotar')),
  INDEX ix_historial_nodo (nodo_id)
) ENGINE = InnoDB;

CREATE TABLE cache_api (
  clave_hash      CHAR(64)     NOT NULL,
  fuente          VARCHAR(20)  NOT NULL,
  respuesta_json  JSON         NOT NULL,
  expira_en       DATETIME     NOT NULL,
  creado_en       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_cache_api     PRIMARY KEY (clave_hash),
  CONSTRAINT ck_cache_fuente  CHECK (fuente IN ('wikipedia', 'openalex', 'openlibrary')),
  INDEX ix_cache_expira (expira_en)                       -- limpieza de vencidos
) ENGINE = InnoDB;

CREATE TABLE donaciones (
  id               INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  usuario_id       INT UNSIGNED   NULL,
  paypal_order_id  VARCHAR(40)    NOT NULL,
  monto            DECIMAL(10,2)  NOT NULL,
  estado           VARCHAR(20)    NOT NULL DEFAULT 'CREATED',
  creado_en        DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_donaciones          PRIMARY KEY (id),
  CONSTRAINT uq_donaciones_orden    UNIQUE (paypal_order_id),
  CONSTRAINT fk_donaciones_usuario  FOREIGN KEY (usuario_id)
    REFERENCES usuarios (id) ON DELETE SET NULL,
  CONSTRAINT ck_donaciones_monto    CHECK (monto > 0 AND monto <= 10000),  -- RQNF8 (el servidor valida igual)
  CONSTRAINT ck_donaciones_estado   CHECK (estado IN ('CREATED', 'APPROVED', 'COMPLETED', 'VOIDED', 'FAILED')),
  INDEX ix_donaciones_usuario (usuario_id)
) ENGINE = InnoDB;

