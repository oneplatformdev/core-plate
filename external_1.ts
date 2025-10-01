const PKGS = [
	"react", "react-dom",

	"prismjs",

	"@oneplatformdev/ui",

	"@udecode/plate-core",
	"@udecode/plate-common",
	"@udecode/plate-basic-marks",
	"@udecode/plate-block-quote",
	"@udecode/plate-code-block",
	"@udecode/plate-date",
	"@udecode/plate-font",
	"@udecode/plate-heading",
	"@udecode/plate-horizontal-rule",
	"@udecode/plate-indent",
	"@udecode/plate-indent-list",
	"@udecode/plate-kbd",
	"@udecode/plate-layout",
	"@udecode/plate-link",
	"@udecode/plate-media",
	"@udecode/plate-mention",
	"@udecode/plate-table",
	"@udecode/plate-toggle",
	"@udecode/slate", "@udecode/slate-react",
	"slate", "slate-dom", "slate-history", "slate-hyperscript",

	"@radix-ui/react-accordion",
	"@radix-ui/react-alert-dialog",
	"@radix-ui/react-avatar",
	"@radix-ui/react-checkbox",
	"@radix-ui/react-collapsible",
	"@radix-ui/react-context-menu",
	"@radix-ui/react-dialog",
	"@radix-ui/react-dropdown-menu",
	"@radix-ui/react-icons",
	"@radix-ui/react-label",
	"@radix-ui/react-popover",
	"@radix-ui/react-progress",
	"@radix-ui/react-radio-group",
	"@radix-ui/react-scroll-area",
	"@radix-ui/react-select",
	"@radix-ui/react-separator",
	"@radix-ui/react-slot",
	"@radix-ui/react-switch",
	"@radix-ui/react-tabs",
	"@radix-ui/react-toast",
	"@radix-ui/react-toolbar",
	"@radix-ui/react-tooltip",

	"framer-motion",
	"clsx",
	"class-variance-authority",
	"i18next",
	"react-i18next",
	"@tanstack/react-table",
];

export const external_1 = (id: string) =>
	id.startsWith("node:") ||
	PKGS.some((pkg) => id === pkg || id.startsWith(pkg + "/")) ||
	/node_modules\/prismjs\/components\//.test(id) ||
	/node_modules\/@udecode\//.test(id) ||
	/node_modules\/@oneplatformdev\/ui\//.test(id);