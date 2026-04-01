// ─────────────────────────────────────────────────────────────────────────────
//  items.js  –  Define your items and rarities here
// ─────────────────────────────────────────────────────────────────────────────

// Rarity config
// weight: higher = more likely to roll
// color:  Discord embed side-bar color (hex)
const RARITIES = {
  Common:    { weight: 50, color: 0xb0b0b0, emoji: '⬜', label: 'Common'    },
  Uncommon:  { weight: 25, color: 0x5ba85b, emoji: '🟩', label: 'Uncommon'  },
  Rare:      { weight: 15, color: 0x5b7fe8, emoji: '🟦', label: 'Rare'      },
  Legendary: { weight: 7,  color: 0xd966e8, emoji: '🟪', label: 'Legendary' },
  Unusual:   { weight: 3,  color: 0xff8c00, emoji: '🌟', label: 'Unusual ★' },
};

// Unusual effects – applied only to Unusual-rarity items
const UNUSUAL_EFFECTS = [
  'Burning Flames',
  'Stormy Storm',
  'Sunbeams',
  'Circling Heart',
  'Orbiting Fire',
  'Vivid Plasma',
  'Green Energy',
  'Purple Energy',
  'Massed Flies',
  'Steaming',
  'Haunted Ghosts',
  'Scorching Flames',
  'Searing Plasma',
  'Nuts n\' Bolts',
  'Orbiting Planets',
  'Heaven\'s Cooking',
];

// ── Your items ────────────────────────────────────────────────────────────────
// Add / remove items freely. Each item needs a `name` and `rarity`.
// Unusual items will automatically get a random effect assigned on drop.
// Now includes effects for usability.
const ITEMS = [
  // Common
  { name: 'Rusty Sword',        rarity: 'Common',    effect: 'work_boost_5' },
  { name: 'Wooden Shield',      rarity: 'Common',    effect: 'defense_10' },
  { name: 'Leather Boots',      rarity: 'Common',    effect: 'speed_5' },
  { name: 'Tattered Cape',      rarity: 'Common',    effect: 'luck_2' },
  { name: 'Iron Dagger',        rarity: 'Common',    effect: 'attack_5' },
  { name: 'Cloth Hood',         rarity: 'Common',    effect: 'stealth_5' },

  // Uncommon
  { name: 'Steel Gauntlets',    rarity: 'Uncommon',  effect: 'work_boost_10' },
  { name: 'Shadow Cloak',       rarity: 'Uncommon',  effect: 'stealth_10' },
  { name: 'Enchanted Bow',      rarity: 'Uncommon',  effect: 'attack_10' },
  { name: 'Mithril Ring',       rarity: 'Uncommon',  effect: 'luck_5' },
  { name: 'Hex Staff',          rarity: 'Uncommon',  effect: 'magic_10' },

  // Rare
  { name: 'Dragonbone Axe',     rarity: 'Rare',      effect: 'work_boost_20' },
  { name: 'Phantom Blade',      rarity: 'Rare',      effect: 'attack_20' },
  { name: 'Cursed Amulet',      rarity: 'Rare',      effect: 'luck_10' },
  { name: 'Voidweave Armor',    rarity: 'Rare',      effect: 'defense_20' },

  // Legendary
  { name: 'Godslayer Sword',    rarity: 'Legendary', effect: 'work_boost_50' },
  { name: 'Eternal Shield',     rarity: 'Legendary', effect: 'defense_50' },
  { name: 'Crown of Ages',      rarity: 'Legendary', effect: 'luck_20' },

  // Unusual (effect applied at roll-time)
  { name: 'Rustling Hat',       rarity: 'Unusual',   effect: 'random' },
  { name: 'Phantom Fedora',     rarity: 'Unusual',   effect: 'random' },
  { name: 'Glowing Helm',       rarity: 'Unusual',   effect: 'random' },
  { name: 'Chef\'s Toque',      rarity: 'Unusual',   effect: 'random' },
];

// ── Roll logic ────────────────────────────────────────────────────────────────

/** Weighted random pick from an array of { value, weight } */
function weightedRandom(entries) {
  const total = entries.reduce((s, e) => s + e.weight, 0);
  let roll = Math.random() * total;
  for (const entry of entries) {
    roll -= entry.weight;
    if (roll <= 0) return entry.value;
  }
  return entries[entries.length - 1].value;
}

/** Roll a rarity based on weights */
function rollRarity() {
  const entries = Object.entries(RARITIES).map(([name, cfg]) => ({
    value: name,
    weight: cfg.weight,
  }));
  return weightedRandom(entries);
}

/** Pick a random item of a given rarity */
function pickItem(rarity) {
  const pool = ITEMS.filter(i => i.rarity === rarity);
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Pick a random unusual effect */
function pickEffect() {
  return UNUSUAL_EFFECTS[Math.floor(Math.random() * UNUSUAL_EFFECTS.length)];
}

/**
 * Open a crate and return the rolled item object.
 * Returns: { name, rarity, effect, rarityConfig }
 */
function openCrate() {
  const rarity = rollRarity();
  const item   = pickItem(rarity);
  if (!item) return openCrate(); // re-roll if rarity pool is empty

  const isChefToque = item.name === "Chef's Toque" && rarity === 'Unusual';
  const result = {
    name:         item.name,
    rarity,
    effect:       isChefToque ? "Heaven's Cooking" : (rarity === 'Unusual' ? pickEffect() : item.effect),
    rarityConfig: RARITIES[rarity],
  };
  return result;
}

/**
 * Calculate bonus from equipped item effect.
 * Returns: { workBoost: number, luck: number, etc. }
 */
function getItemBonus(effect) {
  if (!effect) return {};
  const bonuses = {};
  if (effect.startsWith('work_boost_')) {
    bonuses.workBoost = parseInt(effect.split('_')[2]);
  } else if (effect.startsWith('luck_')) {
    bonuses.luck = parseInt(effect.split('_')[1]);
  } else if (effect === 'random') {
    // Random bonus for unusual
    const types = ['workBoost', 'luck'];
    const type = types[Math.floor(Math.random() * types.length)];
    bonuses[type] = Math.floor(Math.random() * 20) + 10;
  }
  return bonuses;
}

module.exports = { openCrate, RARITIES, ITEMS, UNUSUAL_EFFECTS, getItemBonus };