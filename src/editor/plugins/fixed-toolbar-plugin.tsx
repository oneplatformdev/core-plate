'use client';

import { FixedToolbar } from '@op/modules/plate/plate-ui/fixed-toolbar';
import { FixedToolbarButtons } from '@op/modules/plate/plate-ui/fixed-toolbar-buttons';
import { createPlatePlugin } from '@udecode/plate-common/react';

export const FixedToolbarPlugin = createPlatePlugin({
  key: 'fixed-toolbar',
  render: {
    beforeEditable: () => (
      <FixedToolbar>
        <FixedToolbarButtons />
      </FixedToolbar>
    ),
  },
});
