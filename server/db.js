const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data', 'db.json');

function read() {
  const raw = fs.readFileSync(DB_PATH, 'utf8');
  return JSON.parse(raw);
}

function write(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
}

function getUsers() { return read().users; }
function getItems() { return read().items; }
function getSettings() { return read().settings; }
function getTransactions() { return read().transactions; }
function getCategories() {
  const db = read();
  // fallback: derive from items if not stored
  if (db.categories && db.categories.length) return db.categories;
  return [...new Set(db.items.map(i => i.category).filter(Boolean))].sort();
}

function saveUsers(users) {
  const db = read();
  db.users = users;
  write(db);
}

function saveItems(items) {
  const db = read();
  db.items = items;
  write(db);
}

function saveSettings(settings) {
  const db = read();
  db.settings = settings;
  write(db);
}

function saveTransaction(tx) {
  const db = read();
  db.transactions.push(tx);
  write(db);
}

function saveCategories(categories) {
  const db = read();
  db.categories = categories;
  write(db);
}

module.exports = {
  getUsers, getItems, getSettings, getTransactions, getCategories,
  saveUsers, saveItems, saveSettings, saveTransaction, saveCategories
};
