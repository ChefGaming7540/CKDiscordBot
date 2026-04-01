const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUser, removeCrate, addItem, addXP, updateChallengeProgress } = require('../database');
const { openCrate } = require('../items');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('opencase')
    .setDescription('Use a key to open a crate and receive a random item!'),

  async execute(interaction) {
    const userId = interaction.user.id;
    const user   = getUser(userId);

    if (user.crates < 1) {
      return interaction.reply({
        content: '📦 You don\'t have any crates! Earn one with `/work` or buy one from the shop.',
        ephemeral: true,
      });
    }

    // Deduct crate and roll item
    removeCrate(userId);
    const item = openCrate();
    addItem(userId, item);
    addXP(userId, 5); // 5 XP per open
    updateChallengeProgress(userId, 'open_crate');

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
        { name: 'Crates Left', value: `${user.crates - 1} 📦`,       inline: true },
        { name: 'Total Opens', value: `${user.total_opens + 1}`, inline: true },
        { name: 'XP Gained', value: '+5', inline: true },
      )
      .setFooter({ text: `Opened by ${interaction.user.username}` })
      .setTimestamp();

    if (isUnusual) {
      embed.setThumbnail('https://i.imgur.com/unusual_placeholder.png'); // replace with your own image
    }

    return interaction.reply({ embeds: [embed] });
  },
};