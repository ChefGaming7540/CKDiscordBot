const { SlashCommandBuilder } = require('discord.js');
const { buyItem } = require('../services/store');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('buy')
    .setDescription('Quick buy an item from the shop')
    .addStringOption(opt => opt.setName('item').setDescription('Item ID').setRequired(true)),

  async execute(interaction) {
    const itemId = interaction.options.getString('item').toLowerCase();
    const result = buyItem(interaction.user.id, itemId);
    return interaction.reply({ content: result.message, ephemeral: true });
  },
};