const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'agenda-dev-secret-change-in-production';

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Token de autenticación requerido',
    });
  }

  try {
    const token = header.slice(7);
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Token inválido o expirado',
    });
  }
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

module.exports = { authenticate, signToken, JWT_SECRET };
