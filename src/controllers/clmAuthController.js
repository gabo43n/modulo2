// src/controllers/clmAuthController.js
// -----------------------------------------------------------------------------
// Login/logout del modulo CLM. Separado de clmController.js por lo mismo que
// authController.js esta separado de contactController.js en este proyecto:
// autenticacion es una responsabilidad distinta de "leer/escribir datos".
// -----------------------------------------------------------------------------

const { verificarCredenciales, emitirSesion, cerrarSesion } = require('../middleware/clmAuth');

function login(req, res) {
  const { username, password } = req.body;

  if (!verificarCredenciales(username, password)) {
    // Mensaje generico a proposito: no decimos "el usuario no existe" ni "la
    // contraseña es incorrecta" por separado, porque eso le regala a un
    // atacante informacion sobre que usuarios existen (username enumeration).
    return res.status(401).json({
      error: 'CredencialesInvalidas',
      message: 'Usuario o contraseña incorrectos',
    });
  }

  emitirSesion(res, username);
  res.json({ ok: true, username });
}

function logout(_req, res) {
  cerrarSesion(res);
  res.json({ ok: true });
}

function me(req, res) {
  res.json({ username: req.clmUser.sub });
}

module.exports = { login, logout, me };
