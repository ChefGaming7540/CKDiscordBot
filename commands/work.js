const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUser, addKeys, addCoins, setLastWork, addXP, updateChallengeProgress, getEquippedItem, addCrates } = require('../database');
const { getItemBonus } = require('../items');

// Config
const JOBS = {
  dockworker: { name: 'Dockworker', minCoins: 10, maxCoins: 20, xp: 10, cooldown: 60 * 60 * 1000 },
  miner: { name: 'Miner', minCoins: 20, maxCoins: 40, xp: 15, cooldown: 2 * 60 * 60 * 1000, levelReq: 2 },
  guard: { name: 'Guard', minCoins: 30, maxCoins: 50, xp: 20, cooldown: 3 * 60 * 60 * 1000, levelReq: 5 },
};
const FLAVOR_TEXTS = {
  dockworker: [
    'You hauled crates at the docks.',
    'You sorted shipments by the harbor.',
    'You loaded cargo onto ships.',
  ],
  miner: [
    'You dug deep in the mines.',
    'You extracted precious ores.',
    'You reinforced tunnel walls.',
  ],
  guard: [
    'You patrolled the streets.',
    'You stood watch at the gates.',
    'You protected valuable cargo.',
  ],
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('work')
    .setDescription('Work to earn crate keys. Choose a job!')
    .addStringOption(opt =>
      opt.setName('job')
        .setDescription('Job to perform (default: dockworker)')
        .addChoices(
          { name: 'Dockworker (10-20 coins, 1h)', value: 'dockworker' },
          { name: 'Miner (20-40 coins, 2h, Lv.2+)', value: 'miner' },
          { name: 'Guard (30-50 coins, 3h, Lv.5+)', value: 'guard' },
        )
    ),

  async execute(interaction) {
    const userId = interaction.user.id;
    const jobType = interaction.options.getString('job') || 'dockworker';
    const job = JOBS[jobType];
    const user = getUser(userId);
    const now = Date.now();

    if (user.level < (job.levelReq || 1)) {
      return interaction.reply({
        content: `🔒 You need to be level ${job.levelReq} to do this job!`,
        ephemeral: true,
      });
    }

    const diff = now - user.last_work;
    if (diff < job.cooldown) {
      const remaining = job.cooldown - diff;
      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      return interaction.reply({
        content: `⏳ You're still recovering from work. Come back in **${mins}m ${secs}s**.`,
        ephemeral: true,
      });
    }

    // Mini-game: Simple math question (addition)
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const answer = num1 + num2;

    const questionMessage = await interaction.reply({
      content: `🧮 **Work quiz:** What is **${num1} + ${num2}**? Reply to this message with the number. You have **15 seconds**!`,
      fetchReply: true,
    });

    const filter = (m) => m.author.id === userId && m.reference?.messageId === questionMessage.id;
    let collected;

    try {
      collected = await interaction.channel.awaitMessages({ filter, max: 1, time: 15000, errors: ['time'] });
    } catch {
      return questionMessage.edit('⏰ Time is up! You did not answer in time. Try again later.');
    }

    const userAnswer = parseInt(collected.first().content);
    if (Number.isNaN(userAnswer) || userAnswer !== answer) {
      return interaction.followUp({ content: '❌ Incorrect answer. Work failed this time. Try again in another cooldown.', ephemeral: true });
    }

    // success: award user
    const equipped = getEquippedItem(userId);
    const bonus = equipped ? getItemBonus(equipped.effect) : {};
    const baseEarned = Math.floor(Math.random() * (job.maxCoins - job.minCoins + 1)) + job.minCoins;
    const earned = Math.floor(baseEarned * (1 + (bonus.workBoost || 0) / 100));

    addCoins(userId, earned); // coins for work reward
    addCoins(userId, Math.floor(job.xp / 2) + 5); // coins reward: base
    addXP(userId, job.xp);
    setLastWork(userId);
    updateChallengeProgress(userId, 'work');

    const flavor = FLAVOR_TEXTS[jobType][Math.floor(Math.random() * FLAVOR_TEXTS[jobType].length)];
    const updated = getUser(userId);

    const embed = new EmbedBuilder()
      .setColor(0xf0c040)
      .setTitle(`💼 ${job.name} Complete!`)
      .setDescription(`*${flavor}*\n\n🧠 You answered correctly!`)
      .addFields(
        { name: 'Earned', value: `+${earned} 💰${bonus.workBoost ? ` (+${bonus.workBoost}% bonus)` : ''}`, inline: true },
        { name: 'XP Gained', value: `+${job.xp}`, inline: true },
        { name: 'Total Coins', value: `${updated.coins} 💰`, inline: true },
        { name: 'Level', value: `${updated.level}`, inline: true },
      )
      .setFooter({ text: `Next work in ${job.cooldown / 3600000}h.` })
      .setTimestamp();

    return interaction.followUp({ embeds: [embed] });
  },
};