import * as React from 'react';

import { createSlateEditor } from 'platejs';
import { normalizeStaticValue, type Value } from 'platejs';

import { BaseEditorKit } from '@/components/editor-base-kit';
import {
  filterClosedToggleChildren,
  ToggleStaticProvider,
} from '@/components/toggle-static-context';
import { EditorStatic } from '@/components/ui/editor-static';
import { type PlateMessages } from '@/i18n/messages';
import { PlateI18nProvider } from '@/i18n/provider';

const defaultValue = normalizeStaticValue([
  {
    children: [{ text: '' }],
    type: 'p',
  },
]);

export type StaticEditorProps = {
  className?: string;
  locale?: 'en' | 'uk';
  messages?: PlateMessages;
  value?: Value;
};

export function StaticEditor({
  className,
  locale = 'uk',
  messages,
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
    <PlateI18nProvider locale={locale} messages={messages}>
      <ToggleStaticProvider openIds={openIds} toggle={toggle}>
        <EditorStatic
          className={className}
          editor={editor}
          value={visibleValue}
        />
      </ToggleStaticProvider>
    </PlateI18nProvider>
  );
}
