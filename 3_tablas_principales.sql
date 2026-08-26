-- ============================================================================
-- PLATAFORMA CLM — Las 3 tablas más importantes del modelo
-- PostgreSQL 15+
-- ----------------------------------------------------------------------------
-- empresa_cliente  -> quién es el dueño de los datos (multi-tenant)
-- contrato         -> la transacción principal (máquina de estados)
-- clausula         -> el contenido del contrato (bloqueo optimista)
--
-- NOTA: en el diseño completo, "contrato" también referencia a "usuario"
-- (quién lo creó) y "plantilla_contrato" (de qué molde salió). Como este
-- archivo es autocontenido, esas columnas se dejan como UUID simples (sin
-- FOREIGN KEY) y se marcan con un comentario "-- FK externa". Si más
-- adelante agregas la tabla usuario, solo tienes que añadir la restricción.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE estado_contrato AS ENUM (
    'Borrador',
    'Negociacion',
    'Validez_Legal',
    'Anulado',
    'Expirado'
);


-- ============================================================================
-- 1. empresa_cliente
-- ============================================================================
-- Es la tabla raíz. Cada fila es un cliente (tenant) de la plataforma.
-- Todo lo demás en el sistema "cuelga" de una empresa a través de
-- id_empresa, para que los datos de un cliente nunca se mezclen con los
-- de otro.
CREATE TABLE empresa_cliente (
    id_empresa       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    razon_social     VARCHAR(255) NOT NULL,
    nit              VARCHAR(50)  NOT NULL,
    direccion_fiscal TEXT,
    pais             VARCHAR(100) NOT NULL,
    fecha_registro   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    activo           BOOLEAN      NOT NULL DEFAULT true,

    CONSTRAINT uq_empresa_nit UNIQUE (nit)
);


-- ============================================================================
-- 2. contrato
-- ============================================================================
CREATE TABLE contrato (
    id_contrato            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_empresa             UUID NOT NULL REFERENCES empresa_cliente (id_empresa) ON DELETE CASCADE,
    id_plantilla           UUID,                    -- FK externa a plantilla_contrato (fuera de este archivo)
    titulo                 VARCHAR(255) NOT NULL,
    contraparte_nombre     VARCHAR(255) NOT NULL,   -- el tercero externo con el que se contrata
    estado                 estado_contrato NOT NULL DEFAULT 'Borrador',
    fecha_inicio_vigencia  DATE,
    fecha_fin_vigencia     DATE,
    valor_contrato         NUMERIC(18, 2),
    moneda                 CHAR(3),
    creado_por             UUID NOT NULL,           -- FK externa a usuario (fuera de este archivo)
    responsable_actual     UUID,                    -- FK externa a usuario (fuera de este archivo)
    firma_pki_hash         TEXT,
    firma_pki_fecha        TIMESTAMPTZ,
    version                INT NOT NULL DEFAULT 1,
    fecha_creacion         TIMESTAMPTZ NOT NULL DEFAULT now(),
    fecha_actualizacion    TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_vigencia_coherente
        CHECK (fecha_fin_vigencia IS NULL OR fecha_inicio_vigencia IS NULL
               OR fecha_fin_vigencia > fecha_inicio_vigencia),

    CONSTRAINT chk_validez_legal_requiere_firma
        CHECK (estado <> 'Validez_Legal' OR firma_pki_hash IS NOT NULL)
);

CREATE INDEX idx_contrato_empresa ON contrato (id_empresa);
CREATE INDEX idx_contrato_estado ON contrato (estado);
CREATE INDEX idx_contrato_vigencia ON contrato (fecha_fin_vigencia);
CREATE INDEX idx_contrato_empresa_estado ON contrato (id_empresa, estado);

-- Actualiza fecha_actualizacion automáticamente en cada UPDATE
CREATE OR REPLACE FUNCTION fn_actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_contrato_timestamp
    BEFORE UPDATE ON contrato
    FOR EACH ROW
    EXECUTE FUNCTION fn_actualizar_timestamp();

-- Máquina de estados: solo permite las transiciones válidas del negocio
CREATE OR REPLACE FUNCTION fn_validar_transicion_estado()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.estado = NEW.estado THEN
        RETURN NEW;
    END IF;

    IF NOT (
        (OLD.estado = 'Borrador'       AND NEW.estado IN ('Negociacion', 'Anulado')) OR
        (OLD.estado = 'Negociacion'    AND NEW.estado IN ('Validez_Legal', 'Anulado', 'Borrador')) OR
        (OLD.estado = 'Validez_Legal'  AND NEW.estado IN ('Expirado', 'Anulado'))
    ) THEN
        RAISE EXCEPTION 'Transición de estado no permitida: % -> %', OLD.estado, NEW.estado;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_contrato_transicion_estado
    BEFORE UPDATE OF estado ON contrato
    FOR EACH ROW
    EXECUTE FUNCTION fn_validar_transicion_estado();


-- ============================================================================
-- 3. clausula
-- ============================================================================
CREATE TABLE clausula (
    id_clausula         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_contrato         UUID NOT NULL REFERENCES contrato (id_contrato) ON DELETE CASCADE,
    orden               INT NOT NULL,
    titulo              VARCHAR(255) NOT NULL,
    contenido           TEXT NOT NULL,
    tipo_clausula       VARCHAR(100) NOT NULL DEFAULT 'estandar',
    es_modificable      BOOLEAN NOT NULL DEFAULT true,
    version             INT NOT NULL DEFAULT 1,
    modificado_por      UUID,                        -- FK externa a usuario (fuera de este archivo)
    fecha_modificacion  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_clausula_orden UNIQUE (id_contrato, orden)
);

CREATE INDEX idx_clausula_contrato ON clausula (id_contrato);

-- Bloqueo optimista + protección de cláusulas no modificables
CREATE OR REPLACE FUNCTION fn_clausula_bloqueo_optimista()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.es_modificable = false AND OLD.contenido IS DISTINCT FROM NEW.contenido THEN
        RAISE EXCEPTION 'La cláusula % no es modificable', OLD.id_clausula;
    END IF;
    NEW.fecha_modificacion := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_clausula_bloqueo_optimista
    BEFORE UPDATE ON clausula
    FOR EACH ROW
    EXECUTE FUNCTION fn_clausula_bloqueo_optimista();

-- ============================================================================
-- FIN
-- ============================================================================
