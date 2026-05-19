'use client';

import { PlaceholderPlugin } from '@platejs/media/react';
import { KEYS } from 'platejs';
import { createPlatePlugin } from 'platejs/react';

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

const extractImagesFromHtml = (
  html: string
): { srcs: string[]; cleanedBody: HTMLElement } => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const imgs = Array.from(doc.querySelectorAll('img'));
  const srcs = imgs
    .map((img) => img.getAttribute('src') ?? '')
    .filter(Boolean);
  imgs.forEach((img) => img.remove());
  return { srcs, cleanedBody: doc.body };
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

export const GoogleDocsPastePlugin = createPlatePlugin({
  key: 'googleDocsPaste',
  handlers: {
    onPaste: ({ editor, event }) => {
      const data = (event as unknown as ClipboardEvent).clipboardData;
      if (!data) return;

      const html = data.getData('text/html');
      if (!html || !/<img[\s>]/i.test(html)) return;

      const { srcs, cleanedBody } = extractImagesFromHtml(html);
      if (srcs.length === 0) return;

      event.preventDefault();

      // Insert non-image HTML content first so the textual fragment lands at
      // the caret. We then queue uploads asynchronously below.
      if (cleanedBody.textContent?.trim() || cleanedBody.children.length) {
        const fragment = editor.api.html.deserialize({ element: cleanedBody });
        if (Array.isArray(fragment) && fragment.length > 0) {
          editor.tf.insertFragment(fragment);
        }
      }

      void (async () => {
        for (let i = 0; i < srcs.length; i += 1) {
          const src = srcs[i];
          const name = extractFilenameFromSrc(src, i + 1);
          const file = src.startsWith('data:')
            ? await dataUrlToFile(src, name)
            : await urlToFile(src, name);
          if (!file) continue;

          const before = collectPlaceholderIds(editor);
          const dt = new DataTransfer();
          dt.items.add(file);
          editor.getTransforms(PlaceholderPlugin).insert.media(dt.files);
          const after = collectPlaceholderIds(editor);
          const newId = [...after].find((id) => !before.has(id));
          if (newId) await waitForPlaceholderRemoved(editor, newId);
        }
      })();

      return true;
    },
  },
});

export const GoogleDocsPasteKit = [GoogleDocsPastePlugin];
