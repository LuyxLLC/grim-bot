import { Interaction, InteractionType } from 'discord.js';
import { TypedEmitter } from 'tiny-typed-emitter';
import { InteractionHandlerEvents } from '../../../typings/index.js';

export class InteractionHandler extends TypedEmitter<InteractionHandlerEvents> {
	public handleInteraction(interaction: Interaction): void {
		if (interaction.type === InteractionType.ApplicationCommand && interaction.inGuild())
			this.emit('command', interaction);

		else if (interaction.isUserContextMenuCommand())
			this.emit('contextMenu', interaction);

		else if (interaction.type === InteractionType.MessageComponent)
			this.emit('messageComponent', interaction);

		else if (interaction.type === InteractionType.ApplicationCommandAutocomplete)
			this.emit('autocomplete', interaction);
	}
}