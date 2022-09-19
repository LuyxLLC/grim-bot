import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { Command, CommandMode } from 'djs-commander';

export default new Command({
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Help for using the bot')
		.toJSON(),
	category: 'List',
	ephemeral: false,
	mode: CommandMode.RELEASE,
	permissions: {
		permissions: [],
		superuserOnly: false,
	},
	execute: async (interaction): Promise<void> => {

		return void await interaction.editReply({
			embeds: [
				new EmbedBuilder()
					.setColor('Green')
					.setTitle('Help Menu')
					.setDescription([
						'To create a list, type: `/list create <list name> [media] [public]`',
						'The `media` option is a true/false if the list is only images/gifs.',
						'The `public` option is not yet implemented.',
						'',
						'To edit a list, type: `/list edit <list name> <operation> <value>',
						'The `operation` is whether or not you are adding or removing an item for a list.',
						'The `value` is whatever value you are adding or removing.',
						'',
						'To delete a list, type: `/list delete <list name>`. This cannot be undone.',
						'',
						'To add a large number of items to a list. Contact Fyrlex#2740',
					].join('\n')),
			],
		});
	},
});