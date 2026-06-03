'use client';

import * as React from 'react';

import { Maximize2 } from 'lucide-react';

const THUMB_MAX_HEIGHT = 220;
const THUMB_MIN_SCALE = 0.28;

/**
 * Scaled-down, non-interactive preview of the whole table for narrow
 * (mobile) containers. Tapping it opens the fullscreen viewer.
 */
export function TableThumbnail({
  children,
  label,
  onOpen,
}: {
  children: React.ReactNode;
  label: string;
  onOpen: () => void;
}) {
  const wrapRef = React.useRef<HTMLButtonElement>(null);
  const scaleRef = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(0.5);
  const [height, setHeight] = React.useState(THUMB_MAX_HEIGHT);

  React.useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const recompute = () => {
      const inner = scaleRef.current;
      if (!inner) return;
      const naturalWidth = inner.scrollWidth;
      const naturalHeight = inner.scrollHeight;
      if (!naturalWidth) return;
      const k = Math.max(
        THUMB_MIN_SCALE,
        Math.min(1, wrap.clientWidth / naturalWidth)
      );
      setScale(k);
      setHeight(Math.min(THUMB_MAX_HEIGHT, naturalHeight * k));
    };

    recompute();
    const ro = new ResizeObserver(recompute);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  return (
    <button
      type="button"
      ref={wrapRef}
      onClick={onOpen}
      aria-label={label}
      className="group/thumb relative block w-full overflow-hidden rounded-lg border border-border bg-card text-left"
      style={{ height }}
    >
      <div
        ref={scaleRef}
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 origin-top-left"
        style={{ transform: `scale(${scale})` }}
      >
        {children}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card to-transparent" />

      <div className="absolute inset-x-0 bottom-0 flex items-center justify-center pb-3">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/90 px-3 py-1.5 text-xs font-medium shadow-sm backdrop-blur transition-transform group-active/thumb:scale-95">
          <Maximize2 className="size-3.5" />
          {label}
        </span>
      </div>
    </button>
  );
}
