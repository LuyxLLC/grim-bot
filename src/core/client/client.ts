import Database, { Database as DatabaseType } from 'better-sqlite3';
import { ClientOptions, EmbedBuilder } from 'discord.js';
import { CommanderClient, CommanderClientOptions, CommandHandler } from '@countbot/djs-commander';
import { logger } from '../logging/index.js';

export class GrimBotClient extends CommanderClient {
  private readonly commandDirectory: string;

  public readonly commandHandler: CommandHandler;
  public readonly startTimestamp: number;
  public readonly db: DatabaseType;
  public debug: boolean;
  public ready: boolean;

  public constructor({ commandDirectory }: { commandDirectory: string; }, commanderOptions: CommanderClientOptions, clientOptions: ClientOptions) {
    super(commanderOptions, clientOptions);

    this.commandDirectory = commandDirectory;
    this.db = new Database('./data/guildData.db');

    this.startTimestamp = Date.now();
    this.commandHandler = new CommandHandler({
      client: this,
      callbacks: {
        async onNoSuperuser(): Promise<void> {},
        async onNoStaging(): Promise<void> {},
        async onCommandError(command, interaction): Promise<void> {
          await interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setColor('Red')
                .setTitle('Error')
                .setDescription('An error occurred. Please ignore this and it will be fixed soon.'),
            ],
          });
        },
      },
      logger,
    });

    this.debug = false;
    this.ready = false;

    this.on('interactionCreate', async interaction => {
      if (interaction.isChatInputCommand()) {
        await client.commandHandler.run(interaction.commandName, interaction);
      }
    });

  }

  public async loadCommands(): Promise<void> {
    await this.commandHandler.loadCommands(this.commandDirectory);
  }
}

export const client = new GrimBotClient(
  {
    commandDirectory: './build/commands',
  },
  {
    superUsers: ['519674801049042945', '292821168833036288', '480721662149656576'],
    stagingGuilds: [],
    privateGuilds: ['862796535246749697', '853062100674674689'],
    logger,
  },
  {
    intents: [
      'Guilds',
      'MessageContent',
      'GuildMessages',
    ],
  },
);
