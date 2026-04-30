'use client';

import { TrailingBlockPlugin, type Value } from 'platejs';
import { type TPlateEditor, useEditorRef } from 'platejs/react';

import { AlignKit } from '@/components/align-kit';
import { AutoformatKit } from '@/components/autoformat-kit';
import { BasicBlocksKit } from '@/components/basic-blocks-kit';
import { BasicMarksKit } from '@/components/basic-marks-kit';
import { BlockPlaceholderKit } from '@/components/block-placeholder-kit';
import { CalloutKit } from '@/components/callout-kit';
import { CodeBlockKit } from '@/components/code-block-kit';
import { ColumnKit } from '@/components/column-kit';
import { DateKit } from '@/components/date-kit';
import { DndKit } from '@/components/dnd-kit';
import { EmojiKit } from '@/components/emoji-kit';
import { ExitBreakKit } from '@/components/exit-break-kit';
import { FixedToolbarKit } from '@/components/fixed-toolbar-kit';
import { FloatingToolbarKit } from '@/components/floating-toolbar-kit';
import { FontKit } from '@/components/font-kit';
import { LineHeightKit } from '@/components/line-height-kit';
import { LinkKit } from '@/components/link-kit';
import { ListKit } from '@/components/list-kit';
import { MathKit } from '@/components/math-kit';
import { MediaKit } from '@/components/media-kit';
import { MentionKit } from '@/components/mention-kit';
import { TableKit } from '@/components/table-kit';
import { TocKit } from '@/components/toc-kit';
import { ToggleKit } from '@/components/toggle-kit';

export const ConsumerEditorKit = [
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

  ...BasicMarksKit,
  ...FontKit,

  ...ListKit,
  ...AlignKit,
  ...LineHeightKit,

  ...AutoformatKit,
  ...EmojiKit,
  ...ExitBreakKit,
  TrailingBlockPlugin,

  ...BlockPlaceholderKit,
  ...DndKit,
  ...FixedToolbarKit,
  ...FloatingToolbarKit,
];

export type ConsumerEditor = TPlateEditor<Value, (typeof ConsumerEditorKit)[number]>;

export const useConsumerEditor = () => useEditorRef<ConsumerEditor>();
