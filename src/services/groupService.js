const { getDb, persist, nextId, now } = require('../db/store');
const { formatContact } = require('./contactService');

function formatGroup(row, includeContactCount = false) {
  if (!row) return null;
  const group = {
    id: row.id,
    name: row.name,
    color: row.color,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
  if (includeContactCount) {
    group.contactCount = row.contact_count;
  }
  return group;
}

function listGroups(userId) {
  const db = getDb();
  const rows = db.groups
    .filter((g) => g.user_id === userId)
    .map((g) => ({
      ...g,
      contact_count: db.contactGroups.filter((cg) => cg.group_id === g.id).length,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return rows.map((r) => formatGroup(r, true));
}

function getGroupById(userId, groupId) {
  const row = getDb().groups.find(
    (g) => g.id === Number(groupId) && g.user_id === userId
  );
  return formatGroup(row);
}

function createGroup(userId, data) {
  const db = getDb();
  const duplicate = db.groups.find(
    (g) => g.user_id === userId && g.name.toLowerCase() === data.name.toLowerCase()
  );
  if (duplicate) {
    const err = new Error('El grupo ya existe');
    err.code = 'SQLITE_CONSTRAINT_UNIQUE';
    throw err;
  }

  const id = nextId('groups');
  const timestamp = now();
  db.groups.push({
    id,
    user_id: userId,
    name: data.name,
    color: data.color || '#3B82F6',
    created_at: timestamp,
    updated_at: timestamp,
  });

  persist();
  return getGroupById(userId, id);
}

function updateGroup(userId, groupId, data) {
  const db = getDb();
  const group = db.groups.find(
    (g) => g.id === Number(groupId) && g.user_id === userId
  );
  if (!group) return null;

  if (data.name !== undefined) group.name = data.name;
  if (data.color !== undefined) group.color = data.color;
  group.updated_at = now();

  persist();
  return getGroupById(userId, groupId);
}

function deleteGroup(userId, groupId) {
  const db = getDb();
  const id = Number(groupId);
  const index = db.groups.findIndex((g) => g.id === id && g.user_id === userId);
  if (index === -1) return false;

  db.groups.splice(index, 1);
  db.contactGroups = db.contactGroups.filter((cg) => cg.group_id !== id);
  persist();
  return true;
}

function getGroupContacts(userId, groupId, { page = 1, limit = 20 } = {}) {
  const group = getGroupById(userId, groupId);
  if (!group) return null;

  const db = getDb();
  const contactIds = db.contactGroups
    .filter((cg) => cg.group_id === Number(groupId))
    .map((cg) => cg.contact_id);

  const rows = db.contacts
    .filter((c) => c.user_id === userId && contactIds.includes(c.id))
    .sort((a, b) => a.first_name.localeCompare(b.first_name));

  const total = rows.length;
  const offset = (page - 1) * limit;
  const pageRows = rows.slice(offset, offset + Number(limit));

  return {
    group,
    data: pageRows.map(formatContact),
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

module.exports = {
  listGroups,
  getGroupById,
  createGroup,
  updateGroup,
  deleteGroup,
  getGroupContacts,
};
