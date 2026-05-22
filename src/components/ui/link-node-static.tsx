import * as React from 'react';

import type { TLinkElement } from 'platejs';
import type { SlateElementProps } from 'platejs/static';

import { getLinkAttributes } from '@platejs/link';
import { SlateElement } from 'platejs/static';

export function LinkElementStatic(props: SlateElementProps<TLinkElement>) {
  return (
    <SlateElement
      {...props}
      as="a"
      className="font-medium text-[#2563EB] underline decoration-[#2563EB] underline-offset-4 hover:text-[#1D4ED8] hover:decoration-[#1D4ED8]"
      attributes={{
        ...props.attributes,
        ...getLinkAttributes(props.editor, props.element),
        target: '_blank',
        rel: 'noopener noreferrer',
      }}
    >
      {props.children}
    </SlateElement>
  );
}
