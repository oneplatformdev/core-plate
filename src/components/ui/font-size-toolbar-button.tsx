'use client';

import * as React from 'react';

import type { TElement } from 'platejs';

import { toUnitLess } from '@platejs/basic-styles';
import { FontSizePlugin } from '@platejs/basic-styles/react';
import { Minus, Plus } from 'lucide-react';
import { KEYS } from 'platejs';
import { useEditorPlugin, useEditorSelector } from 'platejs/react';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

import { ToolbarButton } from './toolbar';
import { useToolbarOverflowMenu } from './toolbar-overflow-context';

const DEFAULT_FONT_SIZE = '16';
const MIN_FONT_SIZE = 1;
const MAX_FONT_SIZE = 48;

const FONT_SIZE_MAP = {
  h1: '48',
  h2: '36',
  h3: '24',
  h4: '16',
} as const;

const FONT_SIZES = [
  '8',
  '9',
  '10',
  '12',
  '14',
  '16',
  '18',
  '24',
  '30',
  '36',
  '48',
] as const;

export function FontSizeToolbarButton() {
  const [inputValue, setInputValue] = React.useState(DEFAULT_FONT_SIZE);
  const [isFocused, setIsFocused] = React.useState(false);
  const isSelectingRef = React.useRef(false);
  const inOverflowMenu = useToolbarOverflowMenu();
  const { editor, tf } = useEditorPlugin(FontSizePlugin);

  const cursorFontSize = useEditorSelector((editor) => {
    const fontSize = editor.api.marks()?.[KEYS.fontSize];

    if (fontSize) {
      return toUnitLess(fontSize as string);
    }

    const [block] = editor.api.block<TElement>() || [];

    if (!block?.type) return DEFAULT_FONT_SIZE;

    return block.type in FONT_SIZE_MAP
      ? FONT_SIZE_MAP[block.type as keyof typeof FONT_SIZE_MAP]
      : DEFAULT_FONT_SIZE;
  }, []);

  const handleInputChange = () => {
    const newSize = toUnitLess(inputValue);

    const nextSize = Number.parseInt(newSize, 10);

    if (nextSize < MIN_FONT_SIZE || nextSize > MAX_FONT_SIZE) {
      editor.tf.focus();

      return;
    }
    if (newSize !== toUnitLess(cursorFontSize)) {
      tf.fontSize.addMark(`${newSize}px`);
    }

    editor.tf.focus();
  };

  const handleFontSizeChange = (delta: number) => {
    const newSize = Math.min(
      MAX_FONT_SIZE,
      Math.max(MIN_FONT_SIZE, Number(displayValue) + delta)
    );
    tf.fontSize.addMark(`${newSize}px`);
    editor.tf.focus();
  };

  const displayValue = isFocused ? inputValue : cursorFontSize;

  return (
    <div className="flex h-7 items-center gap-1 rounded-md bg-muted/60 p-0">
      <ToolbarButton onClick={() => handleFontSizeChange(-1)}>
        <Minus />
      </ToolbarButton>

      <Popover open={isFocused} modal={false}>
        <PopoverTrigger asChild>
          <input
            className={cn(
              'h-full w-10 shrink-0 bg-transparent px-1 text-center text-sm hover:bg-muted'
            )}
            value={displayValue}
            onBlur={() => {
              setIsFocused(false);

              if (isSelectingRef.current) {
                isSelectingRef.current = false;

                return;
              }

              handleInputChange();
            }}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={() => {
              setIsFocused(true);
              setInputValue(toUnitLess(cursorFontSize));
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleInputChange();
              }
            }}
            data-plate-focus="true"
            type="text"
          />
        </PopoverTrigger>
        <PopoverContent
          className="max-h-[50vh] w-10 overflow-y-auto px-px py-1"
          onOpenAutoFocus={(e) => e.preventDefault()}
          align={inOverflowMenu ? 'end' : 'center'}
          side={inOverflowMenu ? 'left' : 'bottom'}
        >
          {FONT_SIZES.map((size) => (
            <button
              key={size}
              className={cn(
                'flex h-8 w-full cursor-pointer items-center justify-center text-sm hover:bg-accent data-[highlighted=true]:bg-accent'
              )}
              onMouseDown={(e) => {
                e.preventDefault();
                isSelectingRef.current = true;
              }}
              onClick={() => {
                tf.fontSize.addMark(`${size}px`);
                setIsFocused(false);
                editor.tf.focus();
              }}
              data-highlighted={size === displayValue}
              type="button"
            >
              {size}
            </button>
          ))}
        </PopoverContent>
      </Popover>

      <ToolbarButton onClick={() => handleFontSizeChange(1)}>
        <Plus />
      </ToolbarButton>
    </div>
  );
}
