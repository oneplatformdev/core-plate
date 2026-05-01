'use client';

import * as React from 'react';

export const ToolbarOverflowContext = React.createContext(false);

export function useToolbarOverflowMenu() {
  return React.useContext(ToolbarOverflowContext);
}
