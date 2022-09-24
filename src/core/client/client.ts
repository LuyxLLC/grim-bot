import Database, { Database as DatabaseType } from 'better-sqlite3';
import { ClientOptions, EmbedBuilder } from 'discord.js';
import { CommanderClient, CommanderClientOptions, CommandHandler } from 'djs-commander';
import { InteractionHandler } from '../interaction_handler/index.js';
import { logger } from '../logging/index.js';

export class GrimBotClient extends CommanderClient {
	private readonly commandDirectory: string;

	public readonly commandHandler: CommandHandler;
	public readonly interactions: InteractionHandler;
	public readonly startTimestamp: number;
	public readonly db: DatabaseType;
	public debug: boolean;
	public ready: boolean;

	public constructor({ commandDirectory }: { commandDirectory: string }, commanderOptions: CommanderClientOptions, clientOptions: ClientOptions) {
		super(commanderOptions, clientOptions);

		this.commandDirectory = commandDirectory;
		this.db = new Database('./data/guildData.db');

		this.interactions = new InteractionHandler();
		this.startTimestamp = Date.now();
		this.commandHandler = new CommandHandler({
			client: this,
			callbacks: {
				async onNoPermissions(command, interaction): Promise<void> {
					await interaction.reply({
						embeds: [
							new EmbedBuilder()
								.setColor('Red')
								.setTitle('No Permission')
								.setDescription(`Sorry, the \`/${command.data.name}\` is for admins only.`),
						],
					});
				},
				async onNoSuperuser(): Promise<void> { },
				async onNoStaging(): Promise<void> { },
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

		this.on('interactionCreate', interaction => this.interactions.handleInteraction(interaction));

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
		superusers: ['519674801049042945', '292821168833036288', '480721662149656576'],
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