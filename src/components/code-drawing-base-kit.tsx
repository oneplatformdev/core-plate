import * as React from 'react';

import type { TCodeDrawingElement } from '@platejs/code-drawing';
import { BaseCodeDrawingPlugin } from '@platejs/code-drawing';
import type { PlateElementProps } from 'platejs/react';

const CodeDrawingElementLazy = React.lazy(() =>
  import('@/components/ui/code-drawing-node').then((m) => ({
    default: m.CodeDrawingElement,
  }))
);

function CodeDrawingElement(props: PlateElementProps<TCodeDrawingElement>) {
  return (
    <React.Suspense fallback={null}>
      <CodeDrawingElementLazy {...props} />
    </React.Suspense>
  );
}

export const BaseCodeDrawingKit = [
  BaseCodeDrawingPlugin.configure({
    node: { component: CodeDrawingElement },
  }),
];
