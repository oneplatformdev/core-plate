import { isAbsolute } from 'node:path';

const INTERNAL_ALIASES = [
	'@op/',
	'@oneplatformdev/plate/'
];

export const external = (id: string, importer?: string) => {
	if (!importer) return false;
	if (isAbsolute(id)) return false;
	if (id.startsWith('.') || id.startsWith('/')) return false;
	if (INTERNAL_ALIASES.some((p) => id.startsWith(p))) return false;
	return true;
};
