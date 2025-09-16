'use client';

import { FloatingToolbar } from '@op/modules/plate/plate-ui/floating-toolbar';
import { FloatingToolbarButtons } from '@op/modules/plate/plate-ui/floating-toolbar-buttons';
import { createPlatePlugin } from '@udecode/plate-common/react';

export const FloatingToolbarPlugin = createPlatePlugin({
  key: 'floating-toolbar',
  render: {
    afterEditable: () => (
      <FloatingToolbar>
        <FloatingToolbarButtons />
      </FloatingToolbar>
    ),
  },
});
