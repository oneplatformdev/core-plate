'use client';

import * as React from 'react';

import { createPlatePlugin, useEditorSelector } from 'platejs/react';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { usePlateI18n } from '@/i18n/provider';
import { cn } from '@/lib/utils';

// --- Counting --------------------------------------------------------------
// "Characters" = visible text plus the line breaks between top-level blocks.
// Formatting wrappers (marks, links, etc.) and void nodes (images, media) add
// no characters of their own — only their descendant text counts.

type SlateNode = {
  text?: unknown;
  children?: unknown[];
};

const nodeText = (node: unknown): string => {
  if (!node || typeof node !== 'object') return '';
  const n = node as SlateNode;
  if (typeof n.text === 'string') return n.text;
  if (Array.isArray(n.children)) return n.children.map(nodeText).join('');
  return '';
};

// One '\n' per top-level block boundary mirrors how the document reads.
export const countChars = (value: unknown): number => {
  if (!Array.isArray(value)) return 0;
  return value.map(nodeText).join('\n').length;
};

// Trim a fragment so its text content fits within `budget` characters while
// preserving block/inline structure up to the cut point. Used to clamp paste
// when only part of the pasted content fits under the limit.
const truncateNodes = (
  nodes: unknown[],
  budget: number
): { nodes: unknown[]; used: number } => {
  const out: unknown[] = [];
  let used = 0;

  for (const node of nodes) {
    if (used >= budget) break;
    if (!node || typeof node !== 'object') {
      out.push(node);
      continue;
    }
    const n = node as SlateNode;

    if (typeof n.text === 'string') {
      const text = n.text.slice(0, budget - used);
      used += text.length;
      out.push({ ...n, text });
    } else if (Array.isArray(n.children)) {
      const res = truncateNodes(n.children, budget - used);
      used += res.used;
      out.push({
        ...n,
        children: res.nodes.length ? res.nodes : [{ text: '' }],
      });
    } else {
      out.push(node);
    }
  }

  return { nodes: out, used };
};

// --- UI --------------------------------------------------------------------

function CharCounter({ maxLength }: { maxLength?: number }) {
  const { t } = usePlateI18n();
  const count = useEditorSelector((editor) => countChars(editor.children), []);

  const over = typeof maxLength === 'number' && count > maxLength;

  return (
    <div className="op-plate-scope pointer-events-none sticky bottom-0 z-10 flex justify-end px-3 pb-2">
      <div className="pointer-events-auto flex items-center gap-1 rounded-md bg-[#FCFCFC]/90 px-2 py-0.5 text-xs backdrop-blur-sm">
        <span
          className={cn(
            'tabular-nums font-medium',
            over ? 'text-red-500' : 'text-muted-foreground'
          )}
        >
          {typeof maxLength === 'number' ? `${count} / ${maxLength}` : count}
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={t('charCounterHint')}
              className="flex size-4 items-center justify-center rounded-full border border-current text-[10px] leading-none text-muted-foreground transition-colors hover:text-foreground"
            >
              ?
            </button>
          </TooltipTrigger>
          <TooltipContent>{t('charCounterHint')}</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

// --- Plugin ----------------------------------------------------------------

export const createCharCounterKit = (maxLength?: number) => {
  const CharCounterPlugin = createPlatePlugin({
    key: 'charCounter',
    render: {
      afterEditable: () => <CharCounter maxLength={maxLength} />,
    },
  }).overrideEditor(
    ({ editor, tf: { insertText, insertBreak, insertFragment } }) => ({
      transforms: {
        insertText(text: string, options?: unknown) {
          if (typeof maxLength !== 'number') {
            return (insertText as (t: string, o?: unknown) => void)(text, options);
          }
          const remaining = maxLength - countChars(editor.children);
          if (remaining <= 0) return;
          const next = text.length > remaining ? text.slice(0, remaining) : text;
          (insertText as (t: string, o?: unknown) => void)(next, options);
        },
        insertBreak() {
          // A block break adds one counted character (the line break).
          if (
            typeof maxLength === 'number' &&
            countChars(editor.children) >= maxLength
          ) {
            return;
          }
          (insertBreak as () => void)();
        },
        insertFragment(fragment: unknown[], options?: unknown) {
          if (typeof maxLength !== 'number') {
            return (insertFragment as (f: unknown[], o?: unknown) => void)(
              fragment,
              options
            );
          }
          const remaining = maxLength - countChars(editor.children);
          if (remaining <= 0) return;

          const fragText = Array.isArray(fragment)
            ? fragment.map(nodeText).join('\n')
            : '';
          if (fragText.length <= remaining) {
            return (insertFragment as (f: unknown[], o?: unknown) => void)(
              fragment,
              options
            );
          }

          const { nodes } = truncateNodes(fragment, remaining);
          (insertFragment as (f: unknown[], o?: unknown) => void)(nodes, options);
        },
      },
    })
  );

  return [CharCounterPlugin];
};

export const CharCounterKit = createCharCounterKit();
