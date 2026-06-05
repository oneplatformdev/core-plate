'use client';

import * as React from 'react';
import { Maximize2, Minus, Plus, Scan, X } from 'lucide-react';

import { cn } from '@/lib/utils';

/* -------------------------------------------------------------------------- */
/*  Demo data                                                                 */
/* -------------------------------------------------------------------------- */

const COLUMNS = [
  'ID',
  'Прізвище, ім’я',
  'Підрозділ',
  'Посада',
  'Email',
  'Телефон',
  'Дата прийому',
  'Статус',
  'Локація',
  'Ставка',
];

const ROWS = Array.from({ length: 14 }, (_, i) => [
  String(1000 + i),
  ['Іваненко І.І.', 'Петренко П.П.', 'Сидоренко С.С.', 'Коваленко К.О.'][i % 4],
  ['Інженерія', 'Маркетинг', 'Фінанси', 'HR', 'Продажі'][i % 5],
  ['Senior Developer', 'Team Lead', 'Analyst', 'Manager'][i % 4],
  `user${1000 + i}@oneplatform.dev`,
  `+380 (67) ${String(100 + i).padStart(3, '0')}-45-67`,
  `0${(i % 9) + 1}.0${(i % 9) + 1}.2024`,
  ['Активний', 'У відпустці', 'Випробування'][i % 3],
  ['Київ', 'Львів', 'Одеса', 'Remote'][i % 4],
  `${1.0 + (i % 4) * 0.25}`,
]);

/* -------------------------------------------------------------------------- */
/*  The raw table (shared markup)                                             */
/* -------------------------------------------------------------------------- */

