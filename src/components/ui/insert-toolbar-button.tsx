'use client';

import * as React from 'react';

import type { DropdownMenuProps } from '@radix-ui/react-dropdown-menu';

import {
  CalendarIcon,
  ChevronRightIcon,
  Code2,
  Columns3Icon,
  FileCodeIcon,
  FilmIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  ImageIcon,
  Link2Icon,
  ListIcon,
  ListOrderedIcon,
  MinusIcon,
  PenToolIcon,
  PilcrowIcon,
  PlusIcon,
  QuoteIcon,
  RadicalIcon,
  SquareIcon,
  SuperscriptIcon,
  TableIcon,
  TableOfContentsIcon,
} from 'lucide-react';
import { KEYS } from 'platejs';
import { type PlateEditor, useEditorRef } from 'platejs/react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePlateI18n } from '@/i18n/provider';
import { insertBlock, insertInlineElement } from '@/components/transforms';

import { ToolbarButton, ToolbarMenuGroup } from './toolbar';

type Group = {
  group: string;
  items: Item[];
};

type Item = {
  icon: React.ReactNode;
  value: string;
  onSelect: (editor: PlateEditor, value: string) => void;
  focusEditor?: boolean;
  label?: string;
};

function getGroups(t: (key: any) => string): Group[] {
  return [
    {
      group: t('basicBlocks'),
      items: [
        { icon: <PilcrowIcon />, label: t('paragraph'), value: KEYS.p },
        { icon: <Heading1Icon />, label: t('heading1'), value: 'h1' },
        { icon: <Heading2Icon />, label: t('heading2'), value: 'h2' },
        { icon: <Heading3Icon />, label: t('heading3'), value: 'h3' },
        { icon: <TableIcon />, label: t('table'), value: KEYS.table },
        { icon: <FileCodeIcon />, label: t('code'), value: KEYS.codeBlock },
        { icon: <QuoteIcon />, label: t('quote'), value: KEYS.blockquote },
        { icon: <MinusIcon />, label: t('divider'), value: KEYS.hr },
      ].map((item) => ({ ...item, onSelect: (editor, value) => insertBlock(editor, value) })),
    },
    {
      group: t('lists'),
      items: [
        { icon: <ListIcon />, label: t('bulletedList'), value: KEYS.ul },
        { icon: <ListOrderedIcon />, label: t('numberedList'), value: KEYS.ol },
        { icon: <SquareIcon />, label: t('todoList'), value: KEYS.listTodo },
        { icon: <ChevronRightIcon />, label: t('toggleList'), value: KEYS.toggle },
      ].map((item) => ({ ...item, onSelect: (editor, value) => insertBlock(editor, value) })),
    },
    {
      group: t('media'),
      items: [
        { icon: <ImageIcon />, label: t('image'), value: KEYS.img },
        { icon: <FilmIcon />, label: t('embed'), value: KEYS.mediaEmbed },
      ].map((item) => ({ ...item, onSelect: (editor, value) => insertBlock(editor, value) })),
    },
    {
      group: t('advancedBlocks'),
      items: [
        { icon: <TableOfContentsIcon />, label: t('tableOfContents'), value: KEYS.toc },
        { icon: <Columns3Icon />, label: t('threeColumns'), value: 'action_three_columns' },
        { focusEditor: false, icon: <RadicalIcon />, label: t('equation'), value: KEYS.equation },
        { icon: <PenToolIcon />, label: t('excalidraw'), value: KEYS.excalidraw },
        { icon: <Code2 />, label: t('codeDrawing'), value: KEYS.codeDrawing },
      ].map((item) => ({ ...item, onSelect: (editor, value) => insertBlock(editor, value) })),
    },
    {
      group: t('inline'),
      items: [
        { icon: <Link2Icon />, label: t('link'), value: KEYS.link },
        { focusEditor: true, icon: <CalendarIcon />, label: t('date'), value: KEYS.date },
        { focusEditor: true, icon: <SuperscriptIcon />, label: t('footnote'), value: 'action_footnote' },
        { focusEditor: false, icon: <RadicalIcon />, label: t('inlineEquation'), value: KEYS.inlineEquation },
      ].map((item) => ({ ...item, onSelect: (editor, value) => insertInlineElement(editor, value) })),
    },
  ];
}

export function InsertToolbarButton(props: DropdownMenuProps) {
  const { t } = usePlateI18n();
  const editor = useEditorRef();
  const [open, setOpen] = React.useState(false);
  const groups = React.useMemo(() => getGroups(t), [t]);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false} {...props}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton pressed={open} tooltip={t('insert')} isDropdown>
          <PlusIcon />
        </ToolbarButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="flex max-h-[500px] min-w-[240px] flex-col overflow-y-auto"
        align="start"
        style={{ minWidth: 260, width: 260 }}
      >
        {groups.map(({ group, items }) => (
          <ToolbarMenuGroup key={group} label={group}>
            {items.map(({ icon, label, value, onSelect, focusEditor }) => (
              <DropdownMenuItem
                key={value}
                className="min-w-[220px] gap-2 whitespace-nowrap"
                onSelect={() => {
                  onSelect(editor, value);
                  if (focusEditor !== false) editor.tf.focus();
                }}
              >
                {icon}
                {label}
              </DropdownMenuItem>
            ))}
          </ToolbarMenuGroup>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
