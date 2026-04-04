const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUser, addKeys, removeKeys } = require('../database');
const { addItem, openCrate } = require('../items');

// ── Slot symbols ──────────────────────────────────────────────────────────────
// weight: higher = more common on the reels
// payout: key multiplier on three-of-a-kind (0 = no key payout, awards item instead)
const SYMBOLS = [
  { emoji: '🍋', label: 'Lemon',    weight: 30, payout: 0   },
  { emoji: '🍒', label: 'Cherry',   weight: 25, payout: 0   },
  { emoji: '🍇', label: 'Grape',    weight: 20, payout: 2   },
  { emoji: '🔔', label: 'Bell',     weight: 12, payout: 3   },
  { emoji: '💎', label: 'Diamond',  weight: 8,  payout: 5   },
  { emoji: '🌟', label: 'Star',     weight: 4,  payout: 10  },
  { emoji: '🎁', label: 'Crate',    weight: 2,  payout: 0   }, // awards a free item!
];

// Two-of-a-kind pays back the key cost (net 0)
const TWO_OF_A_KIND_REFUND = true;

// ── Helpers ───────────────────────────────────────────────────────────────────

function weightedPick(symbols) {
  const total = symbols.reduce((s, sym) => s + sym.weight, 0);
  let roll = Math.random() * total;
  for (const sym of symbols) {
    roll -= sym.weight;
    if (roll <= 0) return sym;
  }
  return symbols[symbols.length - 1];
}

function spinReels() {
  return [weightedPick(SYMBOLS), weightedPick(SYMBOLS), weightedPick(SYMBOLS)];
}

function evaluate(reels) {
  const [a, b, c] = reels;
  const labels = reels.map(r => r.label);
  const unique  = new Set(labels).size;

  if (unique === 1) {
    // Three of a kind
    if (a.label === 'Crate') return { type: 'crate',    message: '🎁 **CRATE DROP!** You won a free item!' };
    if (a.payout > 0)        return { type: 'keys',     payout: a.payout, message: `💰 **JACKPOT!** You won **${a.payout} keys**!` };
    return { type: 'nothing', message: '😬 Three of a kind... but no payout on that symbol.' };
  }
  if (unique === 2 && TWO_OF_A_KIND_REFUND) {
    return { type: 'refund', message: '😅 Two of a kind — key refunded.' };
  }
  return { type: 'nothing', message: '💸 No match. Better luck next time!' };
}

// ── Spinning animation frames ─────────────────────────────────────────────────
// We'll edit the message a couple of times to fake a spin

async function sendSpinFrame(interaction, reels, label, color = 0x2f3136) {
  const display = reels.map(r => r.emoji).join('  |  ');
  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle('🎰 Slots')
    .setDescription(`## ${display}\n\n*${label}*`);
  return embed;
}

// ── Command ───────────────────────────────────────────────────────────────────

module.exports = {
  data: new SlashCommandBuilder()
    .setName('slots')
    .setDescription('Spend a key to spin the slots. Match symbols to win keys or items!')
    .addIntegerOption(opt =>
      opt.setName('keys')
        .setDescription('How many keys to bet (each spin costs 1 key, default 1)')
        .setMinValue(1)
        .setMaxValue(5)
    ),

  async execute(interaction) {
    const userId = interaction.user.id;
    const spins  = interaction.options.getInteger('keys') ?? 1;
    const user   = getUser(userId);

    if (user.keys < spins) {
      return interaction.reply({
        content: `🔑 You only have **${user.keys}** key(s) but tried to bet **${spins}**. Earn more with \`/work\`!`,
        ephemeral: true,
      });
    }

    // Deduct all bet keys up front
    removeKeys(userId, spins);

    // ── Spin animation ──
    const spinEmoji = ['🎰', '🎲', '🎳'];
    const placeholder = SYMBOLS.map(s => s.emoji);
    const blankReels  = [
      { emoji: '❓' }, { emoji: '❓' }, { emoji: '❓' }
    ];

    const spinningEmbed = new EmbedBuilder()
      .setColor(0xf0c040)
      .setTitle('🎰 Slots — Spinning...')
      .setDescription(`## ❓  |  ❓  |  ❓\n\n*Good luck...*`);

    const msg = await interaction.reply({ embeds: [spinningEmbed], fetchReply: true });

    // Small artificial delay for drama
    await new Promise(r => setTimeout(r, 900));

    // ── Resolve all spins ──
    const results = [];
    let totalKeyWin = 0;
    let gotItem     = false;
    let refunds     = 0;

    for (let i = 0; i < spins; i++) {
      const reels  = spinReels();
      const result = evaluate(reels);
      results.push({ reels, result });

      if (result.type === 'keys')   { addKeys(userId, result.payout); totalKeyWin += result.payout; }
      if (result.type === 'crate')  { const item = openCrate(); addItem(userId, item); gotItem = true; }
      if (result.type === 'refund') { addKeys(userId, 1); refunds++; }
    }

    // ── Build result embed ──
    const finalUser = getUser(userId);

    let resultLines = results.map(({ reels, result }, i) => {
      const display = reels.map(r => r.emoji).join(' | ');
      return `**Spin ${i + 1}:** ${display} — ${result.message}`;
    });

    let summaryColor = 0x2f3136;
    let summaryTitle = '🎰 Slots — Results';
    if (totalKeyWin >= 10)         { summaryColor = 0xff8c00; summaryTitle = '🌟 MEGA WIN!'; }
    else if (totalKeyWin > 0)      { summaryColor = 0x57f287; summaryTitle = '🎰 Winner!'; }
    else if (gotItem)              { summaryColor = 0xff8c00; summaryTitle = '🎁 Crate Drop!'; }
    else if (refunds === spins)    { summaryColor = 0xf0c040; }

    const summaryParts = [];
    if (totalKeyWin > 0) summaryParts.push(`🔑 **+${totalKeyWin} keys** won`);
    if (gotItem)         summaryParts.push(`🎁 **Free item** added to inventory`);
    if (refunds > 0)     summaryParts.push(`↩️ **${refunds} key(s) refunded**`);
    if (!summaryParts.length) summaryParts.push('No winnings this time.');

    const finalEmbed = new EmbedBuilder()
      .setColor(summaryColor)
      .setTitle(summaryTitle)
      .setDescription(resultLines.join('\n'))
      .addFields(
        { name: 'Result',    value: summaryParts.join('\n'),      inline: false },
        { name: 'Keys Left', value: `${finalUser.keys} 🔑`,       inline: true  },
      )
      .setFooter({ text: `${interaction.user.username} • Bet ${spins} key(s)` })
      .setTimestamp();

    await interaction.editReply({ embeds: [finalEmbed] });
  },
};
