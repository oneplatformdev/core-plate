'use client';

import * as React from 'react';

import { Minus, Plus, Scan, Table, X } from 'lucide-react';

import { usePlateI18n } from '@/i18n/provider';
import { cn } from '@/lib/utils';

const MIN_ZOOM = 0.3;
const MAX_ZOOM = 3;

const clampZoom = (z: number) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z));

/**
 * Fullscreen table viewer.
 *
 * Receives a static HTML clone of the rendered table (read-only). Navigation is
 * pure scrolling (wheel / trackpad / touch); zoom is adjusted via the buttons,
 * "fit to width", or ctrl/⌘ + wheel. A spacer sized to the scaled table keeps
 * the scroll area correct even though the table itself is `transform: scale`d.
 */
export function TableFullscreenDialog({
  html,
  onClose,
}: {
  html: string;
  onClose: () => void;
}) {
  const { t } = usePlateI18n();
  const [zoom, setZoom] = React.useState(1);
  const [natural, setNatural] = React.useState({ height: 0, width: 0 });
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  // The clone's natural size is unaffected by the transform, so measuring
  // scrollWidth/Height gives the unscaled dimensions used to size the spacer.
  React.useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    setNatural({ height: el.scrollHeight, width: el.scrollWidth });
  }, [html]);

  const fitToWidth = React.useCallback(() => {
    const vp = viewportRef.current;
    if (!vp || !natural.width) return;
    setZoom(clampZoom((vp.clientWidth - 32) / natural.width));
  }, [natural.width]);

  const onWheel = (e: React.WheelEvent) => {
    // Plain wheel/trackpad scrolls natively; ctrl/⌘ + wheel zooms.
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    setZoom((z) => clampZoom(z - e.deltaY * 0.002));
  };

  return (
    <div
      className="op-plate-scope fixed inset-0 z-[60] flex flex-col bg-black/50 p-2 sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="mx-auto flex size-full max-w-[1400px] flex-col overflow-hidden rounded-xl border border-t-2 border-border border-t-[#9368FF] bg-background shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/40 px-4 py-2.5">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-[#9368FF]/10 text-[#9368FF]">
              <Table className="size-4" />
            </span>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold">{t('viewTable')}</span>
              <span className="hidden text-xs text-muted-foreground sm:block">
                {t('escToClose')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label={t('zoomOut')}
              onClick={() => setZoom((z) => clampZoom(z - 0.2))}
              className="rounded-md border border-border p-1.5 hover:bg-muted"
            >
              <Minus className="size-4" />
            </button>
            <span className="w-12 text-center text-sm tabular-nums">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              aria-label={t('zoomIn')}
              onClick={() => setZoom((z) => clampZoom(z + 0.2))}
              className="rounded-md border border-border p-1.5 hover:bg-muted"
            >
              <Plus className="size-4" />
            </button>
            <button
              type="button"
              onClick={fitToWidth}
              className="ml-1 hidden items-center gap-1 rounded-md border border-border px-2 py-1.5 text-xs hover:bg-muted sm:inline-flex"
            >
              <Scan className="size-3.5" />
              {t('fitToWidth')}
            </button>
            <button
              type="button"
              aria-label={t('close')}
              onClick={onClose}
              className="ml-1 rounded-md border border-border p-1.5 hover:bg-muted"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        <div
          ref={viewportRef}
          className="relative min-h-0 flex-1 overflow-auto overscroll-contain bg-muted/20 p-4"
          onWheel={onWheel}
        >
          {/* Spacer sized to the scaled table so the scroll area is correct. */}
          <div
            style={{
              height: natural.height ? natural.height * zoom : undefined,
              width: natural.width ? natural.width * zoom : undefined,
            }}
          >
            <div
              ref={contentRef}
              className={cn('w-max origin-top-left')}
              style={{ transform: `scale(${zoom})` }}
              // The table is a read-only clone of content already present on
              // the page, so injecting its markup here is safe.
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
