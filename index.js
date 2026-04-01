const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
client.commands = new Collection();

// Load commands
const commandFiles = fs.readdirSync('./commands').filter(f => f.endsWith('.js'));
const commandData = [];
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
  commandData.push(command.data.toJSON());
}

client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  // ── Load Commands ─────────────────────────────────────────────────────────────
const commandFolders = ['moderation', 'tickets', 'fun', 'utility'];

for (const folder of commandFolders) {
  const folderPath = join(__dirname, 'commands', folder);

  for (const file of files) {
    const command = await import(join(folderPath, file));
    if (command.data && command.execute) {
      client.commands.set(command.data.name, command);
      console.log(`  ✔ Loaded command: /${command.data.name}`);
    }
  }
}

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;
  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(err);
    const msg = { content: '❌ An error occurred.', ephemeral: true };
    interaction.replied ? interaction.followUp(msg) : interaction.reply(msg);
  }
});
});

client.login(process.env.BOT_TOKEN);