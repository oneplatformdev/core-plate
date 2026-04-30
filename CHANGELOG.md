# Changelog

All notable changes to `@oneplatformdev/plate` will be documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html). Until `1.0.0` the public API may change between minor versions; review breaking-change notes carefully on each upgrade.

---

## [0.1.0] — 2026-04-30

The first publicly publishable release. The package was extracted from a tightly-coupled internal build into a standalone library with a stable surface, proper peer dependencies, and a clean published artifact. Anything imported from `@oneplatformdev/plate` after this release is part of the contract; future breaking changes will be flagged here.

### Added

- **Public API**: `PlateEditor`, `StaticEditor`, `EditorKit`, `useEditor`, `Editor` / `EditorContainer` / `EditorView` primitives, `EditorValue` type, i18n message dictionaries (`defaultPlateMessages`, `ukPlateMessages`), and Plate upload error types (`UploadError`, `UploadErrorCode`).
- **CSS entry points**: `@oneplatformdev/plate/styles.css` for direct global usage and `@oneplatformdev/plate/styles.scoped.css` for projects that need to isolate editor styles under `.op-plate-scope`.
- **`exportStylesheetUrl` prop** on `ExportToolbarButton` — overrides the stylesheet URL embedded in HTML/PDF exports. Defaults to the previous hardcoded `https://platejs.org/tailwind.css` for backward compatibility.
- **Generic linkage scripts**: `yarn dev:link <path>` and `yarn sync:link <path>` for local-development against any consumer project.
- **Release plumbing**: `LICENSE` (MIT), `repository`, `homepage`, `bugs`, `keywords`, `publishConfig`, `sideEffects`, and a `prepublishOnly` step that runs the full type-checked build before publish.

### Changed

- **Dependency model rewritten** so the package can be dropped into any project without dragging in duplicate copies of common shadcn/ui-stack dependencies. Eight peers expected from the host: `react`, `react-dom`, `lucide-react` (`>=0.544.0 <2`), `zod` (`>=3 <5`), `clsx`, `class-variance-authority`, `tailwind-merge`, and `react-day-picker` (optional, only for the date plugin). Everything Plate-related (`platejs`, all `@platejs/*` packages, internal radix primitives, embed players, uploadthing client, etc.) stays as `dependencies` — consumers should not need to know those exist.
- `vite.config.ts` now adds `platejs` to `resolve.dedupe` as a safety net against duplicate editor contexts when the consumer's bundler hoists transitive copies.
- `lodash` (full package) replaced with `lodash.debounce` (single function, ~70KB → ~1KB).

### Removed

- **`MyEditor` type** is no longer exported. The concrete editor type depends on the kit composition and would force a major-version bump on every plugin addition. Consumers receive the editor through `useEditor()` and rarely need the type directly.
- **`DEFAULT_BLOCK_PLACEHOLDER` constant** removed in favour of i18n. `PlateEditor` already resolves the empty-paragraph placeholder from `messages.typeSomethingPlaceholder` (English and Ukrainian dictionaries provided), and `createBlockPlaceholderKit(placeholder)` accepts an explicit value when used standalone.
- **Server-side UploadThing scaffolding** (`src/lib/uploadthing.ts`, `OurFileRouter`, `createUploadthing`, the `uploadthing/next` import path) removed. The library no longer ships a server router — consumers wire their own uploader through `<FileUploadContext.Provider value={{ onUploadFile }}>` or the `onUploadFile` prop on `PlateEditor`. `useUploadFile` now throws a clear error if neither is configured. The `@uploadthing/react` dependency was dropped accordingly.
- **`./styles.scoped.css` export, dead `dist/src/` migration, and bundled `@oneplatformdev/ui` / `@oneplatformdev/utils` peer placeholders** were removed earlier in development and are not part of any prior release.

### Renamed

All public element types received an `Editor*` prefix to make their origin clear in consumer code (no more `My*` mystery types). Internal definitions in `src/components/plate-types.ts` follow the same scheme:

| Before | After |
|---|---|
| `MyValue` | `EditorValue` |
| `MyBlockElement` | `EditorBlockElement` |
| `MyTextBlockElement` | `EditorTextBlockElement` |
| `MyParagraphElement` | `EditorParagraphElement` |
| `MyTableElement` | `EditorTableElement` |
| _… and 14 more_ | _… see `src/components/plate-types.ts`_ |

Consumers that previously typed values as `MyValue` should rename to `EditorValue`; everything else was already internal.

### Fixed

- **`StaticEditor` no longer carries a stray `'use client'` directive** that contradicted its SSR/RSC purpose. It now renders correctly inside React Server Components.
- **`useIsTouchDevice`** — removed a duplicated `navigator.maxTouchPoints > 0` condition (left side of the `||` was identical to the right).
- **Hot-path `console.debug` logs** removed from `core-plate-editor.tsx`'s `onValueChange` — they fired on every keystroke and called `performance.now()` unnecessarily in production.
- **`html2canvas-pro` and `pdf-lib`** were dynamically imported but missing from `dependencies`. Without them, calling the export feature in a fresh consumer would fail with `Cannot find module`. Both are now declared.
- **Build pipeline**: `prepare-dist-pkg.mjs` now cleans up `dist/src/` automatically, so `yarn build:ts` (which emits via both `tsc` and `vite-plugin-dts`) no longer ships duplicate type files inside the tarball.
- **Lint hygiene**: ESLint passes with zero errors. Pre-existing `no-explicit-any` and `exhaustive-deps` warnings remain to be cleaned up in a typed-refactor pass; the noisy v7 `react-hooks/set-state-in-effect` rule and the Vite-only `react-refresh/only-export-components` rule are disabled because they don't apply to a published library.

### Build & dist

- Tarball size: ~1.4 MB across 181 files (`dist/`).
- Build time: ~8.7 s (≈90 % spent in `vite-plugin-dts`; see roadmap below).
- `'use client'` directives are preserved in 92 emitted files — verified manually so the package works in Next.js App Router without further wrapping.
