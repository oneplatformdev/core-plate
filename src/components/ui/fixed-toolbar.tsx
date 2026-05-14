'use client';

import { cn } from '@/lib/utils';

import { Toolbar } from './toolbar';

export function FixedToolbar(props: React.ComponentProps<typeof Toolbar>) {
  return (
    <Toolbar
      {...props}
      className={cn(
        'sticky top-0 z-50 box-border flex w-full min-w-0 max-w-full items-center justify-start gap-2 overflow-visible rounded-lg border-0 bg-[#FCFCFC] p-2 px-2 shadow-[1px_1px_10px_rgba(6,8,13,0.06)]',
        props.className
      )}
    />
  );
}
