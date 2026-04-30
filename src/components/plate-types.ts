'use client';

import type {
  EmptyText,
  KEYS,
  PlainText,
  TBasicMarks,
  TCaptionProps,
  TComboboxInputElement,
  TCommentText,
  TElement,
  TFontMarks,
  TImageElement,
  TLineHeightProps,
  TLinkElement,
  TListProps,
  TMediaEmbedElement,
  TMentionElement,
  TResizableProps,
  TTableElement,
  TText,
  TTextAlignProps,
} from 'platejs';

export interface EditorBlockElement extends TElement, TListProps {
  id?: string;
}

export interface EditorTextBlockElement
  extends TElement,
    TLineHeightProps,
    TTextAlignProps {
  children: (
    | EditorLinkElement
    | EditorMentionElement
    | EditorMentionInputElement
    | EditorRichText
  )[];
}

export interface EditorBlockquoteElement extends EditorTextBlockElement {
  type: typeof KEYS.blockquote;
}

export interface EditorCodeBlockElement extends EditorBlockElement {
  children: EditorCodeLineElement[];
  type: typeof KEYS.codeBlock;
}

export interface EditorCodeLineElement extends TElement {
  children: PlainText[];
  type: typeof KEYS.codeLine;
}

export interface EditorH1Element extends EditorTextBlockElement {
  type: typeof KEYS.h1;
}

export interface EditorH2Element extends EditorTextBlockElement {
  type: typeof KEYS.h2;
}

/** Block props */

export interface EditorH3Element extends EditorTextBlockElement {
  type: typeof KEYS.h3;
}

export interface EditorH4Element extends EditorTextBlockElement {
  type: typeof KEYS.h4;
}

export interface EditorH5Element extends EditorTextBlockElement {
  type: typeof KEYS.h5;
}

export interface EditorH6Element extends EditorTextBlockElement {
  type: typeof KEYS.h6;
}

export interface EditorHrElement extends EditorBlockElement {
  children: [EmptyText];
  type: typeof KEYS.hr;
}

export interface EditorImageElement
  extends EditorBlockElement,
    TCaptionProps,
    TImageElement,
    TResizableProps {
  children: [EmptyText];
  type: typeof KEYS.img;
}

export interface EditorLinkElement extends TLinkElement {
  children: EditorRichText[];
  type: typeof KEYS.link;
}

export interface EditorMediaEmbedElement
  extends EditorBlockElement,
    TCaptionProps,
    TMediaEmbedElement,
    TResizableProps {
  children: [EmptyText];
  type: typeof KEYS.mediaEmbed;
}

export interface EditorMentionElement extends TMentionElement {
  children: [EmptyText];
  type: typeof KEYS.mention;
}

export interface EditorMentionInputElement extends TComboboxInputElement {
  children: [PlainText];
  type: typeof KEYS.mentionInput;
}

export type EditorNestableBlock = EditorParagraphElement;

export interface EditorParagraphElement extends EditorTextBlockElement {
  type: typeof KEYS.p;
}

export interface EditorTableCellElement extends TElement {
  children: EditorNestableBlock[];
  type: typeof KEYS.td;
}

export interface EditorTableElement extends EditorBlockElement, TTableElement {
  children: EditorTableRowElement[];
  type: typeof KEYS.table;
}

export interface EditorTableRowElement extends TElement {
  children: EditorTableCellElement[];
  type: typeof KEYS.tr;
}

export interface EditorToggleElement extends EditorTextBlockElement {
  type: typeof KEYS.toggle;
}

export interface EditorRichText
  extends TBasicMarks,
    TCommentText,
    TFontMarks,
    TText {
  kbd?: boolean;
}

export type EditorValue = (
  | EditorBlockquoteElement
  | EditorCodeBlockElement
  | EditorH1Element
  | EditorH2Element
  | EditorH3Element
  | EditorH4Element
  | EditorH5Element
  | EditorH6Element
  | EditorHrElement
  | EditorImageElement
  | EditorMediaEmbedElement
  | EditorParagraphElement
  | EditorTableElement
  | EditorToggleElement
)[];
