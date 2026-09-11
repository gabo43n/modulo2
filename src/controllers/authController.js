const authService = require('../services/authService');

async function register(req, res, next) {
  try {
    const result = authService.register(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const result = authService.login(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

function getProfile(req, res, next) {
  try {
    const profile = authService.getProfile(req.user.id);
    if (!profile) {
      return res.status(404).json({ error: 'NotFound', message: 'Usuario no encontrado' });
    }
    res.json(profile);
  } catch (err) {
    next(err);
  }
}

function updateProfile(req, res, next) {
  try {
    const profile = authService.updateProfile(req.user.id, req.body);
    if (!profile) {
      return res.status(404).json({ error: 'NotFound', message: 'Usuario no encontrado' });
    }
    res.json(profile);
  } catch (err) {
    next(err);
  }
}

function changePassword(req, res, next) {
  try {
    authService.changePassword(req.user.id, req.body);
    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    next(err);
  }
}

function getStats(req, res, next) {
  try {
    const stats = authService.getStats(req.user.id);
    res.json(stats);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  getStats,
};
