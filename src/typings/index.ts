import { CommandInteraction, ContextMenuCommandInteraction, MessageComponentInteraction, AutocompleteInteraction, Interaction, Snowflake } from 'discord.js';

export interface InteractionHandlerEvents {
	'command': (interaction: CommandInteraction) => void;
	'contextMenu': (interaction: ContextMenuCommandInteraction) => void;
	'messageComponent': (interaction: MessageComponentInteraction) => void;
	'autocomplete': (interaction: AutocompleteInteraction) => void;
	'ping': (interaction: Interaction) => void;
}

export interface GuildData {
	id: Snowflake;
}

export interface ListData {
	guild_id: Snowflake;
	list_id: number;
	name: string;
	createdAt: string;
	contents: string
	mediaOnly: 0 | 1;
	randomCooldown: number;
	randomImage: string | null;
	receiveRole: Snowflake;
	public: 0 | 1;
}