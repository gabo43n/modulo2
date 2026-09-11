const { validationResult } = require('express-validator');

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'ValidationError',
      message: 'Datos de entrada inválidos',
      details: errors.array(),
    });
  }
  next();
}

function errorHandler(err, req, res, _next) {
  console.error(err);

  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return res.status(409).json({
      error: 'Conflict',
      message: 'El recurso ya existe',
    });
  }

  res.status(err.status || 500).json({
    error: err.name || 'InternalServerError',
    message: err.message || 'Error interno del servidor',
  });
}

function notFound(req, res) {
  res.status(404).json({
    error: 'NotFound',
    message: `Ruta ${req.method} ${req.originalUrl} no encontrada`,
  });
}

module.exports = { validate, errorHandler, notFound };
