import * as React from 'react';

import { createSlateEditor } from 'platejs';
import { normalizeStaticValue, type Value } from 'platejs';

import { BaseEditorKit } from '@/components/editor-base-kit';
import {
  filterClosedToggleChildren,
  ToggleStaticProvider,
} from '@/components/toggle-static-context';
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
  const [openIds, setOpenIds] = React.useState<Set<string>>(() => new Set());

  const toggle = React.useCallback((id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const visibleValue = React.useMemo(
    () => filterClosedToggleChildren(value, openIds),
    [value, openIds]
  );

  const editor = React.useMemo(
    () =>
      createSlateEditor({
        plugins: BaseEditorKit,
        value: visibleValue,
      }),
    [visibleValue]
  );

  return (
    <ToggleStaticProvider openIds={openIds} toggle={toggle}>
      <EditorStatic className={className} editor={editor} value={visibleValue} />
    </ToggleStaticProvider>
  );
}
