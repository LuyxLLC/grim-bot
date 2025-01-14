import { logger } from './core/logging/index.js';
import { client } from './core/client/client.js';
import { DISCORD_TOKEN } from './core/constants.js';

logger.setName('GrimBot');

process.on('uncaughtExceptionMonitor', err => {
  logger.fatal_error(err);
});

await client.loadCommands();

client.on('ready', () => {
  logger.info('Ready event run!');
});

client.login(DISCORD_TOKEN);
