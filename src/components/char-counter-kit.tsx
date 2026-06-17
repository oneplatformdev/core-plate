'use client';

import * as React from 'react';

import { RangeApi } from 'platejs';
import { createPlatePlugin, useEditorSelector } from 'platejs/react';

import { Tooltip as TooltipPrimitive } from 'radix-ui';

import { Tooltip, TooltipTrigger } from '@/components/ui/tooltip';
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

// Top-level block types that are structural/atomic (no "line" semantics). They
// don't count toward block-break separators: Slate wraps tables/media with empty
// paragraphs, so an inserted (empty) table must not inflate the count via its
// borders. Their inner visible text (e.g. table cell text) still counts.
const STRUCTURAL_BLOCK_TYPES = new Set([
  'table',
  'img',
  'image',
  'video',
  'audio',
  'file',
  'media_embed',
  'mediaEmbed',
  'hr',
  'horizontal_rule',
]);

const isStructuralBlock = (node: unknown): boolean => {
  const type = (node as { type?: unknown } | null)?.type;
  return typeof type === 'string' && STRUCTURAL_BLOCK_TYPES.has(type);
};

// Each indentation level (Tab) is one character. `indent` is a numeric prop on
// block nodes; sum it across the whole tree.
const sumIndent = (nodes: unknown[]): number => {
  let total = 0;
  for (const node of nodes) {
    if (!node || typeof node !== 'object') continue;
    const n = node as { indent?: unknown; children?: unknown[] };
    if (typeof n.indent === 'number' && n.indent > 0) total += n.indent;
    if (Array.isArray(n.children)) total += sumIndent(n.children);
  }
  return total;
};

// Counted "characters" = visible text (soft breaks from Shift+Enter are literal
// "\n" already inside text, so they count as 1) + one per hard block break
// (Enter) between non-structural blocks + one per indentation level.
export const countChars = (value: unknown): number => {
  if (!Array.isArray(value)) return 0;

  let total = 0;
  for (let i = 0; i < value.length; i++) {
    const block = value[i];
    total += nodeText(block).length;
    // Block break (Enter) counts, except where a structural/void block (table,
    // media) sits on either side of the boundary.
    if (
      i > 0 &&
      !isStructuralBlock(block) &&
      !isStructuralBlock(value[i - 1])
    ) {
      total += 1;
    }
  }
  total += sumIndent(value);
  return total;
};

