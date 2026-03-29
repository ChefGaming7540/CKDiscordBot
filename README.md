# 🎁 Discord Crate Bot

A TF2-style crate opening bot with custom items, rarity tiers, unusual effects, a key economy, and inventory management.

---

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure your bot token
```bash
cp .env.example .env
# Then edit .env and paste your bot token
```

### 3. Start the bot
```bash
npm start
```

Slash commands are registered **automatically** when the bot starts.

---

## Commands

| Command | Description |
|---|---|
| `/opencase` | Use a key to open a crate and receive a random item |
| `/work` | Work to earn keys (1 hour cooldown) |
| `/inventory [page]` | View your item collection |
| `/givekey <user> [amount]` | *(Admin — Manage Server)* Give keys to a user |

---

## Customising Items

Edit `items.js` to add your own items and unusual effects:

```js
// Add items to the ITEMS array:
{ name: 'My Cool Item', rarity: 'Rare' },

// Add unusual effects to UNUSUAL_EFFECTS:
'Rainbow Trail',
```

### Rarity Tiers & Drop Rates

| Rarity    | Weight | Approx. Chance |
|-----------|--------|----------------|
| Common    | 50     | ~50%           |
| Uncommon  | 25     | ~25%           |
| Rare      | 15     | ~15%           |
| Legendary | 7      | ~7%            |
| Unusual   | 3      | ~3%            |

Adjust `weight` values in the `RARITIES` object inside `items.js` to change drop rates.

---

## Project Structure

```
discord-crate-bot/
├── index.js          # Bot entry point & command loader
├── database.js       # SQLite setup & query helpers
├── items.js          # Item definitions, rarities, roll logic
├── commands/
│   ├── opencase.js   # /opencase
│   ├── inventory.js  # /inventory
│   ├── work.js       # /work
│   └── givekey.js    # /givekey (admin)
├── package.json
└── .env.example
```

---

## Database

Uses **SQLite** via `better-sqlite3` — no external database server needed. The file `crate_bot.db` is created automatically on first run.

**Tables:**
- `users` — tracks key balance, total opens, and last work time
- `inventory` — stores every item a user has unboxed