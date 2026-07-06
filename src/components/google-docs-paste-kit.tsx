'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';

import { PlaceholderPlugin } from '@platejs/media/react';
import { KEYS } from 'platejs';
import { createPlatePlugin, useEditorRef } from 'platejs/react';

import { usePlateI18n } from '@/i18n/provider';
import { measureImageFile, pasteImageHints } from '@/lib/paste-image-hints';
import { pasteAbortControllers } from '@/lib/paste-abort';

type QueueState = {
  total: number;
  done: number;
  failed: number;
  active: boolean;
  completed: boolean;
  exiting: boolean;
  cancelled: boolean;
};
const initialQueueState: QueueState = {
  total: 0,
  done: 0,
  failed: 0,
  active: false,
  completed: false,
  exiting: false,
  cancelled: false,
};

// Module-level cancel flag the paste loop polls between iterations.
let cancelRequested = false;
let currentAbortController: AbortController | null = null;

const cancelPasteQueue = () => {
  cancelRequested = true;
  currentAbortController?.abort();
  pasteAbortControllers.abortAll();
  setQueueState({ cancelled: true });
};
let queueState: QueueState = initialQueueState;
const queueListeners = new Set<(s: QueueState) => void>();
const setQueueState = (next: Partial<QueueState>) => {
  queueState = { ...queueState, ...next };
  queueListeners.forEach((l) => l(queueState));
};
const subscribeQueue = (l: (s: QueueState) => void) => {
  queueListeners.add(l);
  return () => {
    queueListeners.delete(l);
  };
};

// --- Public API for consumers --------------------------------------------
// Consumers (autosave hooks, dirty-state trackers, etc.) can use these to
// pause work while a Google-Docs paste is uploading images.

export const isPlatePasteActive = (): boolean => queueState.active;

export const subscribePlatePasteActive = (
  cb: (active: boolean) => void
): (() => void) => {
  let last = queueState.active;
  cb(last);
  return subscribeQueue((s) => {
    if (s.active !== last) {
      last = s.active;
      cb(last);
    }
  });
};

export function usePlatePasteActive(): boolean {
  const [active, setActive] = React.useState<boolean>(queueState.active);
  React.useEffect(() => subscribePlatePasteActive(setActive), []);
  return active;
}

