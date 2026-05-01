'use client';

import * as React from 'react';

import { ListStyleType, someList, toggleList } from '@platejs/list';
import {
  useIndentTodoToolBarButton,
  useIndentTodoToolBarButtonState,
} from '@platejs/list/react';
import { List, ListOrdered, ListTodoIcon } from 'lucide-react';
import { useEditorRef, useEditorSelector } from 'platejs/react';
import { usePlateI18n } from '@/i18n/provider';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import {
  ToolbarButton,
  ToolbarSplitButton,
  ToolbarSplitButtonPrimary,
  ToolbarSplitButtonSecondary,
} from './toolbar';
import { useToolbarOverflowMenu } from './toolbar-overflow-context';

export function BulletedListToolbarButton() {
  const { t } = usePlateI18n();
  const editor = useEditorRef();
  const [open, setOpen] = React.useState(false);
  const inOverflowMenu = useToolbarOverflowMenu();

  const pressed = useEditorSelector(
    (editor) =>
      someList(editor, [
        ListStyleType.Disc,
        ListStyleType.Circle,
        ListStyleType.Square,
      ]),
    []
  );

  return (
    <ToolbarSplitButton pressed={open}>
      <ToolbarSplitButtonPrimary
        className="data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
        onClick={() => {
          toggleList(editor, {
            listStyleType: ListStyleType.Disc,
          });
        }}
        data-state={pressed ? 'on' : 'off'}
      >
        <List className="size-4" />
      </ToolbarSplitButtonPrimary>

      <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
        <DropdownMenuTrigger asChild>
          <ToolbarSplitButtonSecondary />
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align={inOverflowMenu ? 'end' : 'start'}
          alignOffset={inOverflowMenu ? 0 : -32}
          side={inOverflowMenu ? 'left' : 'bottom'}
        >
          <DropdownMenuGroup>
            <DropdownMenuItem
              onClick={() =>
                toggleList(editor, {
                  listStyleType: ListStyleType.Disc,
                })
              }
            >
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full border border-current bg-current" />
                {t('defaultListStyle')}
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                toggleList(editor, {
                  listStyleType: ListStyleType.Circle,
                })
              }
            >
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full border border-current" />
                {t('circle')}
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                toggleList(editor, {
                  listStyleType: ListStyleType.Square,
                })
              }
            >
              <div className="flex items-center gap-2">
                <div className="size-2 border border-current bg-current" />
                {t('square')}
              </div>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </ToolbarSplitButton>
  );
}

export function NumberedListToolbarButton() {
  const { t } = usePlateI18n();
  const editor = useEditorRef();
  const [open, setOpen] = React.useState(false);
  const inOverflowMenu = useToolbarOverflowMenu();

  const pressed = useEditorSelector(
    (editor) =>
      someList(editor, [
        ListStyleType.Decimal,
        ListStyleType.LowerAlpha,
        ListStyleType.UpperAlpha,
        ListStyleType.LowerRoman,
        ListStyleType.UpperRoman,
      ]),
    []
  );

  return (
    <ToolbarSplitButton pressed={open}>
      <ToolbarSplitButtonPrimary
        className="data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
        onClick={() =>
          toggleList(editor, {
            listStyleType: ListStyleType.Decimal,
          })
        }
        data-state={pressed ? 'on' : 'off'}
      >
        <ListOrdered className="size-4" />
      </ToolbarSplitButtonPrimary>

      <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
        <DropdownMenuTrigger asChild>
          <ToolbarSplitButtonSecondary />
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align={inOverflowMenu ? 'end' : 'start'}
          alignOffset={inOverflowMenu ? 0 : -32}
          side={inOverflowMenu ? 'left' : 'bottom'}
        >
          <DropdownMenuGroup>
            <DropdownMenuItem
              onSelect={() =>
                toggleList(editor, {
                  listStyleType: ListStyleType.Decimal,
                })
              }
            >
              {t('decimalList')}
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() =>
                toggleList(editor, {
                  listStyleType: ListStyleType.LowerAlpha,
                })
              }
            >
              {t('lowerAlphaList')}
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() =>
                toggleList(editor, {
                  listStyleType: ListStyleType.UpperAlpha,
                })
              }
            >
              {t('upperAlphaList')}
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() =>
                toggleList(editor, {
                  listStyleType: ListStyleType.LowerRoman,
                })
              }
            >
              {t('lowerRomanList')}
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() =>
                toggleList(editor, {
                  listStyleType: ListStyleType.UpperRoman,
                })
              }
            >
              {t('upperRomanList')}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </ToolbarSplitButton>
  );
}

export function TodoListToolbarButton(
  props: React.ComponentProps<typeof ToolbarButton>
) {
  const { t } = usePlateI18n();
  const state = useIndentTodoToolBarButtonState({ nodeType: 'todo' });
  const { props: buttonProps } = useIndentTodoToolBarButton(state);

  return (
    <ToolbarButton {...props} {...buttonProps} tooltip={t('todoList')}>
      <ListTodoIcon />
    </ToolbarButton>
  );
}
