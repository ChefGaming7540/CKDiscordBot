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
];

// ── Your items ────────────────────────────────────────────────────────────────
// Add / remove items freely. Each item needs a `name` and `rarity`.
// Unusual items will automatically get a random effect assigned on drop.
const ITEMS = [
  // Common
  { name: 'Rusty Sword',        rarity: 'Common'    },
  { name: 'Wooden Shield',      rarity: 'Common'    },
  { name: 'Leather Boots',      rarity: 'Common'    },
  { name: 'Tattered Cape',      rarity: 'Common'    },
  { name: 'Iron Dagger',        rarity: 'Common'    },
  { name: 'Cloth Hood',         rarity: 'Common'    },

  // Uncommon
  { name: 'Steel Gauntlets',    rarity: 'Uncommon'  },
  { name: 'Shadow Cloak',       rarity: 'Uncommon'  },
  { name: 'Enchanted Bow',      rarity: 'Uncommon'  },
  { name: 'Mithril Ring',       rarity: 'Uncommon'  },
  { name: 'Hex Staff',          rarity: 'Uncommon'  },

  // Rare
  { name: 'Dragonbone Axe',     rarity: 'Rare'      },
  { name: 'Phantom Blade',      rarity: 'Rare'      },
  { name: 'Cursed Amulet',      rarity: 'Rare'      },
  { name: 'Voidweave Armor',    rarity: 'Rare'      },

  // Legendary
  { name: 'Godslayer Sword',    rarity: 'Legendary' },
  { name: 'Eternal Shield',     rarity: 'Legendary' },
  { name: 'Crown of Ages',      rarity: 'Legendary' },

  // Unusual (effect applied at roll-time)
  { name: 'Rustling Hat',       rarity: 'Unusual'   },
  { name: 'Phantom Fedora',     rarity: 'Unusual'   },
  { name: 'Glowing Helm',       rarity: 'Unusual'   },
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

  const result = {
    name:         item.name,
    rarity,
    effect:       rarity === 'Unusual' ? pickEffect() : null,
    rarityConfig: RARITIES[rarity],
  };
  return result;
}

module.exports = { openCrate, RARITIES, ITEMS, UNUSUAL_EFFECTS };