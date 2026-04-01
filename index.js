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

// ── Events ────────────────────────────────────────────────────────────────────
const eventsPath = join(__dirname, 'events');
const eventFiles = readdirSync(eventsPath).filter(f => f.endsWith('.js'));

for (const file of eventFiles) {
  const event = await import(join(eventsPath, file));
  const handler = (...args) => event.default.execute(...args);

  if (event.default.once) {
    client.once(event.default.name, handler);
  } else {
    client.on(event.default.name, handler);
  }
  console.log(`  ✔ Registered event: ${event.default.name}`);
}

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