function PasteUploadOverlay() {
  const [state, setState] = React.useState<QueueState>(queueState);
  const { t } = usePlateI18n();

  React.useEffect(() => subscribeQueue(setState), []);

  if (!state.active || typeof document === 'undefined') return null;

  const handled = state.done + state.failed;
  const total = Math.max(state.total, 1);
  const ratio = Math.min(1, handled / total);
  const percent = Math.round(ratio * 100);

  // Ring geometry: bigger loader living inside the left tile of the card.
  const size = 32;
  const stroke = 3.5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  const failedText = state.failed > 0
    ? t('pasteUploadingFailed').replace('{{failed}}', String(state.failed))
    : null;

  const isDone = state.completed;
  const tileBg = isDone ? 'rgba(76, 175, 80, 0.12)' : 'rgba(147, 104, 255, 0.10)';

  return createPortal(
    <>
      <style>{`
        @keyframes coreplate-check-pop {
          0% { transform: scale(0.6); opacity: 0; }
          60% { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes coreplate-check-draw {
          from { stroke-dashoffset: 24; }
          to { stroke-dashoffset: 0; }
        }
      `}</style>
      <div
        style={{
          position: 'fixed',
          bottom: 24,
          left: '50%',
          transform: state.exiting
            ? 'translateX(-50%) translateY(12px)'
            : 'translateX(-50%) translateY(0)',
          opacity: state.exiting ? 0 : 1,
          transition: 'opacity 320ms ease, transform 320ms ease',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          padding: 8,
          paddingRight: 20,
          background: '#FFFFFF',
          borderRadius: 16,
          boxShadow: '0 10px 30px rgba(15, 23, 42, 0.14)',
          fontFamily: "'Manrope', sans-serif",
          color: '#06080D',
          pointerEvents: 'none',
          minWidth: 260,
        }}
        role="status"
        aria-live="polite"
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 64,
            height: 64,
            flex: 'none',
            background: tileBg,
            borderRadius: 12,
            transition: 'background 240ms ease',
          }}
        >
          {isDone ? (
            <svg
              width={size}
              height={size}
              viewBox={`0 0 ${size} ${size}`}
              style={{
                animation: 'coreplate-check-pop 320ms cubic-bezier(0.2, 0.8, 0.2, 1)',
              }}
            >
              <circle
                cx={size / 2}
                cy={size / 2}
                r={r + 0.5}
                fill="#4CAF50"
              />
              <path
                d="M9 16.5l4.2 4.2L23 11"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={24}
                style={{
                  animation:
                    'coreplate-check-draw 260ms ease forwards 120ms',
                  strokeDashoffset: 24,
                }}
              />
            </svg>
          ) : (
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
              <circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke="rgba(147, 104, 255, 0.22)"
                strokeWidth={stroke}
              />
              <circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={state.failed > 0 ? '#F59E0B' : '#9368FF'}
                strokeWidth={stroke}
                strokeDasharray={c}
                strokeDashoffset={c * (1 - ratio)}
                strokeLinecap="round"
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                style={{
                  transition:
                    'stroke-dashoffset 200ms ease, stroke 200ms ease',
                }}
              />
            </svg>
          )}
        </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 4,
          minWidth: 0,
        }}
      >
        <div
          style={{
            fontWeight: 700,
            fontSize: 16,
            lineHeight: '125%',
            color: '#06080D',
          }}
        >
          {`${handled} / ${state.total}`}
        </div>
        <div
          style={{
            fontWeight: 500,
            fontSize: 13,
            lineHeight: '125%',
            color: '#6B7280',
          }}
        >
          {t('pasteUploadingFiles')}
          {failedText && (
            <span style={{ color: '#B45309', marginLeft: 6 }}>{` · ${failedText}`}</span>
          )}
        </div>
      </div>
      {!state.completed && !state.exiting && (
        <button
          type="button"
          onClick={cancelPasteQueue}
          disabled={state.cancelled}
          style={{
            boxSizing: 'border-box',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '6px 12px',
            height: 32,
            background: '#FCFCFC',
            border: '1px solid #E1E1E5',
            borderRadius: 8,
            color: '#06080D',
            fontFamily: "'Manrope', sans-serif",
            fontWeight: 500,
            fontSize: 13,
            lineHeight: '140%',
            cursor: state.cancelled ? 'default' : 'pointer',
            opacity: state.cancelled ? 0.5 : 1,
            pointerEvents: 'auto',
            transition: 'opacity 160ms ease, background 160ms ease',
            whiteSpace: 'nowrap',
          }}
        >
          {t('cancel')}
        </button>
      )}
    </div>
    </>,
    document.body
  );
}

const dataUrlToFile = async (
  dataUrl: string,
  filename: string
): Promise<File | null> => {
  try {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new File([blob], filename, { type: blob.type || 'image/png' });
  } catch {
    return null;
  }
};

const urlToFile = async (
  url: string,
  filename: string
): Promise<File | null> => {
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) return null;
    const blob = await res.blob();
    if (!blob.type.startsWith('image/')) return null;
    return new File([blob], filename, { type: blob.type });
  } catch {
    // External hosts (e.g. lh*.googleusercontent.com) typically block CORS —
    // we silently drop those images for now. Wire a backend proxy here later
    // if the user needs them.
    return null;
  }
};

const extractFilenameFromSrc = (src: string, index: number): string => {
  if (src.startsWith('data:')) {
    const match = /^data:image\/([a-zA-Z0-9+.-]+)/.exec(src);
    const ext = match?.[1]?.split('+')[0] ?? 'png';
    return `pasted-image-${Date.now()}-${index}.${ext}`;
  }
  try {
    const u = new URL(src);
    const last = u.pathname.split('/').filter(Boolean).pop();
    if (last && /\.[a-zA-Z0-9]+$/.test(last)) return last;
  } catch {
    /* noop */
  }
  return `pasted-image-${Date.now()}-${index}.png`;
};

