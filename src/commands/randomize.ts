import { ChatInputCommandInteraction, EmbedBuilder, GuildMember, SlashCommandBuilder } from 'discord.js';
import { Command, CommandMode } from 'djs-commander';
import { client } from '../core/client/client.js';
import { ListData } from '../typings/index.js';

export default new Command({
	data: new SlashCommandBuilder()
		.setName('randomize')
		.setDescription('Randomize a list')
		.addStringOption(input => input
			.setName('list')
			.setDescription('Name of list to randomize')
			.setRequired(true))
		.addIntegerOption(input => input
			.setName('results')
			.setDescription('Number of random results'))
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

		const listName = (interaction as ChatInputCommandInteraction).options.getString('list', true);

		if (!lists.find(list => list.name.toLowerCase() === listName.toLowerCase())) {
			return void interaction.editReply({
				embeds: [
					new EmbedBuilder()
						.setTitle('List Does Not Exist')
						.setDescription(`There does not appear to be a list with the name **${listName}**.`),
				],
			});
		}

		const { contents, randomImage, mediaOnly, receiveRole } = lists.find(list => list.name.toLowerCase() === listName.toLowerCase())!;

		await (interaction.member as GuildMember).roles.add(receiveRole);

		const parsed = JSON.parse(contents) as string[];

		let results = (interaction as ChatInputCommandInteraction).options.getInteger('results') ?? 1;

		if (mediaOnly && results !== 1) {
			return void await interaction.editReply({
				embeds: [
					new EmbedBuilder()
						.setColor('Red')
						.setTitle('Invalid Number')
						.setDescription('Results can only be **1** for **media only** lists.'),
				],
			});
		}

		if (results > parsed.length) {
			return void await interaction.editReply({
				embeds: [
					new EmbedBuilder()
						.setColor('Red')
						.setTitle('Invalid Number')
						.setDescription(`Please enter a value between **1** and **${parsed.length}**.`),
				],
			});
		}

		const message = await interaction.editReply({
			embeds: [
				new EmbedBuilder()
					.setColor('Green')
					.setTitle('Randomizing...')
					.setDescription(`Randomizing the **${listName}** list...`)
					.setImage(randomImage),
			],
		});

		const randomized: string[] = [];

		for (let i = 0; i < results; i++) {
			const randomitem = parsed[Math.floor(Math.random() * parsed.length)]!;

			if (randomized.includes(randomitem)) {
				results++;
				continue;
			}

			randomized.push(randomitem);
		}

		setTimeout(async () => {
			await message.edit({
				embeds: [
					new EmbedBuilder()
						.setTitle('Randomization Complete')
						.setColor('Green')
						.setDescription([
							'**Random Item(s):**',
							`${!mediaOnly ? randomized.map(i => `**-** ${i}`).join('\n') : ''}`].join('\n'))
						.setImage(mediaOnly ? randomized[0]! : null),
				],
			});
		}, 3000);
	},
});