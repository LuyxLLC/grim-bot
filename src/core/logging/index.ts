import { Logger, Verbosity } from 'loggage';

export const logger = new Logger({
	name: 'GrimBot',
	verbosity: Verbosity.VERBOSE,
});