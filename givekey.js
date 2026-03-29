const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { addKeys, getUser } = require('../database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('givekey')
    .setDescription('(Admin) Give keys to a user.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addUserOption(opt =>
      opt.setName('user')
        .setDescription('The user to give keys to.')
        .setRequired(true)
    )
    .addIntegerOption(opt =>
      opt.setName('amount')
        .setDescription('Number of keys to give (default: 1)')
        .setMinValue(1)
        .setMaxValue(100)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('amount') ?? 1;

    addKeys(target.id, amount);
    const updated = getUser(target.id);

    const embed = new EmbedBuilder()
      .setColor(0x57f287)
      .setTitle('🔑 Keys Given')
      .addFields(
        { name: 'Recipient', value: `<@${target.id}>`,    inline: true },
        { name: 'Given',     value: `+${amount} 🔑`,       inline: true },
        { name: 'New Total', value: `${updated.keys} 🔑`,  inline: true },
      )
      .setFooter({ text: `Issued by ${interaction.user.username}` })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  },
};