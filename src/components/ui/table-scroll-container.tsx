'use client';

import * as React from 'react';

import { Maximize2 } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * Horizontal scroll wrapper for a wide table with edge-fade affordances and an
 * optional sticky first column. Used as the inline preview on wide containers.
 */
export function TableScrollContainer({
  children,
  expandLabel,
  onExpand,
  stickyFirstColumn = true,
}: {
  children: React.ReactNode;
  expandLabel: string;
  /** When omitted the expand button is hidden (e.g. the table already fits). */
  onExpand?: () => void;
  stickyFirstColumn?: boolean;
}) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [edges, setEdges] = React.useState({ left: false, right: false });

  const updateEdges = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const left = el.scrollLeft > 1;
    const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
    setEdges((prev) =>
      prev.left === left && prev.right === right ? prev : { left, right }
    );
  }, []);

  React.useEffect(() => {
    updateEdges();
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(updateEdges);
    ro.observe(el);
    return () => ro.disconnect();
  }, [updateEdges]);

  return (
    <div className="group/table-preview relative">
      <div
        data-show={edges.left}
        className="pointer-events-none absolute inset-y-0 left-0 z-30 w-8 bg-gradient-to-r from-background to-transparent opacity-0 transition-opacity data-[show=true]:opacity-100"
      />
      <div
        data-show={edges.right}
        className="pointer-events-none absolute inset-y-0 right-0 z-30 w-8 bg-gradient-to-l from-background to-transparent opacity-0 transition-opacity data-[show=true]:opacity-100"
      />

      {onExpand && (
        <button
          type="button"
          onClick={onExpand}
          className="absolute top-1 right-1 z-40 inline-flex items-center gap-1 rounded-md border border-border bg-background/85 px-2 py-1 text-xs font-medium shadow-sm backdrop-blur transition-opacity hover:bg-background md:opacity-0 md:group-hover/table-preview:opacity-100"
        >
          <Maximize2 className="size-3.5" />
          {expandLabel}
        </button>
      )}

      <div
        ref={scrollRef}
        onScroll={updateEdges}
        className={cn(
          'overflow-x-auto overscroll-x-contain [scrollbar-width:thin]',
          stickyFirstColumn && [
            '[&_tr>td:first-child]:sticky [&_tr>td:first-child]:left-0 [&_tr>td:first-child]:z-[1]',
            '[&_tr>th:first-child]:sticky [&_tr>th:first-child]:left-0 [&_tr>th:first-child]:z-[2]',
          ]
        )}
      >
        {children}
      </div>
    </div>
  );
}
