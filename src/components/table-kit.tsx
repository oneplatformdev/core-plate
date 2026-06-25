'use client';

import {
  TableCellHeaderPlugin,
  TableCellPlugin,
  TablePlugin,
  TableRowPlugin,
} from '@platejs/table/react';
import { KEYS } from 'platejs';
import type { Descendant } from 'platejs';

import {
  TableCellElement,
  TableCellHeaderElement,
  TableElement,
  TableRowElement,
} from '@/components/ui/table-node';

const isElementNode = (node: unknown): node is { type?: string; children: unknown[] } =>
  typeof node === 'object' && node !== null && Array.isArray((node as { children?: unknown }).children);

// Any node tree we insert can come from a paste handler, drag-drop, or undo
// history — not just our own google-docs-paste-kit. If a <table> or <tr> ever
// ends up with a non-element child (e.g. a stray whitespace text node hoisted
// out of <tbody> by some HTML deserializer), `computeCellIndices` in
// @platejs/table crashes with "row.children is not iterable" because it
// assumes every table child is a row and every row child is a cell. Strip
// anything that doesn't fit that shape before it ever reaches the document,
// so a malformed paste degrades (loses the offending row/cell) instead of
// crashing the whole editor.
const sanitizeTableNodes = (nodes: unknown[]): unknown[] => {
  const cellTypes: string[] = [KEYS.td, KEYS.th];

  // `requiredTypes` is only set when filtering the direct children of a
  // <table> or <tr>, where every child MUST be an element of a specific
  // type. Everywhere else (paragraphs, cells, list items, ...) children are
  // a normal mix of elements and Text leaves and must pass through as-is —
  // only recursing into the elements among them to catch nested tables.
  const sanitizeChildren = (list: unknown[], requiredTypes?: string[]): unknown[] =>
    list.reduce<unknown[]>((acc, node) => {
      if (requiredTypes) {
        if (!isElementNode(node) || !requiredTypes.includes(node.type as string)) return acc;
        acc.push(sanitizeNode(node));
        return acc;
      }

      acc.push(isElementNode(node) ? sanitizeNode(node) : node);
      return acc;
    }, []);

  const sanitizeNode = (node: { type?: string; children: unknown[] }) => {
    if (node.type === KEYS.table) {
      return { ...node, children: sanitizeChildren(node.children, [KEYS.tr]) };
    }
    if (node.type === KEYS.tr) {
      return { ...node, children: sanitizeChildren(node.children, cellTypes) };
    }
    return { ...node, children: sanitizeChildren(node.children) };
  };

  return sanitizeChildren(nodes);
};

export const TableKit = [
  TablePlugin.withComponent(TableElement),
  TableRowPlugin.withComponent(TableRowElement),
  TableCellPlugin.withComponent(TableCellElement),
  TableCellHeaderPlugin.withComponent(TableCellHeaderElement),
].map((plugin) =>
  plugin.key === KEYS.table
    ? plugin.overrideEditor(({ tf: { insertFragment } }) => ({
        transforms: {
          insertFragment(fragment: Descendant[], options?: unknown) {
            (insertFragment as (f: Descendant[], o?: unknown) => void)(
              sanitizeTableNodes(fragment) as Descendant[],
              options,
            );
          },
        },
      }))
    : plugin,
);
