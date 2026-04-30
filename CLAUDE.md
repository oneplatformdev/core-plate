# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`@oneplatformdev/plate` — a React component library wrapping [Plate.js](https://platejs.org) v53 to provide a configured rich-text editor (`PlateEditor`, `StaticEditor`, `EditorKit`) for OnePlatform apps. Distributed as an ESM package built with Vite in library mode. The library is consumer-agnostic — do not encode paths to specific downstream projects in scripts or config.

## Commands

Package manager is **Yarn 4** (Berry, see `.yarnrc.yml`). Use `yarn`, not `npm`.

- `yarn dev` — Vite dev server using `index.html` → `sandbox/main.tsx` (live playground for testing the editor).
- `yarn build` — Vite library build to `dist/`, then runs `scripts/prepare-dist-pkg.mjs` to write a publishable `dist/package.json`.
- `yarn build:ts` — Same as `build` but runs `tsc -p tsconfig.build.json` first (full type-check before bundling). Use this when validating type correctness.
- `yarn build:types` — Type-check only (`tsconfig.build.json`).
- `yarn build:watch` — Vite library build in watch mode.
- `yarn lint` — ESLint flat config (`eslint.config.js`).
- `yarn sync:link <path>` — Sync existing `dist/` into a consumer project's `node_modules/@oneplatformdev/plate`. Path is required.
- `yarn dev:link <path>` — Watch source/config and re-run build + sync into the consumer project. Path is required.

There is no test runner configured.

### Release workflow

- `yarn release` — publishes to npm using `NPM_TOKEN` from `.env`. Forwards extra args to `npm publish`, so `yarn release --dry-run` validates without uploading and `yarn release --tag next` ships under a non-`latest` tag for soak-testing. Mechanics: `scripts/release.mjs` writes a temp `.npmrc` (mode 600) in `os.tmpdir()`, sets `NPM_CONFIG_USERCONFIG` to point at it, spawns `npm publish`, then deletes the temp file on exit (including SIGINT/SIGTERM). The token never lands in the repo or in shell history.
- `.env` is gitignored; `.env.example` is the only checked-in template. Generate the token at `https://www.npmjs.com/settings/<user>/tokens` — prefer an "Automation" token so it bypasses the 2FA OTP step.
- `prepublishOnly` runs `yarn build:ts` automatically, so a stale `dist/` cannot be shipped by accident.
- After a successful publish: `git tag -a vX.Y.Z -m '...'` + `git push origin vX.Y.Z` + `gh release create vX.Y.Z --notes-file CHANGELOG.md --latest` for git/GitHub parity.

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
- **Dependency model**: `peerDependencies` covers things the consumer is expected to already have (`react`, `react-dom`, `lucide-react`, `zod`, `clsx`, `class-variance-authority`, `tailwind-merge`, `react-day-picker`). All Plate-related packages (`platejs`, `@platejs/*`) and editor-internal libs (radix, cmdk, sonner, react-dnd, uploadthing, etc.) stay as `dependencies` — the consumer should not need to know they exist. When adding a new dependency, classify it by this rule: "does the consumer's app already import this directly?" → peer, otherwise dep. `resolve.dedupe: ['react', 'react-dom', 'platejs']` in `vite.config.ts` is a safety net against double Plate context. `optimizeDeps.include: ['is-hotkey']` is intentional — don't remove without verifying the editor still mounts. Note: `lucide-react` peer range is `>=0.544.0 <2` because the consumer is on v0.5xx and the lib was developed against v1.x — most icon imports work across this range, but introducing icons added in v1 only would require bumping the consumer.

### Consumer integration workflow

For local development against a consumer project without publishing to npm:

1. `yarn dev:link <path-to-consumer>` — watches `src/`, rebuilds `dist/`, and syncs into `<consumer>/node_modules/@oneplatformdev/plate`.
2. Run the consumer app's own dev server in a separate terminal — it picks up the synced files.

