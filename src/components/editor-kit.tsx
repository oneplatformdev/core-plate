'use client';

import { type Value, TrailingBlockPlugin } from 'platejs';
import { type TPlateEditor, useEditorRef } from 'platejs/react';

import { AlignKit } from '@/components/align-kit';
import { AutoformatKit } from '@/components/autoformat-kit';
import { BasicBlocksKit } from '@/components/basic-blocks-kit';
import { BasicMarksKit } from '@/components/basic-marks-kit';
import { createBlockPlaceholderKit } from '@/components/block-placeholder-kit';
export { DEFAULT_BLOCK_PLACEHOLDER } from '@/components/block-placeholder-kit';
import { CalloutKit } from '@/components/callout-kit';
import { CodeBlockKit } from '@/components/code-block-kit';
import { ColumnKit } from '@/components/column-kit';
import { DateKit } from '@/components/date-kit';
import { DndKit } from '@/components/dnd-kit';
import { DocxKit } from '@/components/docx-kit';
import { EmojiKit } from '@/components/emoji-kit';
import { ExitBreakKit } from '@/components/exit-break-kit';
import { FixedToolbarKit } from '@/components/fixed-toolbar-kit';
import { FontKit } from '@/components/font-kit';
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

export const createEditorKit = (placeholder?: string) => [
  // Elements
  ...BasicBlocksKit,
  ...CodeBlockKit,
  ...TableKit,
  ...ToggleKit,
  ...TocKit,
  ...MediaKit,
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
  ...FixedToolbarKit,
];

export const EditorKit = createEditorKit();

export type MyEditor = TPlateEditor<Value, (typeof EditorKit)[number]>;

export const useEditor = () => useEditorRef<MyEditor>();
