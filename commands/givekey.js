const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { addKeys, getUser, addXP, addItem } = require('../database');
const { openCrate } = require('../items');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('givekey')
    .setDescription('(Admin) Give keys, XP, or spawn items.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sub =>
      sub.setName('keys')
        .setDescription('Give keys to a user.')
        .addUserOption(opt => opt.setName('user').setDescription('User').setRequired(true))
        .addIntegerOption(opt => opt.setName('amount').setDescription('Keys').setMinValue(1).setMaxValue(100))
    )
    .addSubcommand(sub =>
      sub.setName('xp')
        .setDescription('Give XP to a user.')
        .addUserOption(opt => opt.setName('user').setDescription('User').setRequired(true))
        .addIntegerOption(opt => opt.setName('amount').setDescription('XP').setMinValue(1).setMaxValue(1000))
    )
    .addSubcommand(sub =>
      sub.setName('item')
        .setDescription('Spawn an item for a user.')
        .addUserOption(opt => opt.setName('user').setDescription('User').setRequired(true))
        .addStringOption(opt => opt.setName('rarity').setDescription('Rarity').setRequired(true)
          .addChoices(
            { name: 'Common', value: 'Common' },
            { name: 'Uncommon', value: 'Uncommon' },
            { name: 'Rare', value: 'Rare' },
            { name: 'Legendary', value: 'Legendary' },
            { name: 'Unusual', value: 'Unusual' },
          )
        )
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'keys') {
      const target = interaction.options.getUser('user');
      const amount = interaction.options.getInteger('amount') ?? 1;

      addKeys(target.id, amount);
      const updated = getUser(target.id);

      const embed = new EmbedBuilder()
        .setColor(0x57f287)
        .setTitle('🔑 Keys Given')
        .addFields(
          { name: 'Recipient', value: `<@${target.id}>`, inline: true },
          { name: 'Given', value: `+${amount} 🔑`, inline: true },
          { name: 'New Total', value: `${updated.keys} 🔑`, inline: true },
        )
        .setFooter({ text: `Issued by ${interaction.user.username}` })
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    if (subcommand === 'xp') {
      const target = interaction.options.getUser('user');
      const amount = interaction.options.getInteger('amount');

      addXP(target.id, amount);
      const updated = getUser(target.id);

      const embed = new EmbedBuilder()
        .setColor(0xffd700)
        .setTitle('⭐ XP Given')
        .addFields(
          { name: 'Recipient', value: `<@${target.id}>`, inline: true },
          { name: 'Given', value: `+${amount} XP`, inline: true },
          { name: 'New Level', value: `${updated.level}`, inline: true },
        )
        .setFooter({ text: `Issued by ${interaction.user.username}` });

      return interaction.reply({ embeds: [embed] });
    }

    if (subcommand === 'item') {
      const target = interaction.options.getUser('user');
      const rarity = interaction.options.getString('rarity');

      // Force roll specific rarity
      const item = openCrate();
      item.rarity = rarity;
      addItem(target.id, item);

      const embed = new EmbedBuilder()
        .setColor(0xd966e8)
        .setTitle('🎁 Item Spawned')
        .addFields(
          { name: 'Recipient', value: `<@${target.id}>`, inline: true },
          { name: 'Item', value: `${item.name} (${rarity})`, inline: true },
        )
        .setFooter({ text: `Issued by ${interaction.user.username}` });

      return interaction.reply({ embeds: [embed] });
    }
  },
};