// Trim a fragment so its *counted* length fits within `budget`, preserving
// block/inline structure up to the cut point. The accounting mirrors
// `countChars` — text length, one separator per top-level block boundary, and
// indent levels — so a truncated multi-block paste never overshoots the limit
// (otherwise the uncounted block breaks pushed the total past max, e.g. 2502).
const truncateNodes = (
  nodes: unknown[],
  budget: number,
  topLevel = false
): { nodes: unknown[]; used: number } => {
  const out: unknown[] = [];
  let used = 0;

  for (let i = 0; i < nodes.length; i++) {
    if (used >= budget) break;
    const node = nodes[i];

    // Overhead this node adds beyond its text: a block-break separator (top
    // level only, between two non-structural blocks) plus its indent levels.
    let overhead = 0;
    if (node && typeof node === 'object') {
      const n = node as SlateNode & { indent?: unknown };
      if (
        topLevel &&
        out.length > 0 &&
        !isStructuralBlock(node) &&
        !isStructuralBlock(nodes[i - 1])
      ) {
        overhead += 1;
      }
      if (typeof n.indent === 'number' && n.indent > 0) overhead += n.indent;
    }
    if (used + overhead >= budget) break;
    used += overhead;

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

// Ported from core-web (@oneplatformdev/ui) Tooltip so the hint icon matches
// the rest of the product: filled question-mark glyph, grey by default,
// purple on hover.
function QuestionMarkIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M7.99967 5.66667C7.73446 5.66667 7.4801 5.77202 7.29257 5.95956C7.10503 6.1471 6.99967 6.40145 6.99967 6.66667V6.738C6.99967 6.82641 6.96456 6.91119 6.90204 6.9737C6.83953 7.03621 6.75475 7.07133 6.66634 7.07133C6.57794 7.07133 6.49315 7.03621 6.43064 6.9737C6.36813 6.91119 6.33301 6.82641 6.33301 6.738V6.66667C6.33301 6.22464 6.5086 5.80072 6.82116 5.48816C7.13372 5.17559 7.55765 5 7.99967 5H8.07701C8.40161 5.0001 8.7184 5.09959 8.98478 5.28509C9.25116 5.4706 9.45435 5.73322 9.56703 6.03764C9.6797 6.34206 9.69647 6.67368 9.61506 6.98791C9.53366 7.30214 9.35799 7.58391 9.11167 7.79533L8.59767 8.236C8.51479 8.30723 8.44824 8.3955 8.40256 8.49479C8.35689 8.59407 8.33316 8.70204 8.33301 8.81133V9.16667C8.33301 9.25507 8.29789 9.33986 8.23538 9.40237C8.17286 9.46488 8.08808 9.5 7.99967 9.5C7.91127 9.5 7.82648 9.46488 7.76397 9.40237C7.70146 9.33986 7.66634 9.25507 7.66634 9.16667V8.81133C7.66634 8.39533 7.84834 8.00067 8.16367 7.73L8.67701 7.29C8.82016 7.16735 8.92231 7.00379 8.96971 6.82133C9.01711 6.63888 9.00749 6.44628 8.94213 6.26946C8.87678 6.09264 8.75883 5.94008 8.60416 5.83231C8.44949 5.72454 8.26552 5.66673 8.07701 5.66667H7.99967ZM7.99967 11C8.13228 11 8.25946 10.9473 8.35323 10.8536C8.447 10.7598 8.49967 10.6326 8.49967 10.5C8.49967 10.3674 8.447 10.2402 8.35323 10.1464C8.25946 10.0527 8.13228 10 7.99967 10C7.86707 10 7.73989 10.0527 7.64612 10.1464C7.55235 10.2402 7.49967 10.3674 7.49967 10.5C7.49967 10.6326 7.55235 10.7598 7.64612 10.8536C7.73989 10.9473 7.86707 11 7.99967 11Z"
        fill="currentColor"
      />
      <path
        d="M2.33301 7.9987C2.33301 6.4958 2.93003 5.05447 3.99274 3.99176C5.05544 2.92905 6.49678 2.33203 7.99967 2.33203C9.50257 2.33203 10.9439 2.92905 12.0066 3.99176C13.0693 5.05447 13.6663 6.4958 13.6663 7.9987C13.6663 9.50159 13.0693 10.9429 12.0066 12.0056C10.9439 13.0683 9.50257 13.6654 7.99967 13.6654C6.49678 13.6654 5.05544 13.0683 3.99274 12.0056C2.93003 10.9429 2.33301 9.50159 2.33301 7.9987ZM7.99967 2.9987C6.67359 2.9987 5.40182 3.52548 4.46414 4.46316C3.52646 5.40085 2.99967 6.67262 2.99967 7.9987C2.99967 9.32478 3.52646 10.5965 4.46414 11.5342C5.40182 12.4719 6.67359 12.9987 7.99967 12.9987C9.32576 12.9987 10.5975 12.4719 11.5352 11.5342C12.4729 10.5965 12.9997 9.32478 12.9997 7.9987C12.9997 6.67262 12.4729 5.40085 11.5352 4.46316C10.5975 3.52548 9.32576 2.9987 7.99967 2.9987Z"
        fill="currentColor"
      />
    </svg>
  );
}

// Live counting state passed to a consumer-supplied renderer. Lets the host
// app provide its own counter + tooltip markup/positioning while the plugin
// keeps owning the counting and limit-enforcement logic.
export type CharCounterRenderProps = {
  count: number;
  maxLength?: number;
  over: boolean;
};

export type CharCounterRender = (
  props: CharCounterRenderProps
) => React.ReactNode;

export type CharCounterOverlayProps = {
  /** Hard character limit. When omitted, the overlay renders nothing. */
  maxLength?: number;
  /** Custom renderer; receives the live `{ count, maxLength, over }`. */
  renderCounter?: CharCounterRender;
};

