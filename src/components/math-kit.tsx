'use client';

import * as React from 'react';

import type { TEquationElement } from 'platejs';
import type { PlateElementProps } from 'platejs/react';

import { MathRules } from '@platejs/math';
import { EquationPlugin, InlineEquationPlugin } from '@platejs/math/react';

const EquationElementLazy = React.lazy(() =>
  import('@/components/ui/equation-node').then((m) => ({
    default: m.EquationElement,
  }))
);

const InlineEquationElementLazy = React.lazy(() =>
  import('@/components/ui/equation-node').then((m) => ({
    default: m.InlineEquationElement,
  }))
);

function EquationElement(props: PlateElementProps<TEquationElement>) {
  return (
    <React.Suspense fallback={null}>
      <EquationElementLazy {...props} />
    </React.Suspense>
  );
}

function InlineEquationElement(props: PlateElementProps<TEquationElement>) {
  return (
    <React.Suspense fallback={null}>
      <InlineEquationElementLazy {...props} />
    </React.Suspense>
  );
}

export const MathKit = [
  InlineEquationPlugin.configure({
    inputRules: [MathRules.markdown({ variant: '$' })],
    node: {
      component: InlineEquationElement,
    },
  }),
  EquationPlugin.configure({
    inputRules: [MathRules.markdown({ on: 'break', variant: '$$' })],
    node: {
      component: EquationElement,
    },
  }),
];
