const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUser, getDailyChallenge, addKeys, addXP, setLastDaily } = require('../database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('View and claim your daily challenge.'),

  async execute(interaction) {
    const userId = interaction.user.id;
    const user = getUser(userId);
    const now = Date.now();

    // Check for daily reward
    if (now - user.last_daily > 24 * 60 * 60 * 1000) {
      addKeys(userId, 1);
      setLastDaily(userId);
      return interaction.reply({
        content: '🎁 Daily reward claimed! +1 🔑',
        ephemeral: true,
      });
    }

    const challenge = getDailyChallenge(userId);
    if (!challenge) {
      return interaction.reply({ content: '❌ No active challenge.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor(0xffd700)
      .setTitle('📅 Daily Challenge')
      .setDescription(`**${challenge.type.replace('_', ' ').toUpperCase()}**: ${challenge.progress}/${challenge.goal}`)
      .addFields(
        { name: 'Reward', value: challenge.reward, inline: true },
        { name: 'Time Left', value: `${Math.max(0, Math.floor((challenge.expires_at - now) / 3600000))}h`, inline: true },
      )
      .setFooter({ text: challenge.completed ? 'Completed!' : 'Keep going!' });

    return interaction.reply({ embeds: [embed], ephemeral: true });
  },
};