function DemoTable({ stickyFirstColumn }: { stickyFirstColumn?: boolean }) {
  return (
    <table className="border-collapse text-sm" style={{ width: 'max-content' }}>
      <thead>
        <tr>
          {COLUMNS.map((col, i) => (
            <th
              key={col}
              className={cn(
                'whitespace-nowrap border border-border bg-muted px-4 py-2 text-left font-medium',
                stickyFirstColumn &&
                  i === 0 &&
                  'sticky left-0 z-20 shadow-[2px_0_0_0_var(--color-border)]'
              )}
              style={{ minWidth: i === 1 ? 160 : 130 }}
            >
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {ROWS.map((row, r) => (
          <tr key={r} className="even:bg-muted/30">
            {row.map((cell, c) => (
              <td
                key={c}
                className={cn(
                  'whitespace-nowrap border border-border px-4 py-2',
                  stickyFirstColumn &&
                    c === 0 &&
                    'sticky left-0 z-10 bg-background shadow-[2px_0_0_0_var(--color-border)]'
                )}
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* -------------------------------------------------------------------------- */
/*  Variant A — scroll container with edge shadows + sticky first column      */
/* -------------------------------------------------------------------------- */

function TableScrollPreview({ onExpand }: { onExpand: () => void }) {
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
    <div className="group/table relative rounded-lg border border-border">
      {/* edge shadows */}
      <div
        data-show={edges.left}
        className="pointer-events-none absolute inset-y-0 left-0 z-30 w-8 bg-gradient-to-r from-background to-transparent opacity-0 transition-opacity data-[show=true]:opacity-100"
      />
      <div
        data-show={edges.right}
        className="pointer-events-none absolute inset-y-0 right-0 z-30 w-8 bg-gradient-to-l from-background to-transparent opacity-0 transition-opacity data-[show=true]:opacity-100"
      />

      {/* expand button */}
      <button
        type="button"
        onClick={onExpand}
        className="absolute top-2 right-2 z-40 inline-flex items-center gap-1 rounded-md border border-border bg-background/85 px-2 py-1 text-xs font-medium shadow-sm backdrop-blur transition-opacity hover:bg-background md:opacity-0 md:group-hover/table:opacity-100"
      >
        <Maximize2 className="size-3.5" />
        Розгорнути
      </button>

      <div
        ref={scrollRef}
        onScroll={updateEdges}
        className="overflow-x-auto overscroll-x-contain rounded-lg [scrollbar-width:thin]"
      >
        <DemoTable stickyFirstColumn />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Variant C-as-preview — scaled thumbnail of the whole table                */
/* -------------------------------------------------------------------------- */

const THUMB_MAX_HEIGHT = 220;
const THUMB_MIN_SCALE = 0.28;

function TableThumbnailPreview({ onExpand }: { onExpand: () => void }) {
  const wrapRef = React.useRef<HTMLButtonElement>(null);
  const tableRef = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(0.5);
  const [scaledHeight, setScaledHeight] = React.useState(THUMB_MAX_HEIGHT);

  React.useEffect(() => {
    const recompute = () => {
      const wrap = wrapRef.current;
      const table = tableRef.current;
      if (!wrap || !table) return;
      const natW = table.scrollWidth;
      const natH = table.scrollHeight;
      const k = Math.max(THUMB_MIN_SCALE, Math.min(1, wrap.clientWidth / natW));
      setScale(k);
      setScaledHeight(Math.min(THUMB_MAX_HEIGHT, natH * k));
    };
    recompute();
    const ro = new ResizeObserver(recompute);
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  return (
    <button
      type="button"
      onClick={onExpand}
      ref={wrapRef}
      className="group/thumb relative block w-full overflow-hidden rounded-lg border border-border bg-card text-left"
      style={{ height: scaledHeight }}
      aria-label="Відкрити таблицю"
    >
      {/* scaled, non-interactive copy of the table */}
      <div
        ref={tableRef}
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 origin-top-left"
        style={{ transform: `scale(${scale})` }}
      >
        <DemoTable />
      </div>

      {/* bottom fade */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card to-transparent" />

      {/* overlay CTA */}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-center pb-3">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/90 px-3 py-1.5 text-xs font-medium shadow-sm backdrop-blur transition-transform group-active/thumb:scale-95">
          <Maximize2 className="size-3.5" />
          Відкрити таблицю
        </span>
      </div>
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*  Variant B — fullscreen view (web: scroll+zoom buttons / mobile: pan+pinch) */
/* -------------------------------------------------------------------------- */

const MIN_ZOOM = 0.3;
const MAX_ZOOM = 3;

function TableFullscreenDialog({ onClose }: { onClose: () => void }) {
  const [zoom, setZoom] = React.useState(1);
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const pointers = React.useRef(new Map<number, { x: number; y: number }>());
  const pinchRef = React.useRef<{ dist: number; zoom: number } | null>(null);
  const panRef = React.useRef<{ x: number; y: number; ox: number; oy: number } | null>(
    null
  );

  const clampZoom = (z: number) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z));

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const fitToWidth = React.useCallback(() => {
    const vp = viewportRef.current;
    const content = contentRef.current;
    if (!vp || !content) return;
    const natW = content.scrollWidth / zoom;
    setZoom(clampZoom((vp.clientWidth - 32) / natW));
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
      panRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
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
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* toolbar */}
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
        <span className="text-sm font-medium">Таблиця</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
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
            За шириною
          </button>
          <button
            type="button"
            onClick={onClose}
            className="ml-1 rounded-md border border-border p-1.5 hover:bg-muted"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* viewport */}
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
          className="w-max origin-top-left"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
          }}
        >
          <DemoTable />
        </div>
      </div>
      <div className="border-t border-border px-3 py-1.5 text-center text-xs text-muted-foreground">
        Десктоп: Ctrl/⌘ + колесо — зум, перетягування — рух. Мобайл: щипок —
        зум, свайп — рух.
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Prototype page                                                            */
/* -------------------------------------------------------------------------- */

const NARROW_BREAKPOINT = 480;

export function TablePreviewSandbox({ onBack }: { onBack: () => void }) {
  const [width, setWidth] = React.useState(820);
  const [forceMode, setForceMode] = React.useState<'auto' | 'scroll' | 'thumb'>(
    'auto'
  );
  const [fullscreen, setFullscreen] = React.useState(false);

  const mode =
    forceMode === 'auto'
      ? width < NARROW_BREAKPOINT
        ? 'thumb'
        : 'scroll'
      : forceMode;

  return (
    <div className="min-h-screen bg-background p-6 text-foreground">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted"
        >
          ← Назад
        </button>
        <h1 className="text-lg font-semibold">Прототип: широкі таблиці (A+B)</h1>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-4 rounded-lg border border-border bg-card p-3">
        <label className="flex items-center gap-2 text-sm">
          Ширина контейнера:
          <input
            type="range"
            min={300}
            max={1100}
            value={width}
            onChange={(e) => setWidth(Number(e.target.value))}
          />
          <span className="w-14 tabular-nums">{width}px</span>
        </label>
        <div className="flex items-center gap-1 text-sm">
          Режим:
          {(['auto', 'scroll', 'thumb'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setForceMode(m)}
              className={cn(
                'rounded-md border border-border px-2 py-1 text-xs',
                forceMode === m ? 'bg-foreground text-background' : 'hover:bg-muted'
              )}
            >
              {m}
            </button>
          ))}
        </div>
        <span className="text-xs text-muted-foreground">
          активний режим: <b>{mode}</b> (поріг &lt; {NARROW_BREAKPOINT}px →
          thumbnail)
        </span>
      </div>

      {/* simulated content column */}
      <div className="mx-auto" style={{ maxWidth: width }}>
        <p className="mb-3 text-sm text-muted-foreground">
          Тут зверху текст контенту. Нижче — таблиця в контентній колонці
          шириною {width}px.
        </p>
        {mode === 'thumb' ? (
          <TableThumbnailPreview onExpand={() => setFullscreen(true)} />
        ) : (
          <TableScrollPreview onExpand={() => setFullscreen(true)} />
        )}
        <p className="mt-3 text-sm text-muted-foreground">
          Текст контенту після таблиці.
        </p>
      </div>

      {fullscreen && <TableFullscreenDialog onClose={() => setFullscreen(false)} />}
    </div>
  );
}
