const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUser, removeKey, addItem } = require('../database');
const { openCrate } = require('../items');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('opencase')
    .setDescription('Use a key to open a crate and receive a random item!'),

  async execute(interaction) {
    const userId = interaction.user.id;
    const user   = getUser(userId);

    if (user.keys < 1) {
      return interaction.reply({
        content: '🔑 You don\'t have any keys! Earn one with `/work` or ask an admin for one.',
        ephemeral: true,
      });
    }

    // Deduct key and roll item
    removeKey(userId);
    const item = openCrate();
    addItem(userId, item);

    const { rarityConfig, name, rarity, effect } = item;
    const isUnusual = rarity === 'Unusual';

    // Build the result embed
    const embed = new EmbedBuilder()
      .setColor(rarityConfig.color)
      .setTitle(`${rarityConfig.emoji} You unboxed something!`)
      .setDescription(
        isUnusual
          ? `✨ **${effect} ${name}**\n> *A shimmering unusual effect dances around it...*`
          : `**${name}**`
      )
      .addFields(
        { name: 'Rarity',  value: rarityConfig.label,            inline: true },
        { name: 'Keys Left', value: `${user.keys - 1} 🔑`,       inline: true },
        { name: 'Total Opens', value: `${user.total_opens + 1}`, inline: true }
      )
      .setFooter({ text: `Opened by ${interaction.user.username}` })
      .setTimestamp();

    if (isUnusual) {
      embed.setThumbnail('https://i.imgur.com/unusual_placeholder.png'); // replace with your own image
    }

    return interaction.reply({ embeds: [embed] });
  },
};