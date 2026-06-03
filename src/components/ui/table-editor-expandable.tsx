'use client';

import * as React from 'react';

import { Maximize2 } from 'lucide-react';

import { usePlateI18n } from '@/i18n/provider';

/**
 * Inline wrapper for the editable table: detects horizontal overflow and, when
 * the table is wider than its scroll container, surfaces a pinned "expand"
 * button that opens the fullscreen editing modal (see TableFullscreenEditor).
 *
 * `tableWrapRef` points to the element wrapping the `<table>` (used only to
 * measure overflow). The button sits in a `relative` wrapper *outside* the
 * scroll container so it stays pinned while scrolling.
 */
export function TableEditorExpandable({
  children,
  onExpand,
  tableWrapRef,
}: {
  children: React.ReactNode;
  onExpand: () => void;
  tableWrapRef: React.RefObject<HTMLDivElement | null>;
}) {
  const { t } = usePlateI18n();
  const [overflows, setOverflows] = React.useState(false);

  React.useEffect(() => {
    const el = tableWrapRef.current;
    if (!el) return;
    const scroller =
      (el.closest('.overflow-x-auto') as HTMLElement | null) ??
      el.parentElement;
    if (!scroller) return;

    const check = () =>
      setOverflows(el.scrollWidth > scroller.clientWidth + 1);

    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    ro.observe(scroller);
    return () => ro.disconnect();
  }, [tableWrapRef]);

  return (
    <div className="relative">
      {overflows && (
        <button
          type="button"
          contentEditable={false}
          onMouseDown={(e) => e.preventDefault()}
          onClick={onExpand}
          className="absolute top-1 right-1 z-40 inline-flex items-center gap-1 rounded-md border border-border bg-background/85 px-2 py-1 text-xs font-medium shadow-sm backdrop-blur hover:bg-background print:hidden"
        >
          <Maximize2 className="size-3.5" />
          {t('expandTable')}
        </button>
      )}
      {children}
    </div>
  );
}
