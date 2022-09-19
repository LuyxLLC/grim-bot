import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { Command, CommandMode } from 'djs-commander';
import { client } from '../core/client/client.js';
import { ListData } from '../typings/index.js';

export default new Command({
	data: new SlashCommandBuilder()
		.setName('lists')
		.setDescription('View all lists')
		.toJSON(),
	category: 'List',
	ephemeral: false,
	mode: CommandMode.RELEASE,
	permissions: {
		permissions: [],
		superuserOnly: false,
	},
	execute: async (interaction): Promise<void> => {
		const lists = client.db.prepare('SELECT * FROM lists WHERE guild_id=?').all(interaction.guildId) as ListData[];

		return void await interaction.editReply({
			embeds: [
				new EmbedBuilder()
					.setColor('Green')
					.setTitle('Lists')
					.setDescription(lists.map(l => `- ${l.name}`).join('\n')),
			],
		});
	},
});