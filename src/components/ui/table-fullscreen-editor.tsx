'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';

import { Check, Table, X } from 'lucide-react';
import { type TTableElement, type Value } from 'platejs';
import { Plate, usePlateEditor } from 'platejs/react';

import { createEditorKit } from '@/components/editor-kit';
import { Editor, EditorContainer } from '@/components/ui/editor';
import { TableExpandedContext } from '@/components/ui/table-expanded-context';
import { usePlateI18n } from '@/i18n/provider';

/**
 * Fullscreen editing modal for a single table.
 *
 * Runs an **isolated** Plate editor whose document is just the table, so
 * Ctrl+A, Delete, selection and the floating toolbar are all scoped to the
 * table (they can't touch the rest of the document). On close the edited table
 * is handed back via `onClose` to be written into the parent editor.
 *
 * Providers (DnD, tooltips, i18n, uploads) are inherited from the parent editor
 * through the React tree — `createPortal` keeps this subtree under them.
 */
export function TableFullscreenEditor({
  element,
  onClose,
}: {
  element: TTableElement;
  onClose: (next: TTableElement | null) => void;
}) {
  const { t } = usePlateI18n();
  const initialValueRef = React.useRef<Value>([
    structuredClone(element),
  ] as Value);

  const plugins = React.useMemo(() => createEditorKit(''), []);
  const editor = usePlateEditor({ plugins, value: initialValueRef.current });

  // Save: write the edited table back into the document.
  const save = React.useCallback(() => {
    const next = (editor?.children?.[0] as TTableElement | undefined) ?? null;
    onClose(next);
  }, [editor, onClose]);

  // Cancel: close without writing back (edits live on a clone, so they're
  // simply discarded). Triggered by ✕, Esc and backdrop click.
  const cancel = React.useCallback(() => onClose(null), [onClose]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cancel();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [cancel]);

  if (!editor) return null;

  return createPortal(
    <TableExpandedContext.Provider value={true}>
      {/* z-50 (not higher): matches Radix portals' default z so any menu /
          tooltip opened after this overlay stacks above it by DOM order, while
          the dimmed backdrop still covers the page editor below. */}
      <div
        className="op-plate-scope fixed inset-0 z-50 flex flex-col bg-black/50 p-2 sm:p-6"
        onClick={(e) => {
          if (e.target === e.currentTarget) cancel();
        }}
      >
        <div className="mx-auto flex size-full max-w-[1400px] flex-col overflow-hidden rounded-xl border border-t-2 border-border border-t-[#9368FF] bg-background shadow-2xl">
        <div
          className="flex items-center justify-between gap-3 border-b border-border bg-muted/40 px-4 py-2.5"
          contentEditable={false}
        >
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-[#9368FF]/10 text-[#9368FF]">
              <Table className="size-4" />
            </span>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold">{t('editTable')}</span>
              <span className="hidden text-xs text-muted-foreground sm:block">
                {t('escToClose')}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={save}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#9368FF] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#9368FF]/90"
            >
              <Check className="size-4" />
              {t('done')}
            </button>
            <button
              type="button"
              aria-label={t('cancel')}
              onClick={cancel}
              className="rounded-md border border-border p-1.5 hover:bg-muted"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1">
          <Plate editor={editor}>
            <EditorContainer variant="default" className="h-full overflow-auto">
              <Editor variant="none" className="px-6 py-4" />
            </EditorContainer>
          </Plate>
        </div>
        </div>
      </div>
    </TableExpandedContext.Provider>,
    document.body
  );
}
