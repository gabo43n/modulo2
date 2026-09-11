// src/middleware/clmAuth.js
// -----------------------------------------------------------------------------
// Autenticacion del modulo CLM: un solo usuario "admin" definido por
// variables de entorno (no una tabla de usuarios en Postgres — el schema del
// practico se queda en solo 3 tablas: empresa_cliente, contrato, clausula).
// La sesion se guarda en una cookie httpOnly con un JWT adentro.
//
// Por que cookie y no el patron de localStorage + header "Authorization" que
// usa el resto de esta API (/api/contacts)? Porque aqui necesitamos bloquear
// la carga de una PAGINA HTML (GET /clm/) antes de que el navegador la
// muestre. Eso solo es posible si el navegador manda la credencial el mismo,
// automaticamente, en la peticion de navegacion — que es justo lo que hace
// una cookie (un header personalizado no se puede adjuntar cuando alguien
// escribe la URL a mano o hace click en un link). Ademas, httpOnly evita que
// un script en la pagina (por ejemplo, inyectado por un XSS) pueda leer el
// token con JavaScript.
// -----------------------------------------------------------------------------

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const CLM_JWT_SECRET = process.env.CLM_JWT_SECRET || 'clm-dev-secret-change-in-production';
const COOKIE_NAME = 'clm_token';
const DURACION_SESION_MS = 8 * 60 * 60 * 1000; // 8 horas

function verificarCredenciales(username, password) {
  const usuarioConfigurado = process.env.CLM_ADMIN_USER;
  const hashConfigurado = process.env.CLM_ADMIN_PASSWORD_HASH;

  if (!usuarioConfigurado || !hashConfigurado) {
    // Falta configurar .env: no es culpa del usuario que intenta loguearse,
    // pero tampoco dejamos pasar a nadie por defecto.
    console.error('[CLM] Falta CLM_ADMIN_USER o CLM_ADMIN_PASSWORD_HASH en .env');
    return false;
  }
  if (username !== usuarioConfigurado) return false;

  // bcrypt.compareSync hashea "password" con la misma sal que tiene el hash
  // guardado y compara los resultados. Nunca se "desencripta" el hash (no se
  // puede: bcrypt es de un solo sentido), por eso siempre se compara asi.
  return bcrypt.compareSync(password, hashConfigurado);
}

function emitirSesion(res, username) {
  const token = jwt.sign({ sub: username }, CLM_JWT_SECRET, { expiresIn: '8h' });
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: DURACION_SESION_MS,
  });
}

function cerrarSesion(res) {
  res.clearCookie(COOKIE_NAME);
}

function leerSesion(req) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return null;
  try {
    return jwt.verify(token, CLM_JWT_SECRET);
  } catch {
    return null; // token ausente, vencido o manipulado: se trata igual, sin sesion
  }
}

// Protege las rutas de API (/api/clm/...): sin sesion valida, responde 401 en
// JSON. Esta es la proteccion REAL de los datos — alguien podria llamar a
// estos endpoints directo con curl/Postman, sin pasar nunca por la pagina de
// login, asi que el bloqueo tiene que vivir aqui y no solo en el frontend.
function requireAuthApi(req, res, next) {
  const sesion = leerSesion(req);
  if (!sesion) {
    return res.status(401).json({ error: 'NoAutenticado', message: 'Inicia sesion para usar este endpoint' });
  }
  req.clmUser = sesion;
  next();
}

// Protege la pagina del dashboard (/clm/): sin sesion valida, en vez de
// servir el HTML, redirige al login. Esto es lo que resuelve "si entro
// directo a la URL del dashboard sin loguearme, que me mande al login".
function requireAuthPage(req, res, next) {
  const sesion = leerSesion(req);
  if (!sesion) {
    return res.redirect('/clm/login.html');
  }
  req.clmUser = sesion;
  next();
}

module.exports = {
  verificarCredenciales,
  emitirSesion,
  cerrarSesion,
  requireAuthApi,
  requireAuthPage,
};
