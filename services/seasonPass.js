const { getUser, getSeasonPassProgress } = require('../database');

// Season pass reward tiers
const SEASONREWARDS = [
  { level: 1, reward: '100 coins' },
  { level: 2, reward: '1 key' },
  { level: 3, reward: '5 keys' },
  { level: 4, reward: '10 coins and rare item' },
  { level: 5, reward: 'legendary work boost crate' },
];

function getSeasonPassStatus(userId) {
  const { EmbedBuilder } = require('discord.js');
  const user = getUser(userId);
  const progress = getSeasonPassProgress(userId);

  const embed = new EmbedBuilder()
    .setTitle('🏆 Season Pass Status')
    .setColor(0x42f593)
    .addFields(
      { name: 'Season XP', value: `${progress.season_xp}`, inline: true },
      { name: 'Season Level', value: `${progress.season_level}`, inline: true },
      { name: 'XP to next level', value: `${progress.to_next_level}`, inline: true },
      { name: 'Global Level', value: `${user.level}`, inline: true },
      { name: 'Global XP', value: `${user.xp}`, inline: true }
    )
    .setTimestamp();
  return embed;
}

function getSeasonPassRewards() {
  const lines = SEASONREWARDS.map(i => `Level ${i.level}: ${i.reward}`);
  return `🛡️ Season Pass rewards:\n${lines.join('\n')}`;
}

module.exports = { SEASONREWARDS, getSeasonPassStatus, getSeasonPassRewards };