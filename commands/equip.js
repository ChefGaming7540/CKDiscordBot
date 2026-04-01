const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUser, equipItem, getInventory } = require('../database');
const { RARITIES } = require('../items');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('equip')
    .setDescription('Equip an item from your inventory to gain bonuses.')
    .addIntegerOption(opt =>
      opt.setName('item_id')
        .setDescription('The ID of the item to equip (from /inventory)')
        .setRequired(true)
        .setMinValue(1)
    ),

  async execute(interaction) {
    const userId = interaction.user.id;
    const itemId = interaction.options.getInteger('item_id');
    const user = getUser(userId);
    const inventory = getInventory(userId);
    const item = inventory.find(i => i.id === itemId);

    if (!item) {
      return interaction.reply({
        content: '❌ Item not found in your inventory.',
        ephemeral: true,
      });
    }

    equipItem(userId, itemId);

    const cfg = RARITIES[item.rarity] ?? {};
    const embed = new EmbedBuilder()
      .setColor(cfg.color || 0x2f3136)
      .setTitle('⚔️ Item Equipped!')
      .setDescription(`You equipped **${item.item_name}** (${item.rarity}).`)
      .addFields(
        { name: 'Effect', value: item.effect || 'None', inline: true },
      )
      .setFooter({ text: 'Use /inventory to see equipped items.' })
      .setTimestamp();

    return interaction.reply({ embeds: [embed], ephemeral: true });
  },
};