For a one-shot update: `yarn build && yarn sync:link <path-to-consumer>`. The sync script preserves files in the target that don't exist in `dist/`, so it's safe against stale artifacts but won't clean unrelated files in the target's package dir.

## Roadmap (post-`0.1.0`)

Items deferred from the release-prep pass. Tackle them when the relevant pain shows up — none of these block consumers using the library today.

### Build & developer experience

- **`vite-plugin-dts` dominates build time (~91 %).** A clean `yarn build` is ~9 s; the dts step alone is ~8 s. Acceptable for a one-off publish, painful inside `yarn dev:link` where every save re-runs it. Try `dts({ skipDiagnostics: true })` (relies on `tsc` for type-checking elsewhere) and/or enable its incremental cache. If that still isn't enough, swap to `tsc --emitDeclarationOnly` in watch mode and drop the dts plugin entirely.
- **CSS pipeline question raised by `feat/3012` in `oneplatform-client-admin`.** That branch reverted from the Tailwind v4 `@source` integration back to importing `@oneplatformdev/plate/styles.scoped.css`. Until we know *why* (CSS-variable collisions? Tailwind compile cost? class-name leaks?) we keep both entry points around. Action item: pair with whoever owns `feat/3012`, capture the actual failure mode, decide whether the Tailwind `@source` path stays the recommended integration or whether scoped CSS becomes the canonical answer.

### Quality gaps (not blockers, but you'll regret it)

- **No tests.** Bare minimum: a Vitest `render(<PlateEditor />)` smoke test plus a `StaticEditor` snapshot fed a representative `EditorValue`. Add `vitest` + `@testing-library/react` + `jsdom`. Each future bug-fix should land with a regression test instead of a comment.
- **No CI.** Add `.github/workflows/ci.yml` that runs `yarn lint`, `yarn build:types`, and `yarn build` on every PR. Once tests exist, gate them too. Cache `~/.yarn/cache` and `node_modules/.vite` to keep runs under a minute.
- **18 lint warnings still on disk.** 15 × `@typescript-eslint/no-explicit-any` and 3 × `react-hooks/exhaustive-deps`. Won't fail builds, but they're real type leaks and stale-closure risks. Pick them off opportunistically when touching neighbouring code.

### Release infrastructure (do before second publish)

- **`provenance: true` in `publishConfig`.** Currently `false` to avoid OIDC complexity on the first manual publish. Once a GitHub Actions release workflow exists, flip this on — npm signs the tarball with sigstore and the package gets a verified-publisher badge. Requires `id-token: write` permission in the workflow and a publish step that uses `npm publish --provenance`.
- **First publish playbook.** First `npm publish` for a scoped package needs `--access public` (already set via `publishConfig.access`), `npm login` with 2FA on the publishing account, and a `git tag v0.1.0 && git push --tags`. Document the exact sequence in `RELEASING.md` once it's been done once and the gotchas are known. Subsequent publishes can be automated through Actions.
- **Bumping `oneplatform-client-admin`.** Consumer is currently on `^0.0.55`. After the first `0.1.0` publish, open a PR there bumping to `^0.1.0`. Expect to handle three migrations: rename `MyValue` → `EditorValue`, drop the `MyEditor` import (use `useEditor()` return type), and verify the `feat/3012` `styles.scoped.css` import still resolves.

### Architecture follow-ups

- **`createUploadthing()` server scaffolding was deleted in `0.1.0`.** The library no longer ships a router. Confirm with consumers that they all wire their own `onUploadFile` through `FileUploadContext` or `<PlateEditor onUploadFile={...} />`. If a future consumer needs the server piece back, ship it as a separate subpath export (e.g. `@oneplatformdev/plate/server`) so it never enters the client bundle.
- **`MyEditor` was unexported in `0.1.0`.** If a real use case for a stable editor type appears, expose it via a hand-written union of plugin configs (`type EditorInstance = TPlateEditor<EditorValue, EditorPlugin>` where `EditorPlugin` is an explicit list) — never via `(typeof EditorKit)[number]`, which makes every kit change a major version bump.
