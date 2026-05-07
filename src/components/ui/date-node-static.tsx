import * as React from 'react';

import type { TDateElement } from 'platejs';
import type { SlateElementProps } from 'platejs/static';

import { SlateElement } from 'platejs/static';
import { defaultPlateMessages } from '@/i18n/messages';
import { formatDateLabel } from '@/lib/format-date-label';

export function DateElementStatic(props: SlateElementProps<TDateElement>) {
  const { element } = props;

  return (
    <SlateElement as="span" className="inline-block" {...props}>
      <span className="w-fit rounded-sm bg-muted px-1 text-muted-foreground">
        {element.date || element.rawDate ? (
          formatDateLabel(
            element,
            'en',
            {
              today: defaultPlateMessages.today,
              tomorrow: defaultPlateMessages.tomorrow,
              yesterday: defaultPlateMessages.yesterday,
            }
          )
        ) : (
          <span>{defaultPlateMessages.pickDate}</span>
        )}
      </span>
      {props.children}
    </SlateElement>
  );
}
