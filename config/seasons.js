const SEASON_DURATION_DAYS = 60; // season length in days
const SEASONAL_SHOPS = [
  {
    seasonId: 1,
    name: 'Chef Season 1: Sizzle & Serve',
    items: [
      { id: 'workboost-25', label: 'Work Boost +25%', type: 'item', cost: 350, item: { name: 'Sizzle Spatula', rarity: 'Legendary', effect: 'work_boost_25' } },
      { id: 'keypack', label: 'Key Pack (5 keys)', type: 'keys', cost: 120, amount: 5 },
    ],
  },
  {
    seasonId: 2,
    name: 'Chef Season 2: Blend & Boost',
    items: [
      { id: 'workboost-30', label: 'Work Boost +30%', type: 'item', cost: 400, item: { name: 'Mixer Master', rarity: 'Legendary', effect: 'work_boost_30' } },
      { id: 'keypack', label: 'Key Pack (6 keys)', type: 'keys', cost: 150, amount: 6 },
    ],
  },
  {
    seasonId: 3,
    name: 'Chef Season 3: Fry & Fly',
    items: [
        { id: 'workboost-35', label: 'Work Boost +35%', type: 'item', cost: 450, item: { name: 'Frypan of Fortune', rarity: 'Legendary', effect: 'work_boost_35' } },
        { id: 'keypack', label: 'Key Pack (7 keys)', type: 'keys', cost: 180, amount: 7 },
        { id: 'crate', label: 'A Bundle O\' Crates!', type: 'crate', cost: 200, amount: 10 },
        ],
  }
];

function getCurrentSeason() {
  const seasonStart = new Date('2026-01-01T00:00:00Z').getTime();
  const now = Date.now();
  const seasonIndex = Math.floor((now - seasonStart) / (SEASON_DURATION_DAYS * 24 * 60 * 60 * 1000));
  return SEASONAL_SHOPS[seasonIndex % SEASONAL_SHOPS.length];
}

function getSeasonal() {
  return getCurrentSeason();
}

module.exports = { SEASON_DURATION_DAYS, SEASONAL_SHOPS, getCurrentSeason, getSeasonal };