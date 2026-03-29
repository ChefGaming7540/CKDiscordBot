const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUser, addKeys, setLastWork } = require('../database');

// Config
const COOLDOWN_MS  = 60 * 60 * 1000; // 1 hour
const MIN_KEYS     = 1;
const MAX_KEYS     = 2;
const FLAVOR_TEXTS = [
  'You hauled crates at the docks.',
  'You ran deliveries across town.',
  'You fixed machinery in a dark warehouse.',
  'You guarded a shipment overnight.',
  'You sorted items at the market.',
  'You scrubbed floors at the key shop.',
  'You drove a forklift for 8 hours.',
  'You helped a mysterious merchant.',
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('work')
    .setDescription('Work to earn crate keys. Usable once per hour.'),

  async execute(interaction) {
    const userId = interaction.user.id;
    const user   = getUser(userId);
    const now    = Date.now();
    const diff   = now - user.last_work;

    if (diff < COOLDOWN_MS) {
      const remaining = COOLDOWN_MS - diff;
      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      return interaction.reply({
        content: `⏳ You're still tired from working. Come back in **${mins}m ${secs}s**.`,
        ephemeral: true,
      });
    }

    const earned = Math.floor(Math.random() * (MAX_KEYS - MIN_KEYS + 1)) + MIN_KEYS;
    addKeys(userId, earned);
    setLastWork(userId);

    const flavor  = FLAVOR_TEXTS[Math.floor(Math.random() * FLAVOR_TEXTS.length)];
    const updated = getUser(userId);

    const embed = new EmbedBuilder()
      .setColor(0xf0c040)
      .setTitle('💼 Work Complete!')
      .setDescription(`*${flavor}*`)
      .addFields(
        { name: 'Earned',    value: `+${earned} 🔑`,           inline: true },
        { name: 'Total Keys', value: `${updated.keys} 🔑`,     inline: true },
      )
      .setFooter({ text: 'You can work again in 1 hour.' })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  },
};