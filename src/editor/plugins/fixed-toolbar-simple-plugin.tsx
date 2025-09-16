'use client';

import { createPlatePlugin } from '@udecode/plate-common/react';

import { FixedToolbarButtonsSimple } from '../../plate-ui/fixed-toolbar-buttons-simple';
import { FixedToolbarSimple } from '../../plate-ui/fixed-toolbar-simple';

export const FixedToolbarSimplePlugin = createPlatePlugin({
    key: 'fixed-toolbar',
    render: {
      beforeEditable: () => (
        <FixedToolbarSimple>
          <FixedToolbarButtonsSimple />
        </FixedToolbarSimple>
      ),
    },
  });