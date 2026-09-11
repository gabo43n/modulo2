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
    // datos. Respondemos 503 (Service Unavailable) para que sea facil de
    // detectar, con un mensaje claro en vez de un stack trace generico.
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


// -----------------------------------------------------------------------------
// Traduce codigos de error nativos de PostgreSQL a respuestas HTTP claras.
// Sin esto, cualquier error de la base de datos caeria en el 500 generico
// del errorHandler, y el mensaje que veria el usuario seria un stack trace
// interno en vez de algo entendible. Los codigos son parte del estandar
// SQLSTATE de Postgres (no son un invento de este proyecto):
//   23505 = unique_violation      (ej: un NIT que ya existe)
//   23503 = foreign_key_violation (ej: un id_empresa que no existe)
//   23514 = check_violation       (ej: viola un CHECK del schema)
//   22P02 = invalid_text_representation (ej: un UUID mal formado)
//   P0001 = raise_exception       (ej: los triggers de contrato/clausula:
//           transicion de estado invalida, o editar una clausula bloqueada)
// -----------------------------------------------------------------------------
function manejarErrorPostgres(err, res, next) {
  const mensajesPorCodigo = {
    '23505': { status: 409, message: 'Ya existe un registro con ese valor unico (por ejemplo, el NIT).' },
    '23503': { status: 400, message: 'Hace referencia a un registro que no existe (revisa el id_empresa o id_contrato).' },
    '23514': { status: 400, message: 'El dato no cumple una regla de negocio de la base de datos (constraint CHECK).' },
    '22P02': { status: 400, message: 'Un valor tiene un formato invalido (por ejemplo, un UUID mal escrito).' },
    'P0001': { status: 400, message: err.message },
  };

  const conocido = mensajesPorCodigo[err.code];
  if (conocido) {
    return res.status(conocido.status).json({
      error: 'DatosInvalidos',
      message: conocido.message,
      detalle: err.detail || err.message,
    });
  }

  next(err); // error no reconocido: que lo maneje el errorHandler generico (500)
}

async function createEmpresa(req, res, next) {
  try {
    res.status(201).json(await clmService.createEmpresa(req.body));
  } catch (err) {
    manejarErrorPostgres(err, res, next);
  }
}

async function createContrato(req, res, next) {
  try {
    res.status(201).json(await clmService.createContrato(req.body));
  } catch (err) {
    manejarErrorPostgres(err, res, next);
  }
}

async function createClausula(req, res, next) {
  try {
    res.status(201).json(await clmService.createClausula(req.body));
  } catch (err) {
    manejarErrorPostgres(err, res, next);
  }
}

// -----------------------------------------------------------------------------
// Actualizar y eliminar. Todas siguen el mismo patron: si el service no
// encontro una fila con ese id, responden 404 (en vez de "actualizar 0
// filas" en silencio, que dejaria al usuario pensando que funciono).
// -----------------------------------------------------------------------------

async function updateEmpresa(req, res, next) {
  try {
    const actualizado = await clmService.updateEmpresa(req.params.id, req.body);
    if (!actualizado) {
      return res.status(404).json({ error: 'NoEncontrado', message: 'No existe una empresa con ese id' });
    }
    res.json(actualizado);
  } catch (err) {
    manejarErrorPostgres(err, res, next);
  }
}

async function deleteEmpresa(req, res, next) {
  try {
    const eliminado = await clmService.deleteEmpresa(req.params.id);
    if (!eliminado) {
      return res.status(404).json({ error: 'NoEncontrado', message: 'No existe una empresa con ese id' });
    }
    res.status(204).end();
  } catch (err) {
    manejarErrorPostgres(err, res, next);
  }
}

async function updateContrato(req, res, next) {
  try {
    const actualizado = await clmService.updateContrato(req.params.id, req.body);
    if (!actualizado) {
      return res.status(404).json({ error: 'NoEncontrado', message: 'No existe un contrato con ese id' });
    }
    res.json(actualizado);
  } catch (err) {
    manejarErrorPostgres(err, res, next);
  }
}

async function deleteContrato(req, res, next) {
  try {
    const eliminado = await clmService.deleteContrato(req.params.id);
    if (!eliminado) {
      return res.status(404).json({ error: 'NoEncontrado', message: 'No existe un contrato con ese id' });
    }
    res.status(204).end();
  } catch (err) {
    manejarErrorPostgres(err, res, next);
  }
}

async function updateClausula(req, res, next) {
  try {
    const actualizado = await clmService.updateClausula(req.params.id, req.body);
    if (!actualizado) {
      return res.status(404).json({ error: 'NoEncontrado', message: 'No existe una clausula con ese id' });
    }
    res.json(actualizado);
  } catch (err) {
    manejarErrorPostgres(err, res, next);
  }
}

async function deleteClausula(req, res, next) {
  try {
    const eliminado = await clmService.deleteClausula(req.params.id);
    if (!eliminado) {
      return res.status(404).json({ error: 'NoEncontrado', message: 'No existe una clausula con ese id' });
    }
    res.status(204).end();
  } catch (err) {
    manejarErrorPostgres(err, res, next);
  }
}

module.exports = {
  health, empresas, contratos, clausulas,
  createEmpresa, createContrato, createClausula,
  updateEmpresa, updateContrato, updateClausula,
  deleteEmpresa, deleteContrato, deleteClausula,
};
