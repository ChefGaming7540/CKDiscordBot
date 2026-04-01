const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUser, addKeys, setLastWork } = require('../database');

// Config
const JOBS = {
  dockworker: { name: 'Dockworker', minKeys: 1, maxKeys: 2, xp: 10, cooldown: 60 * 60 * 1000 },
  miner: { name: 'Miner', minKeys: 2, maxKeys: 4, xp: 15, cooldown: 2 * 60 * 60 * 1000, levelReq: 2 },
  guard: { name: 'Guard', minKeys: 3, maxKeys: 5, xp: 20, cooldown: 3 * 60 * 60 * 1000, levelReq: 5 },
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
          { name: 'Dockworker (1-2 keys, 1h)', value: 'dockworker' },
          { name: 'Miner (2-4 keys, 2h, Lv.2+)', value: 'miner' },
          { name: 'Guard (3-5 keys, 3h, Lv.5+)', value: 'guard' },
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

    // Mini-game: Simple math question
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const answer = num1 + num2;

    await interaction.reply({
      content: `🧮 Quick math: What is ${num1} + ${num2}? **Reply with just the number!** You have 10 seconds!`,
      ephemeral: true,
    });

    const filter = (m) => m.author.id === userId;
    try {
      const collected = await interaction.channel.awaitMessages({ filter, max: 1, time: 10000, errors: ['time'] });
      const userAnswer = parseInt(collected.first().content);
      if (userAnswer !== answer) {
        return interaction.editReply('❌ Wrong answer! Try again later.');
      }
    } catch {
      return interaction.editReply('⏰ Time\'s up! Try again later.');
    }

    // Calculate earnings with bonus
    const equipped = getEquippedItem(userId);
    const bonus = equipped ? getItemBonus(equipped.effect) : {};
    const baseEarned = Math.floor(Math.random() * (job.maxKeys - job.minKeys + 1)) + job.minKeys;
    const earned = Math.floor(baseEarned * (1 + (bonus.workBoost || 0) / 100));

    addKeys(userId, earned);
    addXP(userId, job.xp);
    setLastWork(userId);
    updateChallengeProgress(userId, 'work');

    const flavor = FLAVOR_TEXTS[jobType][Math.floor(Math.random() * FLAVOR_TEXTS[jobType].length)];
    const updated = getUser(userId);

    const embed = new EmbedBuilder()
      .setColor(0xf0c040)
      .setTitle(`💼 ${job.name} Complete!`)
      .setDescription(`*${flavor}*\n\n🧠 You solved the math puzzle!`)
      .addFields(
        { name: 'Earned', value: `+${earned} 🔑${bonus.workBoost ? ` (+${bonus.workBoost}% bonus)` : ''}`, inline: true },
        { name: 'XP Gained', value: `+${job.xp}`, inline: true },
        { name: 'Total Keys', value: `${updated.keys} 🔑`, inline: true },
        { name: 'Level', value: `${updated.level}`, inline: true },
      )
      .setFooter({ text: `Next work in ${job.cooldown / 3600000}h.` })
      .setTimestamp();

    return interaction.editReply({ embeds: [embed] });
  },
};