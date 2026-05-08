import * as React from 'react';

import type { SlateElementProps } from 'platejs/static';

import { SlateElement } from 'platejs/static';

import { cn } from '@/lib/utils';

export function HrElementStatic(props: SlateElementProps) {
  return (
    <SlateElement {...props}>
      <div className="max-w-full cursor-text overflow-hidden py-6" contentEditable={false}>
        <hr
          className={cn(
            'm-0 h-px w-full max-w-full rounded-none border-none bg-border'
          )}
        />
      </div>
      {props.children}
    </SlateElement>
  );
}
