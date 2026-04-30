'use client';

import { KEYS } from 'platejs';
import { BlockPlaceholderPlugin } from 'platejs/react';

export const DEFAULT_BLOCK_PLACEHOLDER = 'Type something test...';

export const createBlockPlaceholderKit = (
  placeholder = DEFAULT_BLOCK_PLACEHOLDER
) => [
  BlockPlaceholderPlugin.configure({
    options: {
      className:
        'before:absolute before:cursor-text before:text-muted-foreground/80 before:content-[attr(placeholder)]',
      placeholders: {
        [KEYS.p]: placeholder,
      },
      query: ({ path }) => path.length === 1,
    },
  }),
];

export const BlockPlaceholderKit = createBlockPlaceholderKit();
