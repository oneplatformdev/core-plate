'use client';

import { DndPlugin } from '@platejs/dnd';
import { PlaceholderPlugin } from '@platejs/media/react';

export const DndKit = [
  DndPlugin.configure({
    options: {
      enableScroller: true,
      onDropFiles: ({ dragItem, editor }) => {
        editor.getTransforms(PlaceholderPlugin).insert.media(dragItem.files);
      },
    },
  }),
];
