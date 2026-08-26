// src/services/clmService.js
// -----------------------------------------------------------------------------
// Logica de negocio / consultas del modulo CLM. Sigue el mismo patron que
// contactService.js y groupService.js: el controller nunca escribe SQL
// directamente, siempre pasa por el service.
// -----------------------------------------------------------------------------

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

module.exports = { checkConnection, listEmpresas, listContratos, listClausulas };
