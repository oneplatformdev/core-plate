'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';

import { usePlateI18n } from '@/i18n/provider';

import { TableFullscreenDialog } from './table-fullscreen-dialog';
import { TableScrollContainer } from './table-scroll-container';
import { TableThumbnail } from './table-thumbnail';

export type TablePreviewMode = 'auto' | 'scroll' | 'thumbnail';

const NARROW_BREAKPOINT = 480;

/**
 * Read-only preview wrapper for a table.
 *
 * - wide container  → horizontal scroll preview + "expand" button (variant A)
 * - narrow container → scaled thumbnail preview (mobile)
 * - both open the same fullscreen viewer (variant B)
 *
 * `children` is a render-prop receiving a ref that must be attached to the
 * element wrapping the `<table>` (it carries the column-size CSS vars and is
 * cloned into the fullscreen view).
 */
export function TablePreviewFrame({
  children,
  mode = 'auto',
  stickyFirstColumn = true,
}: {
  children: (ref: React.Ref<HTMLDivElement>) => React.ReactNode;
  mode?: TablePreviewMode;
  stickyFirstColumn?: boolean;
}) {
  const { t } = usePlateI18n();
  const frameRef = React.useRef<HTMLDivElement>(null);
  const tableWrapRef = React.useRef<HTMLDivElement>(null);
  const [resolved, setResolved] = React.useState<'scroll' | 'thumbnail'>(
    'scroll'
  );
  const [overflows, setOverflows] = React.useState(false);
  const [cloneHtml, setCloneHtml] = React.useState<string | null>(null);

  React.useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const compute = () => {
      const wrap = tableWrapRef.current;
      if (!wrap) return;
      const available = frame.clientWidth;
      const natural = wrap.scrollWidth;
      const isOverflowing = natural > available + 1;
      setOverflows(isOverflowing);

      if (mode === 'auto') {
        setResolved(
          available < NARROW_BREAKPOINT && isOverflowing ? 'thumbnail' : 'scroll'
        );
      } else {
        setResolved(mode === 'thumbnail' ? 'thumbnail' : 'scroll');
      }
    };

    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(frame);
    if (tableWrapRef.current) ro.observe(tableWrapRef.current);
    return () => ro.disconnect();
  }, [mode]);

  const openFullscreen = React.useCallback(() => {
    setCloneHtml(tableWrapRef.current?.outerHTML ?? null);
  }, []);

  const closeFullscreen = React.useCallback(() => setCloneHtml(null), []);

  return (
    <div ref={frameRef} className="relative">
      {resolved === 'thumbnail' ? (
        <TableThumbnail label={t('openTable')} onOpen={openFullscreen}>
          {children(tableWrapRef)}
        </TableThumbnail>
      ) : (
        <TableScrollContainer
          expandLabel={t('expandTable')}
          onExpand={overflows ? openFullscreen : undefined}
          stickyFirstColumn={stickyFirstColumn}
        >
          {children(tableWrapRef)}
        </TableScrollContainer>
      )}

      {cloneHtml !== null &&
        createPortal(
          <TableFullscreenDialog html={cloneHtml} onClose={closeFullscreen} />,
          document.body
        )}
    </div>
  );
}
