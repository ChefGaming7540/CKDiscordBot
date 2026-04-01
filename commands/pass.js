const { SlashCommandBuilder } = require('discord.js');
const { getSeasonPassStatus, getSeasonPassRewards } = require('../services/seasonPass');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pass')
    .setDescription('Season pass progression commands')
    .addSubcommand(sub => sub.setName('status').setDescription('Check your season pass progress'))
    .addSubcommand(sub => sub.setName('rewards').setDescription('List season pass rewards')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'status') {
      const embed = getSeasonPassStatus(interaction.user.id);
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === 'rewards') {
      const content = getSeasonPassRewards();
      return interaction.reply({ content, ephemeral: true });
    }
  },
};