'use client';

import * as React from 'react';

import type { SlateElementProps } from 'platejs/static';

import { ChevronRight } from 'lucide-react';
import { SlateElement } from 'platejs/static';

import { useToggleStatic } from '@/components/toggle-static-context';

export function ToggleElementStatic(props: SlateElementProps) {
  const id = String(props.element.id ?? '');
  const { isOpen, toggle } = useToggleStatic();
  const open = isOpen(id);

  return (
    <SlateElement {...props} className="relative pl-7">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => toggle(id)}
        className="absolute top-0 left-0 flex size-6 cursor-pointer select-none items-center justify-center rounded-md p-px text-muted-foreground transition-colors hover:bg-accent [&_svg]:size-4"
        contentEditable={false}
      >
        <ChevronRight
          className={
            open
              ? 'rotate-90 transition-transform duration-75'
              : 'rotate-0 transition-transform duration-75'
          }
        />
      </button>
      <div className="min-h-6 pt-0.5">{props.children}</div>
    </SlateElement>
  );
}
