'use client';

import * as React from 'react';

import {
  formatDateValue,
  parseCanonicalDateValue,
} from '@platejs/date';
import { enUS, uk } from 'date-fns/locale';
import type { TDateElement } from 'platejs';
import type { PlateElementProps } from 'platejs/react';

import { PlateElement, useReadOnly } from 'platejs/react';

import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { usePlateI18n } from '@/i18n/provider';
import { formatDateLabel } from '@/lib/format-date-label';
import { cn } from '@/lib/utils';

export function DateElement(props: PlateElementProps<TDateElement>) {
  const { locale, t } = usePlateI18n();
  const { editor, element } = props;

  const readOnly = useReadOnly();

  const trigger = (
    <span
      className={cn(
        'w-fit cursor-pointer rounded-sm bg-muted px-1 text-muted-foreground'
      )}
      contentEditable={false}
      draggable
    >
      {element.date || element.rawDate ? (
        formatDateLabel(
          element,
          locale,
          {
            today: t('today'),
            tomorrow: t('tomorrow'),
            yesterday: t('yesterday'),
          }
        )
      ) : (
        <span>{t('pickDate')}</span>
      )}
    </span>
  );

  if (readOnly) {
    return trigger;
  }

  const selectedDate = parseCanonicalDateValue(element.date ?? '');

  return (
    <PlateElement
      {...props}
      className="inline-block"
      attributes={{
        ...props.attributes,
        contentEditable: false,
      }}
    >
      <Popover>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent className="w-[328px] rounded-lg border-0 bg-[#FCFCFC] p-0 shadow-[0_10px_20px_rgba(3,4,7,0.0625)]">
          <Calendar
            selected={selectedDate}
            defaultMonth={selectedDate ?? undefined}
            onSelect={(date) => {
              if (!date) return;

              editor.tf.setNodes(
                { date: formatDateValue(date), rawDate: undefined },
                { at: element }
              );
            }}
            locale={locale === 'uk' ? uk : enUS}
            mode="single"
            initialFocus
          />
        </PopoverContent>
      </Popover>
      {props.children}
    </PlateElement>
  );
}
