const bcrypt = require('bcryptjs');
const { getDb, persist, nextId, now } = require('../db/store');
const { signToken } = require('../middleware/auth');

function formatUser(row) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    createdAt: row.created_at,
  };
}

function register({ email, password, name }) {
  const db = getDb();
  const existing = db.users.find((u) => u.email === email);
  if (existing) {
    const err = new Error('El email ya está registrado');
    err.status = 409;
    throw err;
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const id = nextId('users');
  const timestamp = now();

  db.users.push({
    id,
    email,
    password_hash: passwordHash,
    name,
    created_at: timestamp,
    updated_at: timestamp,
  });

  persist();
  const user = db.users.find((u) => u.id === id);
  return { user: formatUser(user), token: signToken(user) };
}

function login({ email, password }) {
  const user = getDb().users.find((u) => u.email === email);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    const err = new Error('Email o contraseña incorrectos');
    err.status = 401;
    throw err;
  }

  return { user: formatUser(user), token: signToken(user) };
}

function getProfile(userId) {
  const user = getDb().users.find((u) => u.id === userId);
  if (!user) return null;
  return formatUser(user);
}

function updateProfile(userId, { name, email }) {
  const db = getDb();
  const user = db.users.find((u) => u.id === userId);
  if (!user) return null;

  if (email && email !== user.email) {
    const existing = db.users.find((u) => u.email === email && u.id !== userId);
    if (existing) {
      const err = new Error('El email ya está en uso');
      err.status = 409;
      throw err;
    }
    user.email = email;
  }

  if (name !== undefined) user.name = name;
  user.updated_at = now();
  persist();

  return getProfile(userId);
}

function changePassword(userId, { currentPassword, newPassword }) {
  const user = getDb().users.find((u) => u.id === userId);
  if (!user || !bcrypt.compareSync(currentPassword, user.password_hash)) {
    const err = new Error('Contraseña actual incorrecta');
    err.status = 401;
    throw err;
  }

  user.password_hash = bcrypt.hashSync(newPassword, 10);
  user.updated_at = now();
  persist();
  return true;
}

function getStats(userId) {
  const db = getDb();
  return {
    totalContacts: db.contacts.filter((c) => c.user_id === userId).length,
    favoriteContacts: db.contacts.filter((c) => c.user_id === userId && c.is_favorite === 1).length,
    totalGroups: db.groups.filter((g) => g.user_id === userId).length,
  };
}

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  getStats,
};