// PUA characters — not produced by Google Docs HTML and not whitespace, so
// they survive Plate's HTML deserialization as plain text and we can locate
// them later to splice in the actual media node at the right offset.
const MARKER_OPEN = '';
const MARKER_CLOSE = '';
const markerFor = (index: number) => `${MARKER_OPEN}${index}${MARKER_CLOSE}`;

// @platejs/table only registers HTML deserializer rules for <table>/<tr>/<td>/<th>
// (validNodeName matches), not for <thead>/<tbody>/<tfoot>/<colgroup>. Google Docs,
// Word and Excel/Sheets all wrap rows in <tbody>, so the deserializer walk never
// reaches the <tr> elements and the whole table falls back to plain text. Unwrap
// those wrapper elements (replace them with their children) so the table's direct
// children are exactly what the upstream rules expect: <tr> and (for <colgroup>) nothing.
const unwrapTableWrappers = (root: HTMLElement): void => {
  const wrappers = Array.from(
    root.querySelectorAll('thead, tbody, tfoot, colgroup')
  );
  wrappers.forEach((el) => {
    if (el.tagName === 'COLGROUP') {
      el.remove();
      return;
    }
    while (el.firstChild) {
      const child = el.firstChild;
      // Pretty-printed HTML (e.g. copied back out of our own editor) has
      // whitespace-only text nodes between <tr> tags. Hoisting those up as
      // direct children of <table> makes the deserializer emit a stray Text
      // node alongside the row nodes, which later crashes computeCellIndices
      // (`row.children` is undefined for a Text node). Drop them instead.
      if (child.nodeType === Node.TEXT_NODE && !child.textContent?.trim()) {
        child.remove();
        continue;
      }
      el.parentNode?.insertBefore(child, el);
    }
    el.remove();
  });
};

const extractImagesFromHtml = (
  html: string
): { srcs: string[]; markedBody: HTMLElement } => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  unwrapTableWrappers(doc.body);
  const imgs = Array.from(doc.querySelectorAll('img'));
  const srcs: string[] = [];
  imgs.forEach((img) => {
    const src = img.getAttribute('src') ?? '';
    if (!src) {
      img.remove();
      return;
    }
    const index = srcs.length;
    srcs.push(src);
    img.replaceWith(doc.createTextNode(markerFor(index)));
  });
  return { srcs, markedBody: doc.body };
};

// Walks the editor for a text node containing the marker for `index` and
// returns the slate range covering that marker.
const findMarkerRange = (
  editor: any,
  index: number
): { anchor: { path: number[]; offset: number }; focus: { path: number[]; offset: number } } | null => {
  const needle = markerFor(index);
  for (const [node, path] of editor.api.nodes({
    at: [],
    match: (n: any) => typeof n?.text === 'string',
  })) {
    const text: string = (node as any).text;
    const at = text.indexOf(needle);
    if (at >= 0) {
      return {
        anchor: { path, offset: at },
        focus: { path, offset: at + needle.length },
      };
    }
  }
  return null;
};

// Snapshot all placeholder-node ids currently present in the editor. Used to
// diff before/after `insert.media([file])` so we can identify the newly
// inserted placeholder and wait until it's replaced by the uploaded media.
const collectPlaceholderIds = (editor: any): Set<string> => {
  const ids = new Set<string>();
  for (const [node] of editor.api.nodes({
    at: [],
    match: (n: any) => n?.type === KEYS.placeholder,
  })) {
    const id = (node as any)?.id;
    if (typeof id === 'string') ids.add(id);
  }
  return ids;
};

