'use client';

import { type Value, TrailingBlockPlugin } from 'platejs';
import { type TPlateEditor, useEditorRef } from 'platejs/react';

import { AlignKit } from '@/components/align-kit';
import { AutoformatKit } from '@/components/autoformat-kit';
import { BasicBlocksKit } from '@/components/basic-blocks-kit';
import { BasicMarksKit } from '@/components/basic-marks-kit';
import { createBlockPlaceholderKit } from '@/components/block-placeholder-kit';
import { CalloutKit } from '@/components/callout-kit';
import {
  type CharCounterRender,
  createCharCounterKit,
} from '@/components/char-counter-kit';
import { CodeBlockKit } from '@/components/code-block-kit';
import { ColumnKit } from '@/components/column-kit';
import { DateKit } from '@/components/date-kit';
import { DndKit } from '@/components/dnd-kit';
import { DocxKit } from '@/components/docx-kit';
import { EmojiKit } from '@/components/emoji-kit';
import { ExitBreakKit } from '@/components/exit-break-kit';
import { FixedToolbarKit } from '@/components/fixed-toolbar-kit';
import { FontKit } from '@/components/font-kit';
import { GoogleDocsPasteKit } from '@/components/google-docs-paste-kit';
import { LineHeightKit } from '@/components/line-height-kit';
import { LinkKit } from '@/components/link-kit';
import { ListKit } from '@/components/list-kit';
import { MarkdownKit } from '@/components/markdown-kit';
import { MathKit } from '@/components/math-kit';
import { MediaKit } from '@/components/media-kit';
import { MentionKit } from '@/components/mention-kit';
import { SlashKit } from '@/components/slash-kit';
import { SuggestionKit } from '@/components/suggestion-kit';
import { TableKit } from '@/components/table-kit';
import { TocKit } from '@/components/toc-kit';
import { ToggleKit } from '@/components/toggle-kit';

export type CreateEditorKitOptions = {
  /** When set, the editor shows a `count / maxLength` counter and hard-blocks
   *  input (typing, breaks, paste) once the limit is reached. */
  maxLength?: number;
  /** Custom counter renderer. When provided, the plugin renders this node
   *  instead of the built-in counter UI — the consumer owns markup, position
   *  and tooltip, and receives the live `{ count, maxLength, over }`. */
  renderCounter?: CharCounterRender;
};

export const createEditorKit = (
  placeholder?: string,
  options?: CreateEditorKitOptions
) => [
  // Elements
  ...BasicBlocksKit,
  ...CodeBlockKit,
  ...TableKit,
  ...ToggleKit,
  ...TocKit,
  ...MediaKit,
  ...GoogleDocsPasteKit,
  ...CalloutKit,
  ...ColumnKit,
  ...MathKit,
  ...DateKit,
  ...LinkKit,
  ...MentionKit,

  // Marks
  ...BasicMarksKit,
  ...FontKit,

  // Block Style
  ...ListKit,
  ...AlignKit,
  ...LineHeightKit,

  // Collaboration
  ...SuggestionKit,

  // Editing
  ...SlashKit,
  ...AutoformatKit,
  ...DndKit,
  ...EmojiKit,
  ...ExitBreakKit,
  TrailingBlockPlugin,

  // Parsers
  ...DocxKit,
  ...MarkdownKit,

  // UI
  ...createBlockPlaceholderKit(placeholder),
  // Char counter: shows `count / maxLength` and hard-blocks input once the
  // limit is reached. Config is propagated to the plugin via module state (see
  // char-counter-kit.tsx) because Plate registers a plugin's render globally by
  // key, so options in a closure don't reach the render reliably.
  ...createCharCounterKit(options?.maxLength, options?.renderCounter),
  ...FixedToolbarKit,
];

export const EditorKit = createEditorKit();

// Internal — the concrete editor type depends on the kit composition above and
// is not part of the stable public API. Consumers receive the editor through
// `useEditor()` instead of importing the type directly.
type EditorInstance = TPlateEditor<Value, (typeof EditorKit)[number]>;

export const useEditor = () => useEditorRef<EditorInstance>();
