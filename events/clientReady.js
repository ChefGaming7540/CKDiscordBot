import { Events, ActivityType } from 'discord.js';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';

export default {
  name: Events.ClientReady,
  once: true,

  async execute(client) {
    console.log(`✅ Logged in as ${client.user.tag}`);
    console.log(`📡 Serving ${client.guilds.cache.size} guild(s)\n`);

    client.user.setPresence({
      activities: [{ name: "Chef's Kitchen 🍳", type: ActivityType.Watching }],
      status: 'idle',
    })
  }
};