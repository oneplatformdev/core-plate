const INTERNAL_ALIASES = [
	'@op/',
	'@oneplatformdev/plate/'
];

export const external = (id: string) => {
	if (id.startsWith('.') || id.startsWith('/')) return false;
	if (INTERNAL_ALIASES.some((p) => id.startsWith(p))) return false;
	return true;
};
