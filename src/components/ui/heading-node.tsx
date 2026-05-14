'use client';

import * as React from 'react';

import type { PlateElementProps } from 'platejs/react';

import { type VariantProps, cva } from 'class-variance-authority';
import { PlateElement } from 'platejs/react';

const headingVariants = cva(
  'relative mb-1 data-[nav-target=true]:rounded-md data-[nav-target=true]:bg-(--color-highlight)',
  {
    variants: {
      variant: {
        h1: 'mt-[0.68em] pb-1 font-bold font-heading text-5xl',
        h2: 'mt-[0.6em] pb-px font-heading font-semibold text-4xl tracking-tight',
        h3: 'mt-[0.47em] pb-px font-heading font-semibold text-2xl tracking-tight',
        h4: 'mt-[0.38em] font-heading font-semibold text-base tracking-tight',
        h5: 'mt-[0.38em] font-semibold text-lg tracking-tight',
        h6: 'mt-[0.38em] font-semibold text-base tracking-tight',
      },
    },
  }
);

export function HeadingElement({
  variant = 'h1',
  ...props
}: PlateElementProps & VariantProps<typeof headingVariants>) {
  return (
    <PlateElement
      as={variant!}
      className={headingVariants({ variant })}
      {...props}
    >
      {props.children}
    </PlateElement>
  );
}

export function H1Element(props: PlateElementProps) {
  return <HeadingElement variant="h1" {...props} />;
}

export function H2Element(props: PlateElementProps) {
  return <HeadingElement variant="h2" {...props} />;
}

export function H3Element(props: PlateElementProps) {
  return <HeadingElement variant="h3" {...props} />;
}

export function H4Element(props: PlateElementProps) {
  return <HeadingElement variant="h4" {...props} />;
}

export function H5Element(props: PlateElementProps) {
  return <HeadingElement variant="h5" {...props} />;
}

export function H6Element(props: PlateElementProps) {
  return <HeadingElement variant="h6" {...props} />;
}
