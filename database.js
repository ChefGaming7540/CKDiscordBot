const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'crate_bot.db'));

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    user_id     TEXT PRIMARY KEY,
    keys        INTEGER NOT NULL DEFAULT 0,
    total_opens INTEGER NOT NULL DEFAULT 0,
    last_work   INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS inventory (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     TEXT NOT NULL,
    item_name   TEXT NOT NULL,
    rarity      TEXT NOT NULL,
    effect      TEXT,
    obtained_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
  );
`);

// ── User helpers ──────────────────────────────────────────────────────────────

function getUser(userId) {
  let user = db.prepare('SELECT * FROM users WHERE user_id = ?').get(userId);
  if (!user) {
    db.prepare('INSERT INTO users (user_id) VALUES (?)').run(userId);
    user = db.prepare('SELECT * FROM users WHERE user_id = ?').get(userId);
  }
  return user;
}

function addKeys(userId, amount) {
  getUser(userId);
  db.prepare('UPDATE users SET keys = keys + ? WHERE user_id = ?').run(amount, userId);
}

function removeKey(userId) {
  const user = getUser(userId);
  if (user.keys < 1) return false;
  db.prepare('UPDATE users SET keys = keys - 1, total_opens = total_opens + 1 WHERE user_id = ?').run(userId);
  return true;
}

function setLastWork(userId) {
  getUser(userId);
  db.prepare('UPDATE users SET last_work = ? WHERE user_id = ?').run(Date.now(), userId);
}

// ── Inventory helpers ─────────────────────────────────────────────────────────

function addItem(userId, item) {
  db.prepare(`
    INSERT INTO inventory (user_id, item_name, rarity, effect)
    VALUES (?, ?, ?, ?)
  `).run(userId, item.name, item.rarity, item.effect || null);
}

function getInventory(userId) {
  return db.prepare(`
    SELECT * FROM inventory WHERE user_id = ?
    ORDER BY obtained_at DESC
  `).all(userId);
}

module.exports = { getUser, addKeys, removeKey, setLastWork, addItem, getInventory };