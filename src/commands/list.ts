import { AttachmentBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { Command, CommandMode } from '@countbot/djs-commander';
import { client } from '../core/client/client.js';
import { ListData } from '../typings/index.js';
import isImageUrl from 'is-image-url';

export default new Command({
  data: new SlashCommandBuilder()
    .setName('list')
    .setDescription('Manage your lists')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(subCommand => subCommand
      .setName('create')
      .setDescription('Create a list')
      .addStringOption(input => input
        .setName('list')
        .setDescription('Name of the list')
        .setRequired(true))
      .addBooleanOption(input => input
        .setName('media')
        .setDescription('If this list is media only (images/gifs)'))
      .addBooleanOption(input => input
        .setName('public')
        .setDescription('Whether or not the contents of the list are public. Default value: false')))
    .addSubcommand(subCommand => subCommand
      .setName('delete')
      .setDescription('Delete a list')
      .addStringOption(input => input
        .setName('list')
        .setDescription('Name of the list')
        .setRequired(true)))
    .addSubcommand(subCommand => subCommand
      .setName('edit')
      .setDescription('Edit a list')
      .addStringOption(input => input
        .setName('list')
        .setDescription('Name of the list')
        .setRequired(true))
      .addStringOption(input => input
        .setName('operation')
        .setDescription('Choose how to edit a list')
        .setRequired(true)
        .addChoices(
          { name: 'add', value: 'add' },
          { name: 'remove', value: 'remove' },
          { name: 'randomImage', value: 'randomImage' },
          { name: 'receiveRole', value: 'receiveRole' },
        ))
      .addStringOption(input => input
        .setName('value')
        .setDescription('Value for the operation')
        .setRequired(true)))
    .addSubcommand(subCommand => subCommand
      .setName('view')
      .setDescription('View the contents of a list')
      .addStringOption(input => input
        .setName('list')
        .setDescription('Name of the list')
        .setRequired(true))
      .addIntegerOption(input => input
        .setName('page')
        .setDescription('Page number'),
      ))
    .toJSON(),
  category: 'List',
  ephemeral: true,
  mode: CommandMode.RELEASE,
  superUserOnly: false,
  execute: async (interaction): Promise<void> => {
    switch ((interaction as ChatInputCommandInteraction).options.getSubcommand()) {
      case 'create': {
        const lists = client.db.prepare('SELECT * FROM lists WHERE guild_id=?').all(interaction.guildId) as ListData[];

        const listName = (interaction as ChatInputCommandInteraction).options.getString('list', true);

        if (lists.find(list => list.name.toLowerCase() === listName.toLowerCase())) {
          return void interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setTitle('List Name Already Exists')
                .setDescription([
                  `There already exists a list with the name \`${listName}\`.`,
                  `You can edit the name of the list using \`/list edit ${listName} name\`.`,
                ].join('\n')),
            ],
          });
        }

        const publicOption = (interaction as ChatInputCommandInteraction).options.getBoolean('public');
        const mediaOption = (interaction as ChatInputCommandInteraction).options.getBoolean('media');

        client.db.prepare('INSERT INTO lists (guild_id, list_id, name, createdAt, mediaOnly, public) VALUES (?,?,?,?,?,?)').run(interaction.guildId, lists.length, listName, Date.now(), mediaOption ? 1 : 0, publicOption ? 1 : 0);

        return void interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle('List Created')
              .setDescription(`You created a new ${publicOption ? 'public' : 'private'} ${mediaOption ? 'media' : 'text'} list called **${listName}**.`),
          ],
        });
      }

      case 'delete': {
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

        const list = lists.find(list => list.name.toLowerCase() === listName.toLowerCase())!;

        client.db.prepare('DELETE FROM lists WHERE guild_id=? AND list_id=?').run(interaction.guildId, list.list_id);

        return void interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle('List Created')
              .setDescription(`You deleted the list **${listName}**.`),
          ],
        });
      }

      case 'edit': {
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

        const { contents, list_id, name, mediaOnly } = lists.find(list => list.name.toLowerCase() === listName.toLowerCase())!;

        const operation = (interaction as ChatInputCommandInteraction).options.getString('operation', true);
        const value = (interaction as ChatInputCommandInteraction).options.getString('value', true);

        switch (operation) {
          case 'add': {

            if (mediaOnly && !isImageUrl(value, true)) {
              return void await interaction.editReply({
                embeds: [
                  new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('Invalid Item')
                    .setDescription('This list is **media only**. Please enter a valid image/gif URL.'),
                ],
              });
            }

            await interaction.editReply({
              embeds: [
                new EmbedBuilder()
                  .setTitle('Add Items')
                  .setDescription('Please take up to 30 seconds to enter in a value to add to the end of the list'),
              ],
            });

            if (value.length > 120) {
              return void interaction.editReply({
                embeds: [
                  new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('Item is too long. Please keep it at or under 120 characters'),
                ],
              });
            }

            const parsed = (JSON.parse(contents) as string[]);
            parsed.push(value);

            client.db.prepare('UPDATE lists SET contents=? WHERE guild_id=? AND list_id=?').run(JSON.stringify(parsed), interaction.guildId, list_id);

            return void interaction.editReply({
              embeds: [
                new EmbedBuilder()
                  .setColor('Green')
                  .setTitle('Item Added')
                  .setDescription(`You successfully added the item **${value}** to the **${name}** list.`),
              ],
            });
          }

          case 'remove': {
            await interaction.editReply({
              embeds: [
                new EmbedBuilder()
                  .setTitle('Remove Items')
                  .setDescription('Please take up to 30 seconds to enter in a value to remove from the list'),
              ],
            });

            const index = parseInt(value);

            if (index < 1 || index > (JSON.parse(contents) as string[]).length) {
              return void interaction.editReply({
                embeds: [
                  new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('Item does not exist. Check spelling and case.'),
                ],
              });
            }

            const parsed = (JSON.parse(contents) as string[]);
            parsed.splice(index - 1, 1);

            client.db.prepare('UPDATE lists SET contents=? WHERE guild_id=? AND list_id=?').run(JSON.stringify(parsed), interaction.guildId, list_id);

            return void interaction.editReply({
              embeds: [
                new EmbedBuilder()
                  .setColor('Green')
                  .setTitle('Item Removed')
                  .setDescription(`You successfully removed item **#${index}** from the **${name}** list.`),
              ],
            });
          }

          case 'randomImage': {
            if (value === 'clear') {
              return void await interaction.editReply({
                embeds: [
                  new EmbedBuilder()
                    .setColor('Green')
                    .setTitle('Randomizer Image Reset')
                    .setDescription(`There is no longer an image/gif for the **${name}** list!`),
                ],
              });
            }

            if (isImageUrl(value, true)) {
              client.db.prepare('UPDATE lists SET randomImage=? WHERE guild_id=? AND list_id=?').run(value, interaction.guildId, list_id);

              return void await interaction.editReply({
                embeds: [
                  new EmbedBuilder()
                    .setColor('Green')
                    .setTitle('Randomizer Image Updated')
                    .setDescription(`The image/gif for **${name}** list has been updated to the following:`)
                    .setImage(value),
                ],
              });
            }

            return void await interaction.editReply({
              embeds: [
                new EmbedBuilder()
                  .setColor('Red')
                  .setTitle('Invalid URL')
                  .setDescription('Please try again and provide a valid image/gif URL.'),
              ],
            });
          }

          case 'receiveRole': {
            const role = await interaction.guild?.roles.fetch(value);

            if (role?.name) {
              return void await interaction.editReply({
                embeds: [
                  new EmbedBuilder()
                    .setColor('Green')
                    .setTitle('Receive Role')
                    .setDescription([
                      `You set the role for **${listName}** to **${role.name}**.`,
                      '',
                      'Please make sure the bot can give users this role. Make sure this is a safe role to give!',
                    ].join('\n')),
                ],
              });
            }

            return void await interaction.editReply({
              embeds: [
                new EmbedBuilder()
                  .setColor('Red')
                  .setTitle('Invalid Role')
                  .setDescription('An invalid role ID was provided. Please make sure it is correct.'),
              ],
            });
          }
        }
      } break;

      case 'view': {
        const lists = client.db.prepare('SELECT * FROM lists WHERE guild_id=?').all(interaction.guildId) as ListData[];

        const listName = (interaction as ChatInputCommandInteraction).options.getString('list', true);

        if (!lists.find(list => list.name.toLowerCase() === listName.toLowerCase())) {
          return void interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setTitle('List Does Not Exist')
                .setDescription([
                  `There does not appear to be a list with the name **${listName}**.`,
                  '',
                  '**Available Lists**',
                  `${lists.map(l => `- ${l.name}`)}`,
                ].join('\n')),
            ],
          });
        }

        const { contents, mediaOnly } = lists.find(list => list.name.toLowerCase() === listName.toLowerCase())!;
        const parsed = (JSON.parse(contents) as string[]);
        const size = parsed.length === 0 ? 1 : parsed.length;
        const pages = size / 10;
        const fullPages = Math.floor(pages);
        const totalPages = Math.ceil(pages);

        const page = (interaction as ChatInputCommandInteraction).options.getInteger('page') ?? 1;

        if (isNaN(page) || page > totalPages || page < 1) {
          return void await interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setColor('Red')
                .setDescription(`Invalid page count provided. Please select between **1** and **${totalPages}**.`),
            ],
          });
        }

        const lastitemindex = page * 10;
        const pageItems: string[] = [];

        for (const map of parsed) {
          if (page === totalPages) {
            if (parsed.indexOf(map) + 1 <= size && parsed.indexOf(map) + 1 > fullPages * 10) {
              pageItems.push(map);
            }
          }

          if (parsed.indexOf(map) + 1 <= lastitemindex && parsed.indexOf(map) + 1 > lastitemindex - 10) {
            if (!pageItems.includes(map)) {
              pageItems.push(map);
            }
          }
        }

        return void interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle(`View List - ${listName}`)
              .setDescription(pageItems.length && !mediaOnly ? pageItems.map((i: string) => `**•** ${i}`).join('\n') : `This list is empty or media only (attatchments above). Add items with \`/list edit ${listName} add\``),
          ],
          files: pageItems.map<AttachmentBuilder>(i => new AttachmentBuilder(i)).slice(),
        });
      }
    }
  },
});
