# @oneplatformdev/plate

Preconfigured [Plate.js](https://platejs.org) v53 rich-text editor for OnePlatform applications. Ships an interactive `PlateEditor`, a static (SSR-safe) `StaticEditor`, and a composable `EditorKit` so consumers can drop in a fully featured editor without wiring every Plate plugin themselves.

- **One package, one decision.** `<PlateEditor />` for editing, `<StaticEditor />` for rendering saved content. No plugin assembly required.
- **Tree-shakeable, framework-agnostic.** Built as ESM with `'use client'` directives preserved — works in Vite SPAs, Next.js App Router, Remix, anything modern.
- **Lean install footprint.** Common shadcn/ui-stack libs (`react`, `lucide-react`, `zod`, `tailwind-merge`, etc.) are declared as peers and reused from the host application instead of duplicated.

## Installation

```bash
yarn add @oneplatformdev/plate
# or
npm install @oneplatformdev/plate
```

### Peer dependencies

The package expects the following to be provided by the host application (most are part of any shadcn/ui-based project):

| Peer | Range | Notes |
|---|---|---|
| `react` | `>=18 <20` | Hooks API surface used throughout |
| `react-dom` | `>=18 <20` | Required for portals (toolbars, popovers) |
| `lucide-react` | `>=0.544.0 <2` | Icons used in toolbars |
| `zod` | `>=3 <5` | Used only for `z.ZodError` checks — works with v3 or v4 |
| `clsx` | `^2` | className composition |
| `class-variance-authority` | `^0.7` | UI variants |
| `tailwind-merge` | `^3` | className deduplication |
| `react-day-picker` | `^9` | **Optional** — only the date plugin needs it |

If your project already uses shadcn/ui, all of the above are likely satisfied. The `react-day-picker` peer is marked optional via `peerDependenciesMeta`, so installs without it succeed without warnings.

---

## Quick start

### 1. Interactive editor

```tsx
import '@oneplatformdev/plate/styles.css';
import { PlateEditor, type EditorValue } from '@oneplatformdev/plate';

export function MyEditor({ initial, onSave }: { initial: EditorValue; onSave: (v: EditorValue) => void }) {
  return (
    <PlateEditor
      initialValue={initial}
      onChangeValues={onSave}
      onChangeDebounceMs={300}
      locale="uk"
      placeholder="Start writing…"
    />
  );
}
```

### 2. Static renderer (SSR / RSC safe)

```tsx
import { StaticEditor } from '@oneplatformdev/plate';

export function ArticleBody({ value }: { value: EditorValue }) {
  return <StaticEditor value={value} className="prose" />;
}
```

`StaticEditor` is plain markup — no React event handlers, no Plate runtime, no `'use client'`. Drop it directly into a Next.js Server Component or pre-render to HTML.

### 3. Internationalisation

```tsx
import { PlateEditor, defaultPlateMessages, ukPlateMessages } from '@oneplatformdev/plate';

// Use the built-in `uk` locale:
<PlateEditor locale="uk" />

// Or override individual strings:
<PlateEditor messages={{ ...defaultPlateMessages, copy: 'Дублювати' }} />
```

The empty-paragraph placeholder follows i18n automatically (`messages.typeSomethingPlaceholder`); pass `placeholder={'…'}` only when you want to override.

### 4. File uploads

The library does **not** ship a server router. Wire your own uploader and pass it in:

```tsx
<PlateEditor
  onUploadFile={async (file) => {
    const res = await fetch('/api/upload', { method: 'POST', body: file });
    return await res.json(); // shape: { url, name, size, type, ... }
  }}
  onUploadValidateError={(err) => toast.error(err.code)}
/>
```

If neither `onUploadFile` nor a `<FileUploadContext.Provider>` is configured, calling the upload action throws a clear error.

---

## Public API

Everything below is imported from the package root (`@oneplatformdev/plate`). Anything not listed is internal and may change without notice.

### Components

| Export | Kind | Purpose |
|---|---|---|
| `PlateEditor` | client component | Interactive WYSIWYG editor with toolbars, DnD, slash commands, mentions, tables, code, math, embeds. Fully wrapped in providers. |
| `StaticEditor` | server-safe component | Renders a saved `Value` to plain markup. No Plate runtime, no event handlers, no client boundary required. |
| `Editor` / `EditorContainer` / `EditorView` | client primitives | Lower-level building blocks if you want to compose your own editor shell. Re-exported from `src/components/ui/editor.tsx`. |

### Hooks

| Export | Returns | Purpose |
|---|---|---|
| `useEditor()` | editor instance | Read the current editor inside any child of `<PlateEditor>`. Typed against the internal kit composition. |

### Plugin composition

| Export | Type | Purpose |
|---|---|---|
| `EditorKit` | `PlatePlugin[]` | The full preconfigured plugin array used by `PlateEditor`. Useful when you need to inspect, extend, or build a custom editor with `usePlateEditor` from `platejs/react`. |

```tsx
import { usePlateEditor, Plate } from 'platejs/react';
import { EditorKit } from '@oneplatformdev/plate';

const editor = usePlateEditor({
  plugins: [...EditorKit, MyCustomPlugin],
});
```

### Types

| Export | Description |
|---|---|
| `PlateEditorProps` | Props of `<PlateEditor>` (see [props reference](#plateeditor-props) below) |
| `StaticEditorProps` | `{ className?: string; value?: Value }` |
| `EditorProps` | Props of the low-level `<Editor>` primitive (extends Plate's `PlateContentProps` with variants) |
| `EditorValue` | Discriminated union of all element types this editor produces (paragraphs, headings, code blocks, tables, etc.). Use this to type your stored content. |
| `PlateMessageKey` | Union of all i18n message keys |
| `PlateMessages` | `Partial<Record<PlateMessageKey, string>>` for overriding messages |
| `UploadError` | Plate's typed upload error (re-exported from `@platejs/media/react`) |
| `UploadErrorCode` | Enum of upload failure codes (`TOO_LARGE`, `INVALID_FILE_TYPE`, …) |

### Constants

| Export | Description |
|---|---|
| `defaultPlateMessages` | English message dictionary |
| `ukPlateMessages` | Ukrainian message dictionary |

### `PlateEditor` props

```ts
type PlateEditorProps = {
  // Content
  initialValue?: Value;        // initial document
  value?: Value;               // controlled mode (same shape)
  onChangeValues?: (v: Value) => void;
  onChangeDebounceMs?: number; // default 150ms

  // Layout
  className?: string;
  containerClassName?: string;
  containerVariant?: 'comment' | 'default' | 'demo' | 'select';
  editorClassName?: string;
  editorVariant?: 'default' | 'ai' | 'aiChat' | 'comment' | 'demo' | …;
  isSimpleEditor?: boolean;

  // Editor primitive pass-through
  autoFocus?: boolean;
  placeholder?: string;        // overrides i18n if set
  readOnly?: boolean;

  // i18n
  locale?: 'en' | 'uk';        // default 'uk'
  messages?: PlateMessages;    // partial overrides on top of `locale`

  // Uploads
  onUploadFile?: (file: File) => Promise<UploadResultLike>;
  onUploadValidateError?: (error: UploadError) => void;

  // Custom toolbar slot
  children?: React.ReactNode;
};
```

---

## Styling

Two ways to consume the styles, depending on your build pipeline:

### 1. Direct import (works everywhere)

```ts
import '@oneplatformdev/plate/styles.css';
```

### 2. Tailwind v4 `@source` (preferred when host already uses Tailwind v4)

Let your own Tailwind compiler scan the package and merge classes into your bundle — no separate CSS file shipped:

```css
@import "tailwindcss";
@source "../node_modules/@oneplatformdev/plate";
```

### 3. Scoped variant (when host CSS would collide)

If the host application has Tailwind variables under `:root` that you don't want the editor to override, use the scoped CSS and wrap the editor in `.op-plate-scope`:

```ts
import '@oneplatformdev/plate/styles.scoped.css';
```

```tsx
<div className="op-plate-scope">
  <PlateEditor />
</div>
```

All editor selectors are prefixed with `.op-plate-scope`, isolating them from the rest of your app.

---

## Package structure

What you get when you install the package — laid out so you know where things live and what's safe to deep-import:

```
@oneplatformdev/plate/
├── package.json              ← "exports" map below
├── README.md
├── LICENSE
├── CHANGELOG.md
└── dist/
    ├── index.js / index.d.ts                        ← public entry (only this is supported)
    ├── styles.css                                   ← global styles
    ├── styles.scoped.css                            ← .op-plate-scope variant
    ├── components/
    │   ├── core-plate-editor.{js,d.ts}              ← <PlateEditor>
    │   ├── core-plate-static-editor.{js,d.ts}       ← <StaticEditor>
    │   ├── editor-kit.{js,d.ts}                     ← EditorKit + useEditor
    │   ├── plate-types.{js,d.ts}                    ← EditorValue + Editor*Element
    │   ├── *-kit.{js,d.ts}                          ← per-feature interactive kits
    │   ├── *-base-kit.{js,d.ts}                     ← per-feature SSR/static kits
    │   └── ui/                                      ← shadcn-style nodes & toolbars
    ├── context/                                     ← FileUploadContext etc.
    ├── hooks/                                       ← useUploadFile, useDebounce, …
    ├── i18n/                                        ← messages + provider
    └── lib/                                         ← cn, transforms helpers
```

### `package.json` `exports`

```json
{
  ".":                     "./dist/index.js",
  "./styles.css":          "./dist/styles.css",
  "./styles.scoped.css":   "./dist/styles.scoped.css",
  "./package.json":        "./dist/package.json"
}
```

Anything not listed here is intentionally not part of the public surface — deep imports into `dist/components/...` may break across minor versions.

---

## Versioning

Pre-1.0. Breaking changes between minor versions are possible and will always be documented in [CHANGELOG.md](./CHANGELOG.md). Stable `1.0.0` will lock the public surface listed above.

When upgrading, the changelog entry for each version lists exactly what was added, renamed, or removed — read it before bumping.

## License

MIT — see [LICENSE](./LICENSE).
