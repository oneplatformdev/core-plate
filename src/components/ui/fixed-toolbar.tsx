'use client';

import { cn } from '@/lib/utils';

import { Toolbar } from './toolbar';

export function FixedToolbar(props: React.ComponentProps<typeof Toolbar>) {
  return (
    <Toolbar
      {...props}
      className={cn(
        'sticky top-0 left-0 p-2 scrollbar-hide z-50 flex w-fit max-w-[calc(100%-1rem)] items-center justify-start gap-2 overflow-x-auto overflow-y-hidden rounded-lg border-0 bg-[#FCFCFC] px-2 shadow-[1px_1px_10px_rgba(6,8,13,0.06)]',
        props.className
      )}
    />
  );
}
