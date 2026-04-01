const { SlashCommandBuilder } = require('discord.js');
const { getUser } = require('../database');
const { getShopEmbed, buyItem } = require('../services/store');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shop')
    .setDescription('Buy keys, crates, and performance items')
    .addSubcommand(sub => sub.setName('browse').setDescription('See items available in the shop'))
    .addSubcommand(sub => sub.setName('buy').setDescription('Buy an item').addStringOption(opt => opt.setName('item').setDescription('Item ID').setRequired(true)))
    .addSubcommand(sub => sub.setName('balance').setDescription('Check coin balance')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const user = getUser(interaction.user.id);

    if (sub === 'balance') {
      return interaction.reply({ content: `💰 You have **${user.coins} coins**.`, ephemeral: true });
    }

    if (sub === 'browse') {
      const embed = getShopEmbed(user.coins);
      return interaction.reply({ embeds: [embed], ephemeral: false });
    }

    if (sub === 'buy') {
      const itemId = interaction.options.getString('item').toLowerCase();
      const result = buyItem(interaction.user.id, itemId);
      return interaction.reply({ content: result.message, ephemeral: true });
    }
  },
};