// Resolves once the placeholder with this id is gone from the editor tree —
// which happens both on successful upload (replaced by the real media node)
// and on upload error (placeholder is torn down). 5 min hard cap keeps the
// queue from getting stuck if something pathological happens upstream.
const waitForPlaceholderRemoved = (
  editor: any,
  id: string,
  timeoutMs = 5 * 60 * 1000
): Promise<void> =>
  new Promise((resolve) => {
    const start = Date.now();
    const tick = () => {
      if (!collectPlaceholderIds(editor).has(id)) return resolve();
      if (Date.now() - start > timeoutMs) return resolve();
      setTimeout(tick, 200);
    };
    tick();
  });

// Drop / programmatic entry point: upload a batch of real File objects ONE AT A
// TIME through the same queue + progress overlay as the Google-Docs paste flow.
// Mirrors the paste loop but without PUA markers — we already hold the files, so
// each one is inserted as a placeholder and we wait for it to finish uploading
// before starting the next. Used by the editor's file-drop handler so dropping
// e.g. 10 files creates a sequential queue instead of 10 concurrent uploads.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function enqueueMediaFiles(editor: any, files: ArrayLike<File>) {
  const list = Array.from(files ?? []);
  console.log('[mediaQueue] enqueueMediaFiles called, files=', list.length); // TEMP DEBUG
  if (list.length === 0) return;
  // A queue is already running — ignore the new batch (matches the paste
  // handler, which swallows further input while uploading) instead of
  // clobbering the in-flight progress state.
  if (queueState.active) return;

  cancelRequested = false;
  setQueueState({
    total: list.length,
    done: 0,
    failed: 0,
    active: true,
    completed: false,
    exiting: false,
    cancelled: false,
  });

  try {
    for (let i = 0; i < list.length; i += 1) {
      if (cancelRequested) break;

      const file = list[i];
      // Pre-measure images so the skeleton reserves the right aspect ratio.
      const dims = file.type.startsWith('image/')
        ? await measureImageFile(file)
        : null;
      if (cancelRequested) break;

      const before = collectPlaceholderIds(editor);
      const dt = new DataTransfer();
      dt.items.add(file);
      // One file per insert keeps us within maxFileCount and lets us track the
      // single new placeholder to await.
      editor.getTransforms(PlaceholderPlugin).insert.media(dt.files);
      const after = collectPlaceholderIds(editor);
      const newId = [...after].find((id) => !before.has(id));

      if (newId && dims) pasteImageHints.set(newId, dims);

      const controller = new AbortController();
      currentAbortController = controller;
      if (newId) pasteAbortControllers.set(newId, controller);

      if (newId) await waitForPlaceholderRemoved(editor, newId);

      if (newId) {
        pasteImageHints.delete(newId);
        pasteAbortControllers.delete(newId);
      }
      currentAbortController = null;

      if (cancelRequested) break;
      setQueueState({ done: queueState.done + 1 });
    }
  } finally {
    if (cancelRequested) {
      setQueueState({ exiting: true });
      setTimeout(() => {
        setQueueState(initialQueueState);
        cancelRequested = false;
      }, 360);
    } else {
      // Green check, brief hold, then fade out — same as the paste flow.
      setQueueState({ completed: true });
      setTimeout(() => {
        setQueueState({ exiting: true });
        setTimeout(() => setQueueState(initialQueueState), 360);
      }, 900);
    }
  }
}

