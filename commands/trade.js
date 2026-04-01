const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUser, createTrade, getTrades, completeTrade } = require('../database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('trade')
    .setDescription('Trade items with other users.')
    .addSubcommand(sub =>
      sub.setName('offer')
        .setDescription('Offer an item for trade.')
        .addUserOption(opt => opt.setName('user').setDescription('User to trade with').setRequired(true))
        .addIntegerOption(opt => opt.setName('item_id').setDescription('Item ID to offer').setRequired(true))
        .addIntegerOption(opt => opt.setName('price').setDescription('Price in keys').setRequired(true).setMinValue(1))
    )
    .addSubcommand(sub =>
      sub.setName('accept')
        .setDescription('Accept a trade offer.')
        .addIntegerOption(opt => opt.setName('trade_id').setDescription('Trade ID to accept').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('list')
        .setDescription('List your pending trades.')
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const userId = interaction.user.id;

    if (subcommand === 'offer') {
      const target = interaction.options.getUser('user');
      const itemId = interaction.options.getInteger('item_id');
      const price = interaction.options.getInteger('price');

      if (target.id === userId) {
        return interaction.reply({ content: '❌ You cannot trade with yourself.', ephemeral: true });
      }

      const tradeId = createTrade(userId, target.id, itemId, price);

      const embed = new EmbedBuilder()
        .setColor(0x57f287)
        .setTitle('📤 Trade Offer Sent')
        .setDescription(`Offered item #${itemId} to <@${target.id}> for ${price} 🔑.`)
        .addFields({ name: 'Trade ID', value: `${tradeId}`, inline: true })
        .setFooter({ text: 'They can accept with /trade accept <id>' });

      return interaction.reply({ embeds: [embed] });
    }

    if (subcommand === 'accept') {
      const tradeId = interaction.options.getInteger('trade_id');
      const success = completeTrade(tradeId);

      if (!success) {
        return interaction.reply({ content: '❌ Trade not found or already completed.', ephemeral: true });
      }

      return interaction.reply({ content: '✅ Trade completed!', ephemeral: true });
    }

    if (subcommand === 'list') {
      const trades = getTrades(userId);
      if (!trades.length) {
        return interaction.reply({ content: '📭 No pending trades.', ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setColor(0x2f3136)
        .setTitle('📋 Your Trades')
        .setDescription(trades.map(t => `ID ${t.id}: ${t.item_name} (${t.rarity}) for ${t.price} 🔑 - ${t.status}`).join('\n'));

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};