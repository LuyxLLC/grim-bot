import { logger } from './core/logging/index.js';
import { ActivityType } from 'discord.js';
import { client } from './core/client/client.js';
import { DISCORD_TOKEN } from './core/constants.js';

logger.setName('GrimBot #' + client.shard?.ids[0]);

process.on('uncaughtExceptionMonitor', err => {
	logger.fatal_error(err);
});

await client.loadCommands();

client.on('ready', () => {
	client.user!.setActivity('Early Access', { type: ActivityType.Watching });
});

client.interactions.on('command', interaction => {
	client.commandHandler.run(interaction.commandName, interaction);
});

client.login(DISCORD_TOKEN);