// Native, capture-phase file-drop interceptor. Neither the dnd plugin's
// onDropFiles nor Plate's `handlers.onDrop` fire for OS file drops here —
// react-dnd's HTML5Backend grabs the native drop first and Slate's default then
// crashes on it (removeNodes on an undefined path). Catching the DOM `drop` in
// the CAPTURE phase on the editor container — before react-dnd's window-level
// handling completes — lets us preventDefault + stopPropagation and route the
// files into the same sequential upload queue + overlay as the paste flow.
function FileDropQueue() {
  const editor = useEditorRef();

  React.useEffect(() => {
    let root: HTMLElement | null = null;
    try {
      root = editor.api.toDOMNode(editor) as HTMLElement | null;
    } catch {
      root = null;
    }
    if (!root) return;

    // Catch drops anywhere over the editor's scroll area, not just the text.
    const editable =
      (root.closest('[data-slate-editor]') as HTMLElement) ?? root;
    const scope: HTMLElement = editable.parentElement ?? editable;

    const hasFiles = (e: DragEvent) =>
      Array.from(e.dataTransfer?.types ?? []).includes('Files');

    const onDragOver = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      // Required so the element is treated as a valid drop target and the
      // subsequent `drop` event actually fires.
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
    };

    const onDrop = (e: DragEvent) => {
      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;
      e.preventDefault();
      e.stopPropagation();
      console.log('[mediaQueue] native capture drop, files=', files.length); // TEMP DEBUG
      void enqueueMediaFiles(editor, files);
    };

    scope.addEventListener('dragover', onDragOver as EventListener, true);
    scope.addEventListener('drop', onDrop as EventListener, true);
    return () => {
      scope.removeEventListener('dragover', onDragOver as EventListener, true);
      scope.removeEventListener('drop', onDrop as EventListener, true);
    };
  }, [editor]);

  return null;
}

// Mounted for the lifetime of the editor. When the editor unmounts (user
// navigated away from the page) we wipe any in-flight queue state so a return
// trip starts clean instead of showing a stale progress bar.
function PasteQueueLifecycle() {
  React.useEffect(() => {
    return () => {
      if (!queueState.active) return;
      cancelRequested = true;
      currentAbortController?.abort();
      pasteAbortControllers.abortAll();
      setQueueState({
        active: false,
        exiting: false,
        completed: false,
        cancelled: false,
        total: 0,
        done: 0,
        failed: 0,
      });
      cancelRequested = false;
    };
  }, []);
  return null;
}

function EditorBlockingOverlay() {
  const [state, setState] = React.useState<QueueState>(queueState);

  React.useEffect(() => subscribeQueue(setState), []);

  if (!state.active) return null;

  // Once the queue has finished (completed) we let pointer events through
  // again — the fade-out is purely cosmetic and shouldn't block typing.
  const blocking = !state.completed;

  return (
    <div
      aria-hidden
      onMouseDownCapture={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onClickCapture={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(255, 255, 255, 0.45)',
        backdropFilter: 'blur(2px)',
        WebkitBackdropFilter: 'blur(2px)',
        cursor: 'progress',
        zIndex: 40,
        opacity: state.exiting ? 0 : 1,
        transition: 'opacity 320ms ease',
        pointerEvents: blocking ? 'auto' : 'none',
      }}
    />
  );
}

