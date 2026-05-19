'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';

import { PlaceholderPlugin } from '@platejs/media/react';
import { KEYS } from 'platejs';
import { createPlatePlugin } from 'platejs/react';

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
            marginLeft: 6,
            padding: '6px 12px',
            border: 'none',
            borderRadius: 10,
            background: state.cancelled ? '#E5E7EB' : '#F3F4F6',
            color: state.cancelled ? '#9CA3AF' : '#06080D',
            fontFamily: "'Manrope', sans-serif",
            fontWeight: 600,
            fontSize: 13,
            lineHeight: '125%',
            cursor: state.cancelled ? 'default' : 'pointer',
            pointerEvents: 'auto',
            transition: 'background 160ms ease',
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

const extractImagesFromHtml = (
  html: string
): { srcs: string[]; markedBody: HTMLElement } => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
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
        <PasteQueueLifecycle />
        <EditorBlockingOverlay />
        <PasteUploadOverlay />
      </>
    ),
  },
  handlers: {
    onPaste: ({ editor, event }) => {
      // While a queue is running, swallow further paste attempts entirely.
      if (queueState.active) {
        event.preventDefault();
        return true;
      }

      const data = (event as unknown as ClipboardEvent).clipboardData;
      if (!data) return;

      const html = data.getData('text/html');
      if (!html || !/<img[\s>]/i.test(html)) return;

      const { srcs, markedBody } = extractImagesFromHtml(html);
      if (srcs.length === 0) return;

      event.preventDefault();

      // Insert the whole HTML fragment first — images are now PUA-text markers,
      // so the document structure (paragraphs, lists, ordering) is preserved
      // and we know exactly where each image needs to land.
      if (markedBody.textContent?.trim() || markedBody.children.length) {
        const fragment = editor.api.html.deserialize({ element: markedBody });
        if (Array.isArray(fragment) && fragment.length > 0) {
          editor.tf.insertFragment(fragment);
        }
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
