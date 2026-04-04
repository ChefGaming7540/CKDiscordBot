require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const fs = require('fs');
const path = require('path');

// ── Client Setup ──────────────────────────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});
client.commands = new Collection();

// ── Load Commands ─────────────────────────────────────────────────────────────
console.log('\n🔧 Loading commands...');
const commandFiles = fs.readdirSync('./commands').filter(f => f.endsWith('.js'));
const commandData = [];

for (const file of commandFiles) {
  try {
    const command = require(path.join(__dirname, 'commands', file));

    if (command.data && command.execute) {
      client.commands.set(command.data.name, command);
      commandData.push(command.data.toJSON());
      console.log(`  ✔ Loaded command: /${command.data.name}`);
    } else {
      console.warn(`  ⚠ Skipped ${file} — missing 'data' or 'execute' export`);
    }
  } catch (err) {
    console.error(`  ✖ Failed to load ${file}:`, err.message);
  }
}

console.log(`\n📦 ${client.commands.size} command(s) loaded.\n`);

// ── Ready & Command Registration ──────────────────────────────────────────────
client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);
  try {
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commandData }
    );
    console.log('✅ Slash commands registered.');
  } catch (err) {
    console.error('Failed to register commands:', err);
  }
});

// ── Interactions ──────────────────────────────────────────────────────────────
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(`✖ Error in /${interaction.commandName}:`, err.message);
    const msg = { content: '❌ An error occurred.', ephemeral: true };
    interaction.replied || interaction.deferred
      ? interaction.followUp(msg)
      : interaction.reply(msg);
  }
});

// ── Login ─────────────────────────────────────────────────────────────────────
client.login(process.env.BOT_TOKEN);