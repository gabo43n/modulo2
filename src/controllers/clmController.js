// src/controllers/clmController.js
// -----------------------------------------------------------------------------
// Controladores HTTP del modulo CLM. Igual que el resto del proyecto: reciben
// req/res, llaman al service, y delegan errores a "next(err)" para que los
// atrape el errorHandler central (src/middleware/errorHandler.js).
// -----------------------------------------------------------------------------

const clmService = require('../services/clmService');

async function health(_req, res) {
  try {
    await clmService.checkConnection();
    res.json({ status: 'ok', db: 'conectado' });
  } catch (err) {
    // Aqui NO usamos next(err): un fallo de conexion a Postgres no es un bug
    // del servidor, es un estado esperado mientras configuras la base de
    // datos. Respondemos 200... no, respondemos 503 (Service Unavailable)
    // para que sea facil de detectar, pero con un mensaje claro en vez de
    // un stack trace generico de 500.
    res.status(503).json({ status: 'error', db: 'sin conexion', detalle: err.message });
  }
}

async function empresas(_req, res, next) {
  try {
    res.json(await clmService.listEmpresas());
  } catch (err) {
    next(err);
  }
}

async function contratos(_req, res, next) {
  try {
    res.json(await clmService.listContratos());
  } catch (err) {
    next(err);
  }
}

async function clausulas(_req, res, next) {
  try {
    res.json(await clmService.listClausulas());
  } catch (err) {
    next(err);
  }
}

module.exports = { health, empresas, contratos, clausulas };
