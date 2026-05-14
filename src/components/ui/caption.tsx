'use client';

import * as React from 'react';

import type { VariantProps } from 'class-variance-authority';

import {
  Caption as CaptionPrimitive,
  CaptionTextarea as CaptionTextareaPrimitive,
  useCaptionButton,
  useCaptionButtonState,
} from '@platejs/caption/react';
import { createPrimitiveComponent } from '@udecode/cn';
import { cva } from 'class-variance-authority';
import { KEYS } from 'platejs';
import { useEditorRef, useElement } from 'platejs/react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const captionVariants = cva('max-w-full', {
  defaultVariants: {
    align: 'center',
  },
  variants: {
    align: {
      center: 'mx-auto',
      left: 'mr-auto',
      right: 'ml-auto',
    },
  },
});

export function Caption({
  align,
  className,
  ...props
}: React.ComponentProps<typeof CaptionPrimitive> &
  VariantProps<typeof captionVariants>) {
  return (
    <CaptionPrimitive
      {...props}
      className={cn(captionVariants({ align }), className)}
    />
  );
}

export function CaptionTextarea(
  props: React.ComponentProps<typeof CaptionTextareaPrimitive>
) {
  const editor = useEditorRef();
  const element = useElement();

  return (
    <CaptionTextareaPrimitive
      {...props}
      maxLength={155}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
          e.preventDefault();

          const path = editor.api.findPath(element);
          if (!path) return;

          const insertAt = [path[0] + 1];
          editor.tf.insertNodes(
            { type: KEYS.p, children: [{ text: '' }] },
            { at: insertAt, select: true }
          );
          editor.tf.focus();
          return;
        }
        props.onKeyDown?.(e);
      }}
      className={cn(
        'mt-2 w-full resize-none border-none bg-inherit p-0 font-[inherit] text-inherit',
        'focus:outline-none focus:[&::placeholder]:opacity-0',
        'text-center print:placeholder:text-transparent',
        props.className
      )}
    />
  );
}

export const CaptionButton = createPrimitiveComponent(Button)({
  propsHook: useCaptionButton,
  stateHook: useCaptionButtonState,
});