// Counter UI is rendered explicitly by the host *inside* `<Plate>` (not via the
// plugin's global `afterEditable` render). Plate registers a plugin render
// globally by key, so with more than one editor on a page that render resolves
// to a non-deterministic editor context — which silently dropped the limit.
// Taking `maxLength` as a direct prop here makes it deterministic and per-editor.
export function CharCounterOverlay({
  maxLength,
  renderCounter: render,
}: CharCounterOverlayProps) {
  const { t } = usePlateI18n();
  const count = useEditorSelector((editor) => countChars(editor.children), []);

  if (typeof maxLength !== 'number') return null;

  const over = count > maxLength;

  // Consumer owns everything (markup, position, tooltip) — we just feed it the
  // live numbers.
  if (render) return <>{render({ count, maxLength, over })}</>;

  return (
    <div className="op-plate-scope pointer-events-none sticky bottom-0 left-0 z-10 -mt-12 flex justify-start px-3 pb-3">
      <div className="pointer-events-auto flex items-center gap-1.5 rounded-lg border border-[#EEF0F2] bg-white px-2.5 py-1 shadow-[1px_1px_10px_0px_rgba(6,8,13,0.1)]">
        {/* Style mirrors core-web's Input/Textarea counter. */}
        <span
          className={cn(
            'inline-flex items-center justify-end text-sm font-semibold leading-[1.2] tabular-nums',
            over ? 'text-red-500' : 'text-primary'
          )}
        >
          {typeof maxLength === 'number' ? `${count}/${maxLength}` : count}
        </span>
        <Tooltip>
          <TooltipTrigger
            type="button"
            aria-label={t('charCounterHint')}
            className="flex items-center outline-none"
          >
            <QuestionMarkIcon className="size-4 shrink-0 cursor-help text-[#8C8F9A] transition-colors hover:text-[#9368FF]" />
          </TooltipTrigger>
          {/* Direct radix content (no arrow) styled like core-web's tooltip. */}
          <TooltipPrimitive.Portal>
            <TooltipPrimitive.Content
              side="top"
              align="start"
              sideOffset={8}
              className="op-plate-scope z-50 max-w-70 rounded-xl bg-white p-3 text-sm font-normal leading-tight text-primary shadow-[1px_1px_10px_0px_rgba(6,8,13,0.1)] whitespace-pre-wrap break-words"
            >
              {t('charCounterHint')}
            </TooltipPrimitive.Content>
          </TooltipPrimitive.Portal>
        </Tooltip>
      </div>
    </div>
  );
}

// --- Plugin ----------------------------------------------------------------

type CharCounterOptions = {
  maxLength?: number;
  renderCounter?: CharCounterRender;
};

// The plugin owns ONLY limit enforcement (input transforms). Its `maxLength`
// option is read per-editor via `getOption` inside the transforms, which is
// reliable for the editor the plugin is attached to. The counter *UI* is NOT a
// plugin render (see CharCounterOverlay) to avoid Plate's global-by-key render
// resolving to the wrong editor when several editors are mounted.
export const CharCounterPlugin = createPlatePlugin({
  key: 'charCounter',
  options: { maxLength: undefined, renderCounter: undefined } as CharCounterOptions,
}).overrideEditor(
  ({ editor, getOption, tf: { insertText, insertBreak, insertFragment } }) => {
    const getMax = () => getOption('maxLength');
    // An expanded selection is replaced by the insert, so its counted length is
    // freed up. Without this, "select all + paste" is blocked when the editor is
    // already at the limit, even though the paste would replace everything.
    const selectionCount = (): number => {
      const sel = editor.selection;
      if (!sel || !RangeApi.isExpanded(sel)) return 0;
      try {
        const fragment = (
          editor as { getFragment?: () => unknown[] }
        ).getFragment?.();
        return Array.isArray(fragment) ? countChars(fragment) : 0;
      } catch {
        return 0;
      }
    };
    return {
      transforms: {
        insertText(text: string, options?: unknown) {
          const maxLength = getMax();
          if (typeof maxLength !== 'number') {
            return (insertText as (t: string, o?: unknown) => void)(text, options);
          }
          const remaining =
            maxLength - countChars(editor.children) + selectionCount();
          if (remaining <= 0) return;
          const next = text.length > remaining ? text.slice(0, remaining) : text;
          (insertText as (t: string, o?: unknown) => void)(next, options);
        },
        insertBreak() {
          // A block break adds one counted character (the line break).
          const maxLength = getMax();
          if (
            typeof maxLength === 'number' &&
            countChars(editor.children) - selectionCount() >= maxLength
          ) {
            return;
          }
          (insertBreak as () => void)();
        },
        insertFragment(fragment: unknown[], options?: unknown) {
          const maxLength = getMax();
          if (typeof maxLength !== 'number') {
            return (insertFragment as (f: unknown[], o?: unknown) => void)(
              fragment,
              options
            );
          }
          const remaining =
            maxLength - countChars(editor.children) + selectionCount();
          if (remaining <= 0) return;

          // Exact counted cost of the whole fragment (text + block breaks +
          // indent). If it fits, insert as-is; otherwise trim with the same
          // accounting so the result lands at the limit, never above it.
          if (countChars(fragment) <= remaining) {
            return (insertFragment as (f: unknown[], o?: unknown) => void)(
              fragment,
              options
            );
          }

          const { nodes } = truncateNodes(fragment, remaining, true);
          (insertFragment as (f: unknown[], o?: unknown) => void)(nodes, options);
        },
      },
    };
  }
);

export const createCharCounterKit = (
  maxLength?: number,
  renderCounter?: CharCounterRender
) => [CharCounterPlugin.configure({ options: { maxLength, renderCounter } })];

export const CharCounterKit = createCharCounterKit();