export const GoogleDocsPastePlugin = createPlatePlugin({
  key: 'googleDocsPaste',
  render: {
    afterEditable: () => (
      <>
        <FileDropQueue />
        <PasteQueueLifecycle />
        <EditorBlockingOverlay />
        <PasteUploadOverlay />
      </>
    ),
  },
  handlers: {
    // Native file drag-and-drop → sequential upload queue (same flow/overlay as
    // the Google-Docs image paste below). Handled here at the plugin level
    // because the dnd plugin's onDropFiles doesn't reliably fire for OS files.
    onDrop: ({ editor, event }) => {
      const files = (
        event as unknown as { dataTransfer?: DataTransfer | null }
      ).dataTransfer?.files;
      console.log('[mediaQueue] plugin onDrop, files=', files?.length); // TEMP DEBUG
      if (!files || files.length === 0) return;
      event.preventDefault();
      // While a queue runs, swallow further drops instead of starting a second.
      if (queueState.active) return true;
      void enqueueMediaFiles(editor, files);
      return true;
    },
    onPaste: ({ editor, event }) => {
      // While a queue is running, swallow further paste attempts entirely.
      if (queueState.active) {
        event.preventDefault();
        return true;
      }

      const data = (event as unknown as ClipboardEvent).clipboardData;
      if (!data) return;

      const html = data.getData('text/html');

      // Copying selection out of this same editor (or pasting it back in)
      // carries Plate's own lossless fragment format alongside the HTML —
      // the exact original Slate nodes, no DOM/HTML round-trip involved. Our
      // HTML-sniffing branches below exist only for content coming from
      // Google Docs/Word/Sheets, which don't set this. If it's present, step
      // aside entirely and let Plate's default insertData use it — that's
      // what actually has lossless table/paragraph/list fidelity; rebuilding
      // a synthetic DataTransfer from text/html here (as we used to) drops
      // this format and forces the lossy HTML deserializer path, which is
      // exactly what was corrupting copy-paste round trips of tables.
      if (Array.from(data.types).includes('application/x-slate-fragment')) return;

      // Safari/WebKit does not preserve non-standard clipboard MIME types
      // (only text/plain, text/html, text/uri-list, Files survive the OS
      // pasteboard round-trip there), so `application/x-slate-fragment` is
      // silently dropped on that browser even for an internal editor copy.
      // slate-react embeds the same payload as a literal
      // `data-slate-fragment="..."` attribute inside the text/html string as
      // a fallback for exactly this case — but Plate's own default insertData
      // pipeline does NOT reliably recover it from there: its generic HTML
      // deserializer just treats the wrapping element like any other node,
      // copying `data-*` attributes onto the resulting node's properties.
      // That corrupts the paste twice over — sibling paragraphs collapse
      // into one block (the deserializer has no block-boundary rule for our
      // internal `<div class="slate-p">` markup, only real `<p>`/`<h1>` tags),
      // and a stray node ends up with a `fragment: "<the whole base64 blob>"`
      // property. So don't just step aside here: pull the payload out
      // ourselves and hand Plate a DataTransfer with the canonical MIME type
      // restored, which is the exact shape Chrome's real paste event has and
      // which we've confirmed round-trips losslessly.
      const fragmentMatch = /\sdata-slate-fragment="([^"]+)"/.exec(html);
      if (fragmentMatch) {
        event.preventDefault();
        const transfer = new DataTransfer();
        transfer.setData('application/x-slate-fragment', fragmentMatch[1]);
        transfer.setData('text/html', html);
        const plainForFragment = data.getData('text/plain');
        if (plainForFragment) transfer.setData('text/plain', plainForFragment);
        editor.tf.insertData(transfer);
        return true;
      }

      if (!html || !/<img[\s>]/i.test(html)) {
        // No Google-Docs HTML images, but the clipboard may carry real files
        // (pasted screenshot, copied files) — upload them through the same
        // sequential queue instead of letting them drop in all at once.
        if (data.files && data.files.length > 0) {
          event.preventDefault();
          void enqueueMediaFiles(editor, data.files);
          return true;
        }

        // Table HTML (Word/Sheets/Docs) wraps rows in <thead>/<tbody>, which
        // @platejs/table's deserializer rules don't recognize — left to the
        // default paste path the table degrades to plain text. We only need
        // to fix the markup (unwrap those wrappers) and hand it back to
        // Plate's own insertData/html-deserialize pipeline, so every other
        // paste behavior (paragraph/blank-line fidelity, lists, etc.) is
        // untouched. Deserializing+inserting the body ourselves here used to
        // bypass that pipeline entirely and collapsed the rest of the
        // document's formatting — don't reintroduce that.
        if (html && /<table[\s>]/i.test(html)) {
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          unwrapTableWrappers(doc.body);
          const correctedHtml = doc.body.innerHTML;
          if (correctedHtml) {
            event.preventDefault();
            const transfer = new DataTransfer();
            transfer.setData('text/html', correctedHtml);
            const plain = data.getData('text/plain');
            if (plain) transfer.setData('text/plain', plain);
            editor.tf.insertData(transfer);
            return true;
          }
        }
        return;
      }

      const { srcs, markedBody } = extractImagesFromHtml(html);
      if (srcs.length === 0) return;

      event.preventDefault();

      // Insert the whole HTML fragment first — images are now PUA-text markers,
      // so the document structure (paragraphs, lists, ordering) is preserved
      // and we know exactly where each image needs to land.
      //
      // This used to deserialize markedBody and editor.tf.insertFragment the
      // result directly, which bypasses Plate's own insertData pipeline
      // (paragraph/blank-line handling, list/table rules, etc.) and collapses
      // formatting — most visible when copying content back out of this same
      // editor (its own clipboard HTML round-trips through here too, since it
      // always contains <img> placeholders). Hand the marked-up HTML back to
      // the standard insertData transform instead, same as the table-only
      // path above.
      if (markedBody.textContent?.trim() || markedBody.children.length) {
        const transfer = new DataTransfer();
        transfer.setData('text/html', markedBody.innerHTML);
        const plain = data.getData('text/plain');
        if (plain) transfer.setData('text/plain', plain);
        editor.tf.insertData(transfer);
      }

      void (async () => {
        cancelRequested = false;
        setQueueState({
          total: srcs.length,
          done: 0,
          failed: 0,
          active: true,
          completed: false,
          exiting: false,
          cancelled: false,
        });
        try {
          for (let i = 0; i < srcs.length; i += 1) {
            if (cancelRequested) break;

            const src = srcs[i];
            const name = extractFilenameFromSrc(src, i + 1);
            const file = src.startsWith('data:')
              ? await dataUrlToFile(src, name)
              : await urlToFile(src, name);

            if (cancelRequested) break;

            const range = findMarkerRange(editor, i);
            if (range) {
              editor.tf.select(range);
              editor.tf.delete();
            }

            if (!file) {
              setQueueState({ failed: queueState.failed + 1 });
              continue;
            }

            // Pre-measure so the skeleton box can reserve the right aspect
            // ratio from the very first paint — keeps the editor from
            // scroll-jumping as each image loads.
            const dims = await measureImageFile(file);
            if (cancelRequested) break;

            const before = collectPlaceholderIds(editor);
            const dt = new DataTransfer();
            dt.items.add(file);
            editor.getTransforms(PlaceholderPlugin).insert.media(dt.files);
            const after = collectPlaceholderIds(editor);
            const newId = [...after].find((id) => !before.has(id));

            if (newId && dims) pasteImageHints.set(newId, dims);

            // Hook an AbortController to this placeholder. PlaceholderElement
            // reads it via pasteAbortControllers.get(id) and passes the signal
            // through to the consumer's onUploadFile(file, { signal }).
            const controller = new AbortController();
            currentAbortController = controller;
            if (newId) pasteAbortControllers.set(newId, controller);

            if (newId) await waitForPlaceholderRemoved(editor, newId);

            if (newId) {
              pasteImageHints.delete(newId);
              pasteAbortControllers.delete(newId);
            }
            currentAbortController = null;

            if (cancelRequested) break;
            setQueueState({ done: queueState.done + 1 });
          }
        } finally {
          // If we were cancelled, sweep any leftover PUA markers out of the
          // document so the user isn't left with garbage text where the
          // un-uploaded images would have gone.
          if (cancelRequested) {
            for (let i = 0; i < srcs.length; i += 1) {
              const range = findMarkerRange(editor, i);
              if (!range) continue;
              editor.tf.select(range);
              editor.tf.delete();
            }
          }

          if (cancelRequested) {
            // Skip the green check on cancel — just fade out.
            setQueueState({ exiting: true });
            setTimeout(() => {
              setQueueState({
                active: false,
                exiting: false,
                completed: false,
                cancelled: false,
                total: 0,
                done: 0,
                failed: 0,
              });
              cancelRequested = false;
            }, 360);
          } else {
            // 1) Switch loader to a green check, hold briefly so the user
            //    registers completion. 2) Trigger fade-out. 3) Reset state.
            setQueueState({ completed: true });
            setTimeout(() => {
              setQueueState({ exiting: true });
              setTimeout(() => {
                setQueueState({
                  active: false,
                  exiting: false,
                  completed: false,
                  cancelled: false,
                  total: 0,
                  done: 0,
                  failed: 0,
                });
              }, 360);
            }, 900);
          }
        }
      })();

      return true;
    },
  },
});

export const GoogleDocsPasteKit = [GoogleDocsPastePlugin];
