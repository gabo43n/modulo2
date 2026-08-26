-- seed.sql
-- -----------------------------------------------------------------------------
-- Datos de ejemplo para poder ver algo en el visualizador apenas termines de
-- crear las tablas. Ejecutalo DESPUES de 3_tablas_principales.sql, contra la
-- misma base de datos (clm_db).
--
-- Como ejecutarlo (elige una opcion):
--   psql -U postgres -d clm_db -f seed.sql
--   o abrelo con el "Query Tool" de pgAdmin y dale Ejecutar (F5).
-- -----------------------------------------------------------------------------

-- Dos empresas cliente (tenants)
INSERT INTO empresa_cliente (id_empresa, razon_social, nit, direccion_fiscal, pais)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Constructora Andina S.A.', '1234567890', 'Av. Arce 123, La Paz', 'Bolivia'),
  ('22222222-2222-2222-2222-222222222222', 'TechSoluciones SRL',       '0987654321', 'Calle 21 de Calacoto, La Paz', 'Bolivia');

-- Contratos (creado_por/responsable_actual son UUID "sueltos" en este schema
-- reducido de 3 tablas, ya que no incluye la tabla "usuario")
INSERT INTO contrato (id_contrato, id_empresa, titulo, contraparte_nombre, estado,
                       fecha_inicio_vigencia, fecha_fin_vigencia, valor_contrato, moneda,
                       creado_por, firma_pki_hash, firma_pki_fecha)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111',
   'Contrato de arrendamiento de maquinaria', 'Maquinarias del Sur SRL', 'Validez_Legal',
   '2026-01-01', '2026-12-31', 85000.00, 'BOB',
   '33333333-3333-3333-3333-333333333333', 'hash_demo_abc123', now()),

  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111',
   'Contrato de servicios de mantenimiento', 'Mantén Bolivia S.A.', 'Negociacion',
   NULL, NULL, 15000.00, 'USD',
   '33333333-3333-3333-3333-333333333333', NULL, NULL),

  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '22222222-2222-2222-2222-222222222222',
   'Contrato de licenciamiento de software', 'CloudSoft Inc.', 'Borrador',
   NULL, NULL, NULL, NULL,
   '44444444-4444-4444-4444-444444444444', NULL, NULL);

-- Clausulas del primer contrato (el que ya tiene Validez_Legal)
INSERT INTO clausula (id_contrato, orden, titulo, contenido, tipo_clausula, es_modificable)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1, 'Objeto del contrato',
   'El arrendador se compromete a poner a disposicion del arrendatario la maquinaria detallada en el Anexo A.',
   'estandar', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 2, 'Jurisdiccion',
   'Las partes se someten a la jurisdiccion de los tribunales de la ciudad de La Paz, Bolivia.',
   'legal_boilerplate', false),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 1, 'Alcance del servicio',
   'El proveedor realizara mantenimiento preventivo mensual sobre los equipos listados en el Anexo B.',
   'estandar', true);
