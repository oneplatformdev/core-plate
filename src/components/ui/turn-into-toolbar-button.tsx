'use client';

import * as React from 'react';

import type { DropdownMenuProps } from '@radix-ui/react-dropdown-menu';
import type { TElement } from 'platejs';

import { DropdownMenuItemIndicator } from '@radix-ui/react-dropdown-menu';
import {
  CheckIcon,
  ChevronRightIcon,
  Columns3Icon,
  FileCodeIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  Heading4Icon,
  ListIcon,
  ListOrderedIcon,
  QuoteIcon,
  SquareIcon,
} from 'lucide-react';
import { KEYS } from 'platejs';
import { useEditorRef, useSelectionFragmentProp } from 'platejs/react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePlateI18n } from '@/i18n/provider';
import { getBlockType, setBlockType } from '@/components/transforms';

import { ToolbarButton, ToolbarMenuGroup } from './toolbar';
import { useToolbarOverflowMenu } from './toolbar-overflow-context';

function getTurnIntoItems(t: (key: any) => string) {
  return [
    { icon: null, label: t('text'), value: KEYS.p },
    { icon: <Heading1Icon />, label: t('heading1'), value: 'h1' },
    { icon: <Heading2Icon />, label: t('heading2'), value: 'h2' },
    { icon: <Heading3Icon />, label: t('heading3'), value: 'h3' },
    { icon: <Heading4Icon />, label: t('heading4'), value: 'h4' },
    { icon: <ListIcon />, label: t('bulletedList'), value: KEYS.ul },
    { icon: <ListOrderedIcon />, label: t('numberedList'), value: KEYS.ol },
    { icon: <SquareIcon />, label: t('todoList'), value: KEYS.listTodo },
    { icon: <ChevronRightIcon />, label: t('toggleList'), value: KEYS.toggle },
    { icon: <FileCodeIcon />, label: t('code'), value: KEYS.codeBlock },
    { icon: <QuoteIcon />, label: t('quote'), value: KEYS.blockquote },
    { icon: <Columns3Icon />, label: t('threeColumns'), value: 'action_three_columns' },
  ];
}

export function TurnIntoToolbarButton(props: DropdownMenuProps) {
  const { t } = usePlateI18n();
  const editor = useEditorRef();
  const [open, setOpen] = React.useState(false);
  const value = useSelectionFragmentProp({
    defaultValue: KEYS.p,
    getProp: (node) => getBlockType(node as TElement),
  });
  const items = React.useMemo(() => getTurnIntoItems(t), [t]);
  const inOverflowMenu = useToolbarOverflowMenu();
  const selectedItem = React.useMemo(
    () => items.find((item) => item.value === (value ?? KEYS.p)) ?? items[0],
    [items, value]
  );

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false} {...props}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton className="min-w-[125px]" pressed={open} tooltip={t('turnInto')} isDropdown>
          {selectedItem.label}
        </ToolbarButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="ignore-click-outside/toolbar w-[340px] max-w-[92vw] max-h-[55vh] overflow-y-auto"
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          editor.tf.focus();
        }}
        align={inOverflowMenu ? 'end' : 'start'}
        side={inOverflowMenu ? 'left' : 'bottom'}
      >
        <ToolbarMenuGroup
          value={value}
          onValueChange={(type) => setBlockType(editor, type)}
          label={t('turnInto')}
        >
          {items.map(({ icon, label, value: itemValue }) => (
            <DropdownMenuRadioItem
              key={itemValue}
              className="min-w-[300px] pl-2 *:first:[span]:hidden"
              value={itemValue}
            >
              <span className="pointer-events-none absolute right-2 flex size-3.5 items-center justify-center">
                <DropdownMenuItemIndicator>
                  <CheckIcon />
                </DropdownMenuItemIndicator>
              </span>
              {icon && icon}
              {label}
            </DropdownMenuRadioItem>
          ))}
        </ToolbarMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
