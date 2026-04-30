'use client';

import * as React from 'react';

import { createSlateEditor } from 'platejs';
import { normalizeStaticValue, type Value } from 'platejs';

import { BaseEditorKit } from '@/components/editor-base-kit';
import { EditorStatic } from '@/components/ui/editor-static';

const defaultValue = normalizeStaticValue([
  {
    children: [{ text: '' }],
    type: 'p',
  },
]);

export type StaticEditorProps = {
  className?: string;
  value?: Value;
};

export function StaticEditor({
  className,
  value = defaultValue,
}: StaticEditorProps) {
  const editor = React.useMemo(
    () =>
      createSlateEditor({
        plugins: BaseEditorKit,
        value,
      }),
    [value]
  );

  return <EditorStatic className={className} editor={editor} value={value} />;
}
