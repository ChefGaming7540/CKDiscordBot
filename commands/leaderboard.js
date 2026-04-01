const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getLeaderboard } = require('../database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('View the top players.'),

  async execute(interaction) {
    const leaders = getLeaderboard();

    if (!leaders.length) {
      return interaction.reply({ content: '🏆 No data yet.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor(0xffd700)
      .setTitle('🏆 Leaderboard')
      .setDescription(
        leaders.map((u, i) => `${i + 1}. <@${u.user_id}> - Lv.${u.level} (${u.xp} XP, ${u.crates} 📦, ${u.total_opens} opens)`).join('\n')
      );

    return interaction.reply({ embeds: [embed], ephemeral: true });
  },
};