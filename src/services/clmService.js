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
    `SELECT c.id_contrato, c.titulo, c.contraparte_nombre, c.estado,
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
    `SELECT cl.id_clausula, cl.orden, cl.titulo, cl.tipo_clausula,
            cl.es_modificable, cl.version,
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
  // "usuario" que no existe en este schema reducido de 3 tablas). Como no
  // tenemos login en este modulo, generamos un UUID de relleno si no llega
  // uno en el body. Si mas adelante agregas autenticacion real a este
  // modulo, reemplaza esto por el id del usuario logueado (req.user.id).
  const creado_por = crypto.randomUUID();

  const { rows } = await pool.query(
    `INSERT INTO contrato (
       id_empresa, titulo, contraparte_nombre, estado,
       fecha_inicio_vigencia, fecha_fin_vigencia, valor_contrato, moneda, creado_por
     )
     VALUES ($1, $2, $3, COALESCE($4, 'Borrador'), $5, $6, $7, $8, $9)
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

module.exports = {
  checkConnection, listEmpresas, listContratos, listClausulas,
  createEmpresa, createContrato, createClausula,
};
