const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'crate_bot.db'));

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

function ensureColumn(table, column, definition) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!columns.some(x => x.name === column)) {
    db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`).run();
  }
}

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    user_id       TEXT PRIMARY KEY,
    keys          INTEGER NOT NULL DEFAULT 0,
    total_opens   INTEGER NOT NULL DEFAULT 0,
    last_work     INTEGER NOT NULL DEFAULT 0,
    xp            INTEGER NOT NULL DEFAULT 0,
    level         INTEGER NOT NULL DEFAULT 1,
    equipped_item INTEGER,
    streak        INTEGER NOT NULL DEFAULT 0,
    last_daily    INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS inventory (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       TEXT NOT NULL,
    item_name     TEXT NOT NULL,
    rarity        TEXT NOT NULL,
    effect        TEXT,
    equipped      INTEGER NOT NULL DEFAULT 0,
    obtained_at   INTEGER NOT NULL DEFAULT (strftime('%s','now'))
  );

  CREATE TABLE IF NOT EXISTS trades (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    seller_id     TEXT NOT NULL,
    buyer_id      TEXT NOT NULL,
    item_id       INTEGER NOT NULL,
    price         INTEGER NOT NULL,
    status        TEXT NOT NULL DEFAULT 'pending',
    created_at    INTEGER NOT NULL DEFAULT (strftime('%s','now'))
  );

  CREATE TABLE IF NOT EXISTS challenges (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       TEXT NOT NULL,
    type          TEXT NOT NULL,
    progress      INTEGER NOT NULL DEFAULT 0,
    goal          INTEGER NOT NULL,
    reward        TEXT NOT NULL,
    expires_at    INTEGER NOT NULL,
    completed     INTEGER NOT NULL DEFAULT 0
  );
`);

// Ensure existing DB columns after first-run schema changes
ensureColumn('users', 'xp', 'INTEGER NOT NULL DEFAULT 0');
ensureColumn('users', 'level', 'INTEGER NOT NULL DEFAULT 1');
ensureColumn('users', 'equipped_item', 'INTEGER');
ensureColumn('users', 'streak', 'INTEGER NOT NULL DEFAULT 0');
ensureColumn('users', 'last_daily', 'INTEGER NOT NULL DEFAULT 0');
ensureColumn('inventory', 'equipped', 'INTEGER NOT NULL DEFAULT 0');

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

function setLastDaily(userId) {
  getUser(userId);
  db.prepare('UPDATE users SET last_daily = ? WHERE user_id = ?').run(Date.now(), userId);
}

function addXP(userId, amount) {
  getUser(userId);
  db.prepare('UPDATE users SET xp = xp + ? WHERE user_id = ?').run(amount, userId);
  // Level up logic
  const user = getUser(userId);
  const newLevel = Math.floor(user.xp / 100) + 1; // 100 XP per level
  if (newLevel > user.level) {
    db.prepare('UPDATE users SET level = ? WHERE user_id = ?').run(newLevel, userId);
  }
}

function equipItem(userId, itemId) {
  // Unequip current
  db.prepare('UPDATE inventory SET equipped = 0 WHERE user_id = ?').run(userId);
  // Equip new
  db.prepare('UPDATE inventory SET equipped = 1 WHERE id = ? AND user_id = ?').run(itemId, userId);
  db.prepare('UPDATE users SET equipped_item = ? WHERE user_id = ?').run(itemId, userId);
}

function getEquippedItem(userId) {
  return db.prepare('SELECT * FROM inventory WHERE user_id = ? AND equipped = 1').get(userId);
}

function createTrade(sellerId, buyerId, itemId, price) {
  return db.prepare(`
    INSERT INTO trades (seller_id, buyer_id, item_id, price)
    VALUES (?, ?, ?, ?)
  `).run(sellerId, buyerId, itemId, price).lastInsertRowid;
}

function getTrades(userId) {
  return db.prepare(`
    SELECT t.*, i.item_name, i.rarity FROM trades t
    JOIN inventory i ON t.item_id = i.id
    WHERE t.seller_id = ? OR t.buyer_id = ?
  `).all(userId, userId);
}

function completeTrade(tradeId) {
  const trade = db.prepare('SELECT * FROM trades WHERE id = ?').get(tradeId);
  if (!trade) return false;
  // Transfer item
  db.prepare('UPDATE inventory SET user_id = ? WHERE id = ?').run(trade.buyer_id, trade.item_id);
  // Transfer keys
  addKeys(trade.buyer_id, -trade.price);
  addKeys(trade.seller_id, trade.price);
  db.prepare('UPDATE trades SET status = ? WHERE id = ?').run('completed', tradeId);
  return true;
}

function getLeaderboard() {
  return db.prepare(`
    SELECT user_id, keys, total_opens, level, xp
    FROM users
    ORDER BY level DESC, xp DESC
    LIMIT 10
  `).all();
}

function getDailyChallenge(userId) {
  const now = Date.now();
  let challenge = db.prepare('SELECT * FROM challenges WHERE user_id = ? AND expires_at > ? AND completed = 0').get(userId, now);
  if (!challenge) {
    // Create new daily challenge
    const types = ['work', 'open_crate'];
    const type = types[Math.floor(Math.random() * types.length)];
    const goal = type === 'work' ? 3 : 5;
    const reward = type === 'work' ? '2 keys' : 'bonus XP';
    const expires = now + 24 * 60 * 60 * 1000; // 24 hours
    db.prepare(`
      INSERT INTO challenges (user_id, type, goal, reward, expires_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, type, goal, reward, expires);
    challenge = db.prepare('SELECT * FROM challenges WHERE user_id = ? AND expires_at > ? AND completed = 0').get(userId, now);
  }
  return challenge;
}

function updateChallengeProgress(userId, type) {
  const challenge = getDailyChallenge(userId);
  if (challenge && challenge.type === type) {
    db.prepare('UPDATE challenges SET progress = progress + 1 WHERE id = ?').run(challenge.id);
    if (challenge.progress + 1 >= challenge.goal) {
      db.prepare('UPDATE challenges SET completed = 1 WHERE id = ?').run(challenge.id);
      // Apply reward
      if (challenge.reward === '2 keys') addKeys(userId, 2);
      else addXP(userId, 50);
    }
  }
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

module.exports = { 
  getUser, addKeys, removeKey, setLastWork, setLastDaily, addXP, equipItem, getEquippedItem,
  createTrade, getTrades, completeTrade, getLeaderboard, getDailyChallenge, updateChallengeProgress,
  addItem, getInventory 
};