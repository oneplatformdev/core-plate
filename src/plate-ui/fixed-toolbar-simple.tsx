'use client';

import { withCn } from '@udecode/cn';

import { Toolbar } from './toolbar';

export const FixedToolbarSimple = withCn(
  Toolbar,
  'supports-backdrop-blur:bg-background/60 sticky left-0 top-0 z-50 w-full justify-between overflow-x-auto rounded-t-lg bg-background/95 p-1 backdrop-blur scrollbar-hide '
);
