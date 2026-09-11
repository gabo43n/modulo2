const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const DB_FILE = path.join(dataDir, 'agenda.json');

function emptyDb() {
  return {
    users: [],
    groups: [],
    contacts: [],
    phoneNumbers: [],
    contactGroups: [],
    counters: { users: 0, groups: 0, contacts: 0, phoneNumbers: 0 },
  };
}

function load() {
  if (!fs.existsSync(DB_FILE)) return emptyDb();
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function save(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}

let db = load();

function persist() {
  save(db);
}

function nextId(table) {
  db.counters[table] = (db.counters[table] || 0) + 1;
  return db.counters[table];
}

function now() {
  return new Date().toISOString();
}

function getDb() {
  return db;
}

function resetDb() {
  db = emptyDb();
  persist();
}

module.exports = { getDb, persist, nextId, now, resetDb, DB_FILE };
