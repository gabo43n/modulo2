const { getDb, persist, nextId, now } = require('../db/store');

function getPhonesForContact(contactId) {
  return getDb().phoneNumbers
    .filter((p) => p.contact_id === contactId)
    .sort((a, b) => b.is_primary - a.is_primary || a.id - b.id)
    .map((p) => ({
      id: p.id,
      type: p.type,
      number: p.number,
      isPrimary: Boolean(p.is_primary),
    }));
}

function getGroupsForContact(contactId) {
  const db = getDb();
  const groupIds = db.contactGroups
    .filter((cg) => cg.contact_id === contactId)
    .map((cg) => cg.group_id);

  return db.groups
    .filter((g) => groupIds.includes(g.id))
    .map((g) => ({ id: g.id, name: g.name, color: g.color }));
}

function formatContact(row) {
  if (!row) return null;
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    company: row.company,
    email: row.email,
    address: row.address,
    notes: row.notes,
    photoUrl: row.photo_url,
    isFavorite: Boolean(row.is_favorite),
    phones: getPhonesForContact(row.id),
    groups: getGroupsForContact(row.id),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function filterContacts(userId, filters = {}) {
  const db = getDb();
  let rows = db.contacts.filter((c) => c.user_id === userId);

  if (filters.search) {
    const term = filters.search.toLowerCase();
    rows = rows.filter((c) => {
      const phoneMatch = db.phoneNumbers.some(
        (p) => p.contact_id === c.id && p.number.toLowerCase().includes(term)
      );
      return (
        c.first_name?.toLowerCase().includes(term)
        || c.last_name?.toLowerCase().includes(term)
        || c.company?.toLowerCase().includes(term)
        || c.email?.toLowerCase().includes(term)
        || phoneMatch
      );
    });
  }

  if (filters.favorite === true || filters.favorite === 'true') {
    rows = rows.filter((c) => c.is_favorite === 1);
  }

  if (filters.groupId) {
    const groupId = Number(filters.groupId);
    const contactIds = db.contactGroups
      .filter((cg) => cg.group_id === groupId)
      .map((cg) => cg.contact_id);
    rows = rows.filter((c) => contactIds.includes(c.id));
  }

  if (filters.letter) {
    const letter = filters.letter.toUpperCase();
    rows = rows.filter((c) => c.first_name?.toUpperCase().startsWith(letter));
  }

  const sortField = {
    firstName: 'first_name',
    lastName: 'last_name',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }[filters.sortBy] || 'first_name';

  const sortOrder = filters.sortOrder === 'desc' ? -1 : 1;

  rows.sort((a, b) => {
    const av = (a[sortField] || '').toLowerCase();
    const bv = (b[sortField] || '').toLowerCase();
    if (av < bv) return -1 * sortOrder;
    if (av > bv) return 1 * sortOrder;
    return (a.last_name || '').localeCompare(b.last_name || '');
  });

  return rows;
}

function listContacts(userId, { page = 1, limit = 20, ...filters } = {}) {
  const rows = filterContacts(userId, filters);
  const total = rows.length;
  const offset = (page - 1) * limit;
  const pageRows = rows.slice(offset, offset + Number(limit));

  return {
    data: pageRows.map(formatContact),
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

function getContactById(userId, contactId) {
  const row = getDb().contacts.find(
    (c) => c.id === Number(contactId) && c.user_id === userId
  );
  return formatContact(row);
}

function syncPhones(contactId, phones) {
  const db = getDb();
  db.phoneNumbers = db.phoneNumbers.filter((p) => p.contact_id !== contactId);
  for (const phone of phones) {
    db.phoneNumbers.push({
      id: nextId('phoneNumbers'),
      contact_id: contactId,
      type: phone.type || 'mobile',
      number: phone.number,
      is_primary: phone.isPrimary ? 1 : 0,
    });
  }
}

function syncGroups(contactId, groupIds) {
  const db = getDb();
  db.contactGroups = db.contactGroups.filter((cg) => cg.contact_id !== contactId);
  for (const groupId of groupIds) {
    db.contactGroups.push({ contact_id: contactId, group_id: groupId });
  }
}

function createContact(userId, data) {
  const contactId = nextId('contacts');
  const timestamp = now();

  getDb().contacts.push({
    id: contactId,
    user_id: userId,
    first_name: data.firstName,
    last_name: data.lastName || null,
    company: data.company || null,
    email: data.email || null,
    address: data.address || null,
    notes: data.notes || null,
    photo_url: data.photoUrl || null,
    is_favorite: data.isFavorite ? 1 : 0,
    created_at: timestamp,
    updated_at: timestamp,
  });

  if (data.phones?.length) syncPhones(contactId, data.phones);
  if (data.groupIds?.length) syncGroups(contactId, data.groupIds);

  persist();
  return getContactById(userId, contactId);
}

function updateContact(userId, contactId, data) {
  const db = getDb();
  const contact = db.contacts.find(
    (c) => c.id === Number(contactId) && c.user_id === userId
  );
  if (!contact) return null;

  const mapping = {
    firstName: 'first_name',
    lastName: 'last_name',
    company: 'company',
    email: 'email',
    address: 'address',
    notes: 'notes',
    photoUrl: 'photo_url',
  };

  for (const [key, col] of Object.entries(mapping)) {
    if (data[key] !== undefined) contact[col] = data[key];
  }

  if (data.isFavorite !== undefined) {
    contact.is_favorite = data.isFavorite ? 1 : 0;
  }

  contact.updated_at = now();

  if (data.phones !== undefined) syncPhones(Number(contactId), data.phones);
  if (data.groupIds !== undefined) syncGroups(Number(contactId), data.groupIds);

  persist();
  return getContactById(userId, contactId);
}

function deleteContact(userId, contactId) {
  const db = getDb();
  const id = Number(contactId);
  const index = db.contacts.findIndex((c) => c.id === id && c.user_id === userId);
  if (index === -1) return false;

  db.contacts.splice(index, 1);
  db.phoneNumbers = db.phoneNumbers.filter((p) => p.contact_id !== id);
  db.contactGroups = db.contactGroups.filter((cg) => cg.contact_id !== id);
  persist();
  return true;
}

function toggleFavorite(userId, contactId) {
  const contact = getContactById(userId, contactId);
  if (!contact) return null;
  return updateContact(userId, contactId, { isFavorite: !contact.isFavorite });
}

function getContactsByLetter(userId) {
  const contacts = getDb().contacts.filter((c) => c.user_id === userId);
  const map = {};

  for (const c of contacts) {
    const letter = (c.first_name?.[0] || '#').toUpperCase();
    map[letter] = (map[letter] || 0) + 1;
  }

  return Object.entries(map)
    .map(([letter, count]) => ({ letter, count }))
    .sort((a, b) => a.letter.localeCompare(b.letter));
}

function getRecentContacts(userId, limit = 10) {
  const rows = getDb().contacts
    .filter((c) => c.user_id === userId)
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    .slice(0, Number(limit));

  return rows.map(formatContact);
}

function getChangesSince(userId, since) {
  const contacts = getDb().contacts
    .filter((c) => c.user_id === userId && c.updated_at > since)
    .map(formatContact);

  return {
    contacts,
    deletedContactIds: [],
    syncedAt: now(),
  };
}

module.exports = {
  formatContact,
  listContacts,
  getContactById,
  createContact,
  updateContact,
  deleteContact,
  toggleFavorite,
  getContactsByLetter,
  getRecentContacts,
  getChangesSince,
};
