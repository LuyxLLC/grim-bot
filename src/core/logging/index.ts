import { Loggage, Verbosity } from '@countbot/loggage';

export const logger = new Loggage({
	name: 'GrimBot',
	verbosity: Verbosity.VERBOSE,
});
