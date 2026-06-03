'use client';

import * as React from 'react';

import { Minus, Plus, Scan, X } from 'lucide-react';

import { usePlateI18n } from '@/i18n/provider';
import { cn } from '@/lib/utils';

const MIN_ZOOM = 0.3;
const MAX_ZOOM = 3;

const clampZoom = (z: number) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z));

type Pointer = { x: number; y: number };

/**
 * Fullscreen table viewer.
 *
 * Receives a static HTML clone of the rendered table (read-only) and lets the
 * user explore it: zoom buttons + ctrl/⌘-wheel on desktop, pinch-to-zoom and
 * one-finger pan on touch devices.
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
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const pointers = React.useRef(new Map<number, Pointer>());
  const pinchRef = React.useRef<{ dist: number; zoom: number } | null>(null);
  const panRef = React.useRef<{
    x: number;
    y: number;
    ox: number;
    oy: number;
  } | null>(null);

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

  const fitToWidth = React.useCallback(() => {
    const vp = viewportRef.current;
    const content = contentRef.current;
    if (!vp || !content) return;
    const naturalWidth = content.scrollWidth / zoom;
    setZoom(clampZoom((vp.clientWidth - 32) / naturalWidth));
    setOffset({ x: 0, y: 0 });
  }, [zoom]);

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinchRef.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), zoom };
      panRef.current = null;
    } else if (pointers.current.size === 1) {
      panRef.current = {
        x: e.clientX,
        y: e.clientY,
        ox: offset.x,
        oy: offset.y,
      };
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size >= 2 && pinchRef.current) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      setZoom(clampZoom((pinchRef.current.zoom * dist) / pinchRef.current.dist));
      return;
    }
    if (panRef.current) {
      setOffset({
        x: panRef.current.ox + (e.clientX - panRef.current.x),
        y: panRef.current.oy + (e.clientY - panRef.current.y),
      });
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchRef.current = null;
    if (pointers.current.size === 0) panRef.current = null;
  };

  const onWheel = (e: React.WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    setZoom((z) => clampZoom(z - e.deltaY * 0.002));
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-background">
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
        <span className="text-sm font-medium">{t('table')}</span>
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
            className="ml-1 inline-flex items-center gap-1 rounded-md border border-border px-2 py-1.5 text-xs hover:bg-muted"
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
        className="relative flex-1 touch-none overflow-auto overscroll-contain bg-muted/20 p-4"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
      >
        <div
          ref={contentRef}
          className={cn('w-max origin-top-left')}
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
          }}
          // The table is a read-only clone of content already present on the
          // page, so injecting its markup here is safe.
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
}
