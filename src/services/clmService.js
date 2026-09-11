// src/services/clmService.js
// -----------------------------------------------------------------------------
// Logica de negocio / consultas del modulo CLM. Sigue el mismo patron que
// contactService.js y groupService.js: el controller nunca escribe SQL
// directamente, siempre pasa por el service.
// -----------------------------------------------------------------------------

const crypto = require('crypto');
const { pool } = require('../db/postgres');

async function checkConnection() {
  await pool.query('SELECT 1');
}

async function listEmpresas() {
  const { rows } = await pool.query(
    `SELECT id_empresa, razon_social, nit, pais, fecha_registro, activo
     FROM empresa_cliente
     ORDER BY fecha_registro DESC`
  );
  return rows;
}

async function listContratos() {
  // JOIN con empresa_cliente para devolver el nombre de la empresa en vez de
  // solo su UUID: evita que el cliente (la pagina HTML) tenga que hacer una
  // segunda consulta por cada fila.
  const { rows } = await pool.query(
    `SELECT c.id_contrato, c.id_empresa, c.titulo, c.contraparte_nombre, c.estado,
            c.fecha_inicio_vigencia, c.fecha_fin_vigencia,
            c.valor_contrato, c.moneda,
            e.razon_social AS empresa
     FROM contrato c
     JOIN empresa_cliente e ON e.id_empresa = c.id_empresa
     ORDER BY c.fecha_creacion DESC`
  );
  return rows;
}

async function listClausulas() {
  const { rows } = await pool.query(
    `SELECT cl.id_clausula, cl.id_contrato, cl.orden, cl.titulo, cl.contenido,
            cl.tipo_clausula, cl.es_modificable, cl.version,
            co.titulo AS contrato
     FROM clausula cl
     JOIN contrato co ON co.id_contrato = cl.id_contrato
     ORDER BY co.titulo, cl.orden`
  );
  return rows;
}


// -----------------------------------------------------------------------------
// Creacion de registros. Usamos SIEMPRE parametros ($1, $2, ...) en vez de
// concatenar los valores dentro del texto SQL. Esto se llama "consulta
// parametrizada" y es la defensa principal contra inyeccion SQL: el driver
// "pg" envia el texto de la consulta y los valores por separado, asi que un
// valor como "'; DROP TABLE contrato; --" llega como un simple string de
// datos, nunca como codigo SQL que se ejecuta.
// -----------------------------------------------------------------------------

async function createEmpresa({ razon_social, nit, direccion_fiscal, pais, activo }) {
  const { rows } = await pool.query(
    `INSERT INTO empresa_cliente (razon_social, nit, direccion_fiscal, pais, activo)
     VALUES ($1, $2, $3, $4, COALESCE($5, true))
     RETURNING *`,
    [razon_social, nit, direccion_fiscal ?? null, pais, activo]
  );
  return rows[0];
}

