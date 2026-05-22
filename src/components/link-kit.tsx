'use client';

import { insertLink, LinkRules, wrapLink } from '@platejs/link';
import { LinkPlugin } from '@platejs/link/react';
import { ElementApi, KEYS, RangeApi, TextApi } from 'platejs';

import { LinkElement } from '@/components/ui/link-node';
import { LinkFloatingToolbar } from '@/components/ui/link-toolbar';

// Matches:
// - full URLs:        https://... / http://...
// - www. prefix:      www.example.com/...
// - bare common TLDs: example.com, sub.example.org/path
const COMMON_TLDS =
  'com|org|net|io|dev|app|co|ua|ru|info|biz|me|tv|gov|edu|uk|de|fr|it|es|pl|cz|sk|kz|by|cloud|xyz|online|tech|site|store|shop|website|news|media|live|space|today';
const URL_IN_TEXT_REGEX = new RegExp(
  `((?:https?:\\/\\/|www\\.)[^\\s<>"']+|(?:[a-zA-Z0-9][a-zA-Z0-9-]*\\.)+(?:${COMMON_TLDS})\\b(?:\\/[^\\s<>"']*)?)`,
  'gi',
);
const TRAILING_PUNCTUATION = /[.,;:!?)\]}>'"`*_~]+$/;

const normalizeUrl = (raw: string) =>
  /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

const stripTrailingPunctuation = (url: string) => {
  let cleaned = url.replace(TRAILING_PUNCTUATION, '');
  const opens = (cleaned.match(/\(/g) || []).length;
  const closes = (cleaned.match(/\)/g) || []).length;
  if (closes > opens) cleaned = cleaned.replace(/\)+$/, '');
  return cleaned;
};

const findUrlHits = (text: string) => {
  const hits: Array<{ url: string; offset: number; length: number }> = [];
  for (const match of text.matchAll(URL_IN_TEXT_REGEX)) {
    const url = stripTrailingPunctuation(match[0]);
    if (!url) continue;
    hits.push({ url, offset: match.index ?? 0, length: url.length });
  }
  return hits;
};

type AnyEditor = Parameters<typeof wrapLink>[0];

type SlateNode = { [key: string]: unknown; children?: SlateNode[]; text?: string; type?: string };

const linkifyFragment = (
  editor: AnyEditor,
  nodes: SlateNode[],
): SlateNode[] => {
  const linkType = editor.getType(KEYS.link);

  const transformNode = (node: SlateNode): SlateNode[] => {
    if (TextApi.isText(node)) {
      const text = (node as { text: string }).text;
      const hits = findUrlHits(text);
      if (!hits.length) return [node];

      const out: SlateNode[] = [];
      let cursor = 0;
      for (const hit of hits) {
        if (hit.offset > cursor) {
          out.push({ ...node, text: text.slice(cursor, hit.offset) });
        }
        const linkChildText = text.slice(hit.offset, hit.offset + hit.length);
        out.push({
          type: linkType,
          url: normalizeUrl(hit.url),
          target: '_blank',
          children: [{ ...node, text: linkChildText }],
        });
        cursor = hit.offset + hit.length;
      }
      if (cursor < text.length) {
        out.push({ ...node, text: text.slice(cursor) });
      }
      return out;
    }

    if (ElementApi.isElement(node)) {
      // Don't recurse into existing links — keep them as-is.
      if (node.type === linkType) return [node];
      const children = Array.isArray(node.children) ? node.children : [];
      const newChildren = children.flatMap((child) => transformNode(child as SlateNode));
      return [{ ...node, children: newChildren }];
    }

    return [node];
  };

  return nodes.flatMap(transformNode);
};

const linkifyEditor = (editor: AnyEditor) => {
  const linkType = editor.getType(KEYS.link);

  editor.tf.withoutNormalizing(() => {
    const textEntries = Array.from(
      editor.api.nodes({ at: [], match: (n: unknown) => TextApi.isText(n) }),
    ) as Array<[{ text: string }, number[]]>;

    // Process in reverse so earlier paths remain valid as later nodes are split.
    for (const [node, path] of textEntries.slice().reverse()) {
      const insideLink = editor.api.above({
        at: path,
        match: { type: linkType },
      });
      if (insideLink) continue;

      const hits = findUrlHits(node.text);
      for (const hit of hits.slice().reverse()) {
        wrapLink(editor, {
          at: {
            anchor: { path, offset: hit.offset },
            focus: { path, offset: hit.offset + hit.length },
          },
          url: normalizeUrl(hit.url),
        });
      }
    }
  });
};

export const LinkKit = [
  LinkPlugin.configure({
    options: {
      keepSelectedTextOnPaste: false,
    },
    inputRules: [
      LinkRules.markdown(),
      LinkRules.autolink({ variant: 'paste' }),
      LinkRules.autolink({ variant: 'space' }),
      LinkRules.autolink({ variant: 'break' }),
    ],
    render: {
      node: LinkElement,
      afterEditable: () => <LinkFloatingToolbar />,
    },
  })
    // Pre-process any fragment being inserted (covers HTML paste from Google
    // Docs, markdown paste, drag-drop, etc.). Text nodes whose `text`
    // contains URL substrings are split and wrapped in link nodes BEFORE
    // they hit the document.
    .overrideEditor(({ editor, tf: { insertFragment } }) => ({
      transforms: {
        insertFragment(fragment: unknown[], options?: unknown) {
          const transformed = linkifyFragment(editor as AnyEditor, fragment as SlateNode[]);
          (insertFragment as (f: unknown[], o?: unknown) => void)(transformed, options);
        },
      },
    }))
    // Special-case: expanded selection + clipboard with a single URL →
    // replace selection with the link (works across multi-block selection).
    .overrideEditor(({ editor, tf: { insertData } }) => ({
      transforms: {
        insertData(data: DataTransfer) {
          const plain = data.getData('text/plain') || '';
          const trimmedPlain = plain.trim();
          URL_IN_TEXT_REGEX.lastIndex = 0;
          const wholeIsUrl =
            !!trimmedPlain &&
            findUrlHits(trimmedPlain).some(
              (hit) => hit.offset === 0 && hit.length === trimmedPlain.length,
            );
          URL_IN_TEXT_REGEX.lastIndex = 0;

          if (
            wholeIsUrl &&
            editor.selection &&
            RangeApi.isExpanded(editor.selection)
          ) {
            const display = stripTrailingPunctuation(trimmedPlain);
            const url = normalizeUrl(display);
            editor.tf.withoutNormalizing(() => {
              editor.tf.delete();
              insertLink(editor, { url, text: display });
            });
            return;
          }

          insertData(data);

          // Safety net: post-process the doc in case the insertion path
          // bypassed insertFragment (e.g. some plugins insert via insertText).
          setTimeout(() => linkifyEditor(editor as AnyEditor), 0);
        },
      },
    })),
];
