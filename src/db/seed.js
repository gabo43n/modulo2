const bcrypt = require('bcryptjs');
const { getDb, persist, nextId, now } = require('./store');

const db = getDb();
const existing = db.users.find((u) => u.email === 'demo@agenda.com');
if (existing) {
  console.log('Datos de demo ya existen. Saltando seed.');
  process.exit(0);
}

const passwordHash = bcrypt.hashSync('demo1234', 10);

const userId = nextId('users');
db.users.push({
  id: userId,
  email: 'demo@agenda.com',
  password_hash: passwordHash,
  name: 'Usuario Demo',
  created_at: now(),
  updated_at: now(),
});

const familiaId = nextId('groups');
db.groups.push({
  id: familiaId,
  user_id: userId,
  name: 'Familia',
  color: '#EF4444',
  created_at: now(),
  updated_at: now(),
});

const trabajoId = nextId('groups');
db.groups.push({
  id: trabajoId,
  user_id: userId,
  name: 'Trabajo',
  color: '#3B82F6',
  created_at: now(),
  updated_at: now(),
});

const c1Id = nextId('contacts');
db.contacts.push({
  id: c1Id,
  user_id: userId,
  first_name: 'María',
  last_name: 'García',
  company: null,
  email: 'maria@email.com',
  address: 'Av. Corrientes 1234, CABA',
  notes: 'Hermana',
  photo_url: null,
  is_favorite: 1,
  created_at: now(),
  updated_at: now(),
});

db.phoneNumbers.push(
  { id: nextId('phoneNumbers'), contact_id: c1Id, type: 'mobile', number: '+54 11 5555-1234', is_primary: 1 },
  { id: nextId('phoneNumbers'), contact_id: c1Id, type: 'home', number: '+54 11 4444-5678', is_primary: 0 }
);
db.contactGroups.push({ contact_id: c1Id, group_id: familiaId });

const c2Id = nextId('contacts');
db.contacts.push({
  id: c2Id,
  user_id: userId,
  first_name: 'Carlos',
  last_name: 'López',
  company: 'TechCorp SA',
  email: 'carlos@techcorp.com',
  address: null,
  notes: 'Compañero de trabajo',
  photo_url: null,
  is_favorite: 0,
  created_at: now(),
  updated_at: now(),
});

db.phoneNumbers.push(
  { id: nextId('phoneNumbers'), contact_id: c2Id, type: 'work', number: '+54 11 3333-9999', is_primary: 1 }
);
db.contactGroups.push({ contact_id: c2Id, group_id: trabajoId });

const c3Id = nextId('contacts');
db.contacts.push({
  id: c3Id,
  user_id: userId,
  first_name: 'Ana',
  last_name: 'Martínez',
  company: null,
  email: 'ana.m@email.com',
  address: null,
  notes: null,
  photo_url: null,
  is_favorite: 1,
  created_at: now(),
  updated_at: now(),
});

db.phoneNumbers.push(
  { id: nextId('phoneNumbers'), contact_id: c3Id, type: 'mobile', number: '+54 9 11 6666-7777', is_primary: 1 }
);
db.contactGroups.push({ contact_id: c3Id, group_id: familiaId });

persist();

console.log('Seed completado.');
console.log('Usuario demo: demo@agenda.com / demo1234');
