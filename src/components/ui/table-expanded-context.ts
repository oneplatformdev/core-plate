import * as React from 'react';

/**
 * True while a table is being edited inside the fullscreen modal
 * (see TableFullscreenEditor). Lives in its own leaf module so toolbar/node
 * components can read it without import cycles through the editor kit.
 */
export const TableExpandedContext = React.createContext(false);
