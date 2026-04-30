# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`@oneplatformdev/plate` — a React component library wrapping [Plate.js](https://platejs.org) v53 to provide a configured rich-text editor (`PlateEditor`, `StaticEditor`, `EditorKit`) for OnePlatform apps. Distributed as an ESM package built with Vite in library mode and consumed primarily by `oneplatform-client-admin`.

## Commands

Package manager is **Yarn 4** (Berry, see `.yarnrc.yml`). Use `yarn`, not `npm`.

- `yarn dev` — Vite dev server using `index.html` → `sandbox/main.tsx` (live playground for testing the editor).
- `yarn build` — Vite library build to `dist/`, then runs `scripts/prepare-dist-pkg.mjs` to write a publishable `dist/package.json`.
- `yarn build:ts` — Same as `build` but runs `tsc -p tsconfig.build.json` first (full type-check before bundling). Use this when validating type correctness.
- `yarn build:types` — Type-check only (`tsconfig.build.json`).
- `yarn build:watch` — Vite library build in watch mode.
- `yarn lint` — ESLint flat config (`eslint.config.js`).
- `yarn build:client-admin` — Build then sync `dist/` into `../../oneplatform-client-admin/node_modules/@oneplatformdev/plate` via `scripts/sync-local-package.mjs`.
- `yarn dev:client-admin` — Watch source/config and re-run build + sync into the consumer project (`scripts/watch-local-package.mjs`).
- `yarn sync:client-admin [path]` — Sync existing `dist/` into a consumer project without rebuilding.

There is no test runner configured.

## Architecture

### Two build modes from one Vite config

`vite.config.ts` defines a single config that behaves differently per `command`:

- **`serve` (dev)**: standard SPA serving `index.html` → `sandbox/`. The sandbox imports the library via the alias `@oneplatformdev/plate` → `src/index.ts` (configured in `resolve.alias`), so the dev server exercises the same entry consumers use.
- **`build`**: library mode. `collectReachableSourceFiles()` walks imports starting from `src/index.ts` to compute a per-file entry map, then Rollup emits ESM with `preserveModules: true` so the published package preserves the `src/` tree under `dist/`. All `dependencies` and `peerDependencies` are externalized via `isExternal`. `vite-plugin-dts` emits `.d.ts` files alongside (excluding `src/app/**` and `sandbox/**`).

Path aliases (active in both modes): `@/foo` and `@/` → `src/`, plus a self-alias `@oneplatformdev/plate(/styles.css)` → local source.

### Public API surface

`src/index.ts` is the single public entry. It re-exports a deliberately small surface — only `PlateEditor`, `StaticEditor`, `EditorKit`/`useEditor`, the `Editor*` UI primitives, `MyValue`/`MyEditor` types, i18n message dictionaries, and Plate upload error types. `src/index.client.ts` mirrors this without the CSS side-effect import for environments that cannot import CSS at module scope.

The CSS entry `src/index.css` (Tailwind v4 + `tw-animate-css`) becomes `dist/styles.css` (filename set via `lib.cssFileName: 'styles'`) and is exposed as the `./styles.css` subpath export.

### Editor composition (the "kit" pattern)

Plate v2 organizes plugins into "kits" — composable arrays of plugin instances. The codebase mirrors this pattern heavily:

- **`src/components/*-kit.tsx`** (interactive variants) and **`src/components/*-base-kit.tsx`** (SSR/static variants) each export a typed array of Plate plugins for one feature (basic-blocks, callout, code-block, table, mention, dnd, slash, …).
- **`editor-kit.tsx`** composes the interactive kits into the full `EditorKit` consumed by `PlateEditor`. **`editor-base-kit.tsx`** does the same for the static renderer used by `StaticEditor`. New features generally mean: add a `feature-kit.tsx` (and a `feature-base-kit.tsx` if it can render statically), then register it in the appropriate aggregate kit.
- **`src/components/plugins/`** appears to duplicate the top-level `*-kit.tsx` files — when modifying plugin behavior, check both locations to determine which is actually wired into `editor-kit`/`editor-base-kit`.
- **`src/components/ui/`** holds the shadcn-style node and toolbar components (`*-node.tsx` interactive, `*-node-static.tsx` static). Configured via `components.json` (`style: radix-nova`, `baseColor: neutral`, `iconLibrary: lucide`); add new shadcn components with `npx shadcn@latest add ...` respecting these aliases.

`core-plate-editor.tsx` / `core-plate-static-editor.tsx` are the lower-level wrappers; `plate-editor.tsx` is a higher-level convenience composition. `plate-types.ts` defines `MyEditor`/`MyValue` — keep these in sync when adding plugins that introduce new node types.

### Other notable pieces

- **i18n**: `src/i18n/messages.ts` exports `defaultPlateMessages` and `ukPlateMessages`; `provider.tsx` wires them in. When adding user-facing strings to the editor, extend the `PlateMessages` shape in both dictionaries.
- **Uploads**: `src/lib/uploadthing.ts` + `src/context/file-upload-context.tsx` + `src/hooks/use-upload-file.ts` integrate UploadThing. `src/app/api/uploadthing/` is excluded from the type-emit step — it's reference/example backend code, not part of the published library.
- **React peer**: peer-deps `react`/`react-dom` are `>=18 <20`, but devDeps pin React 19. `optimizeDeps.include: ['is-hotkey']` and `resolve.dedupe: ['react', 'react-dom']` are intentional — don't remove without verifying the editor still mounts in the consumer app.

### Consumer integration workflow

The consumer `oneplatform-client-admin` lives at `../../oneplatform-client-admin`. The standard local-development loop is:

1. `yarn dev:client-admin` here (watches `src/`, rebuilds `dist/`, syncs into the consumer's `node_modules/@oneplatformdev/plate`).
2. Run the consumer app's own dev server in a separate terminal — it picks up the synced files.

For one-shot updates use `yarn build:client-admin`. The sync script preserves files in the target that don't exist in `dist/`, so it's safe against stale artifacts but won't clean unrelated files in the target's package dir.