async function createContrato({
  id_empresa, titulo, contraparte_nombre, estado,
  fecha_inicio_vigencia, fecha_fin_vigencia, valor_contrato, moneda,
}) {
  // creado_por es NOT NULL en el schema (pensado para referenciar una tabla
  // "usuario" que no existe en este schema reducido de 3 tablas). Como el
  // login del dashboard no es un usuario de esa tabla (ver nota mas abajo),
  // generamos un UUID de relleno.
  const creado_por = crypto.randomUUID();

  const { rows } = await pool.query(
    `INSERT INTO contrato (
       id_empresa, titulo, contraparte_nombre, estado,
       fecha_inicio_vigencia, fecha_fin_vigencia, valor_contrato, moneda, creado_por
     )
     VALUES ($1, $2, $3, COALESCE($4::estado_contrato, 'Borrador'), $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      id_empresa, titulo, contraparte_nombre, estado ?? null,
      fecha_inicio_vigencia ?? null, fecha_fin_vigencia ?? null,
      valor_contrato ?? null, moneda ?? null, creado_por,
    ]
  );
  return rows[0];
}

async function createClausula({ id_contrato, orden, titulo, contenido, tipo_clausula, es_modificable }) {
  const { rows } = await pool.query(
    `INSERT INTO clausula (id_contrato, orden, titulo, contenido, tipo_clausula, es_modificable)
     VALUES ($1, $2, $3, $4, COALESCE($5, 'estandar'), COALESCE($6, true))
     RETURNING *`,
    [id_contrato, orden, titulo, contenido, tipo_clausula ?? null, es_modificable]
  );
  return rows[0];
}


// -----------------------------------------------------------------------------
// Actualizacion (UPDATE). Usamos COALESCE($n, columna) en cada campo: si el
// body no manda ese campo (llega undefined -> lo convertimos a null abajo),
// COALESCE deja el valor que ya tenia la fila. Asi el PUT admite actualizar
// solo algunos campos sin necesidad de reenviar el registro completo.
// Ojo: esto no sirve para "poner algo en null a proposito" (poner NULL y "no
// mandar el campo" se ven iguales); para este practico es una limitacion
// aceptable y vale la pena explicarla en vez de escconderla.
//
// Todas devuelven `undefined` si el id no existe (0 filas afectadas) — el
// controller decide que hacer con eso (normalmente, responder 404).
// -----------------------------------------------------------------------------

async function updateEmpresa(id, { razon_social, nit, direccion_fiscal, pais, activo }) {
  const { rows } = await pool.query(
    `UPDATE empresa_cliente SET
       razon_social = COALESCE($1, razon_social),
       nit = COALESCE($2, nit),
       direccion_fiscal = COALESCE($3, direccion_fiscal),
       pais = COALESCE($4, pais),
       activo = COALESCE($5, activo)
     WHERE id_empresa = $6
     RETURNING *`,
    [razon_social ?? null, nit ?? null, direccion_fiscal ?? null, pais ?? null, activo ?? null, id]
  );
  return rows[0];
}

async function updateContrato(id, {
  titulo, contraparte_nombre, estado,
  fecha_inicio_vigencia, fecha_fin_vigencia, valor_contrato, moneda,
}) {
  const { rows } = await pool.query(
    `UPDATE contrato SET
       titulo = COALESCE($1, titulo),
       contraparte_nombre = COALESCE($2, contraparte_nombre),
       estado = COALESCE($3::estado_contrato, estado),
       fecha_inicio_vigencia = COALESCE($4, fecha_inicio_vigencia),
       fecha_fin_vigencia = COALESCE($5, fecha_fin_vigencia),
       valor_contrato = COALESCE($6, valor_contrato),
       moneda = COALESCE($7, moneda)
     WHERE id_contrato = $8
     RETURNING *`,
    [
      titulo ?? null, contraparte_nombre ?? null, estado ?? null,
      fecha_inicio_vigencia ?? null, fecha_fin_vigencia ?? null,
      valor_contrato ?? null, moneda ?? null, id,
    ]
  );
  return rows[0];
}

async function updateClausula(id, { titulo, contenido, tipo_clausula, es_modificable, orden }) {
  const { rows } = await pool.query(
    `UPDATE clausula SET
       titulo = COALESCE($1, titulo),
       contenido = COALESCE($2, contenido),
       tipo_clausula = COALESCE($3, tipo_clausula),
       es_modificable = COALESCE($4, es_modificable),
       orden = COALESCE($5, orden)
     WHERE id_clausula = $6
     RETURNING *`,
    [titulo ?? null, contenido ?? null, tipo_clausula ?? null, es_modificable ?? null, orden ?? null, id]
  );
  return rows[0];
}


// -----------------------------------------------------------------------------
// Eliminacion (DELETE). RETURNING nos dice si de verdad existia una fila con
// ese id (si no existia, "rows" viene vacio). Los ON DELETE CASCADE del
// schema (contrato -> clausula, empresa_cliente -> contrato) se encargan de
// borrar en cadena lo que depende de la fila borrada.
// -----------------------------------------------------------------------------

async function deleteEmpresa(id) {
  const { rows } = await pool.query(
    `DELETE FROM empresa_cliente WHERE id_empresa = $1 RETURNING id_empresa`,
    [id]
  );
  return rows[0];
}

async function deleteContrato(id) {
  const { rows } = await pool.query(
    `DELETE FROM contrato WHERE id_contrato = $1 RETURNING id_contrato`,
    [id]
  );
  return rows[0];
}

async function deleteClausula(id) {
  const { rows } = await pool.query(
    `DELETE FROM clausula WHERE id_clausula = $1 RETURNING id_clausula`,
    [id]
  );
  return rows[0];
}

module.exports = {
  checkConnection,
  listEmpresas, listContratos, listClausulas,
  createEmpresa, createContrato, createClausula,
  updateEmpresa, updateContrato, updateClausula,
  deleteEmpresa, deleteContrato, deleteClausula,
};
