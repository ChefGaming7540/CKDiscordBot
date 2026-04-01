const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUser, getInventory, getEquippedItem } = require('../database');
const { RARITIES } = require('../items');

const PAGE_SIZE = 10;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('inventory')
    .setDescription('View your unboxed item collection.')
    .addIntegerOption(opt =>
      opt.setName('page')
        .setDescription('Page number (default: 1)')
        .setMinValue(1)
    ),

  async execute(interaction) {
    const userId = interaction.user.id;
    const page   = (interaction.options.getInteger('page') ?? 1) - 1;
    const user   = getUser(userId);
    const items  = getInventory(userId);
    const equipped = getEquippedItem(userId);

    if (!items.length) {
      return interaction.reply({
        content: '🎒 Your inventory is empty. Open some crates with `/opencase`!',
        ephemeral: true,
      });
    }

    const totalPages = Math.ceil(items.length / PAGE_SIZE);
    const clampedPage = Math.min(page, totalPages - 1);
    const slice = items.slice(clampedPage * PAGE_SIZE, (clampedPage + 1) * PAGE_SIZE);

    // Count items per rarity for summary
    const rarityCount = {};
    for (const item of items) {
      rarityCount[item.rarity] = (rarityCount[item.rarity] ?? 0) + 1;
    }

    const rarityLine = Object.entries(rarityCount)
      .sort((a, b) => Object.keys(RARITIES).indexOf(a[0]) - Object.keys(RARITIES).indexOf(b[0]))
      .map(([r, c]) => `${RARITIES[r]?.emoji ?? '❓'} ${r}: **${c}**`)
      .join('  |  ');

    const itemLines = slice.map((item, i) => {
      const cfg    = RARITIES[item.rarity] ?? {};
      const effect = item.effect ? `*(${item.effect})* ` : '';
      const eq = item.equipped ? ' ⚔️' : '';
      return `\`#${item.id}\` \`${clampedPage * PAGE_SIZE + i + 1}.\` ${cfg.emoji ?? '❓'} ${effect}**${item.item_name}** — ${item.rarity}${eq}`;
    });

    const embed = new EmbedBuilder()
      .setColor(0x2f3136)
      .setTitle(`🎒 ${interaction.user.username}'s Inventory`)
      .setDescription(itemLines.join('\n'))
      .addFields(
        { name: 'Collection Summary', value: rarityLine || 'None', inline: false },
        { name: 'Equipped Item', value: equipped ? `${equipped.item_name} (${equipped.effect})` : 'None', inline: true },
        { name: 'Total Items',  value: `${items.length}`,    inline: true },
        { name: 'Keys',         value: `${user.keys} 🔑`,    inline: true },
        { name: 'Total Opens',  value: `${user.total_opens}`, inline: true },
        { name: 'Level',        value: `${user.level}`,      inline: true },
      )
      .setFooter({ text: `Page ${clampedPage + 1} of ${totalPages}` })
      .setTimestamp();

    return interaction.reply({ embeds: [embed], ephemeral: true });
  },
};