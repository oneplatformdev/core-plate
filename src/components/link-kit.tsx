'use client';

import { insertLink, LinkRules, wrapLink } from '@platejs/link';
import { LinkPlugin } from '@platejs/link/react';
import { KEYS, PathApi, RangeApi, TextApi } from 'platejs';

import { LinkElement } from '@/components/ui/link-node';
import { LinkFloatingToolbar } from '@/components/ui/link-toolbar';

const URL_IN_TEXT_REGEX = /(https?:\/\/[^\s<>"']+)/gi;
const TRAILING_PUNCTUATION = /[.,;:!?)\]}>'"`*_~]+$/;

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

const linkifyRange = (
  editor: AnyEditor,
  range: { anchor: { path: number[]; offset: number }; focus: { path: number[]; offset: number } },
) => {
  const linkType = editor.getType(KEYS.link);

  editor.tf.withoutNormalizing(() => {
    const textEntries = Array.from(
      editor.api.nodes({ at: range, match: (n: unknown) => TextApi.isText(n) }),
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
          url: hit.url,
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
  }).overrideEditor(({ editor, tf: { insertData } }) => ({
    transforms: {
      insertData(data: DataTransfer) {
        // Skip file pastes entirely — they have their own handlers.
        if (data.files && data.files.length > 0) {
          insertData(data);
          return;
        }

        const plain = data.getData('text/plain') || '';
        const trimmedPlain = plain.trim();
        URL_IN_TEXT_REGEX.lastIndex = 0;
        const wholeIsUrl =
          !!trimmedPlain &&
          findUrlHits(trimmedPlain).some(
            (hit) => hit.offset === 0 && hit.length === trimmedPlain.length,
          );
        URL_IN_TEXT_REGEX.lastIndex = 0;

        // Selection is expanded and clipboard is a single URL: replace the selection with the link.
        if (
          wholeIsUrl &&
          editor.selection &&
          RangeApi.isExpanded(editor.selection)
        ) {
          const url = stripTrailingPunctuation(trimmedPlain);
          editor.tf.withoutNormalizing(() => {
            editor.tf.delete();
            insertLink(editor, { url, text: url });
          });
          return;
        }

        URL_IN_TEXT_REGEX.lastIndex = 0;
        const hasUrl = URL_IN_TEXT_REGEX.test(plain);
        URL_IN_TEXT_REGEX.lastIndex = 0;

        const startSelection = editor.selection;
        const startPoint =
          startSelection &&
          (RangeApi.isCollapsed(startSelection)
            ? startSelection.anchor
            : RangeApi.end(startSelection));

        insertData(data);

        if (!hasUrl || !startPoint) return;

        const endPoint = editor.selection?.anchor;
        if (!endPoint) return;

        const before =
          PathApi.isBefore(startPoint.path, endPoint.path) ||
          (PathApi.equals(startPoint.path, endPoint.path) &&
            startPoint.offset <= endPoint.offset);

        const range = before
          ? { anchor: startPoint, focus: endPoint }
          : { anchor: endPoint, focus: startPoint };

        linkifyRange(editor as AnyEditor, range);
      },
    },
  })),
];
