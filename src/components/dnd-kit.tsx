'use client';

import { DndPlugin } from '@platejs/dnd';

import { enqueueMediaFiles } from '@/components/google-docs-paste-kit';

export const DndKit = [
  DndPlugin.configure({
    options: {
      enableScroller: true,
      onDropFiles: ({ dragItem, editor }) => {
        // eslint-disable-next-line no-console
        console.debug('[mediaQueue] dnd onDropFiles, files=', dragItem.files?.length); // TEMP DEBUG
        // Drop several files → sequential upload queue (one at a time) with the
        // shared progress overlay, instead of firing every upload at once.
        void enqueueMediaFiles(editor, dragItem.files);
      },
    },
  }),
];
