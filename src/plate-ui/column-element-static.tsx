import { cn } from '@oneplatformdev/utils';
import type { SlateElementProps } from '@udecode/plate-common';
import { SlateElement } from '@udecode/plate-common';
import type { TColumnElement } from '@udecode/plate-layout';

export function ColumnElementStatic({
  children,
  className,
  ...props
}: SlateElementProps) {
  const { width } = props.element as TColumnElement;

  return (
    <SlateElement
      className={cn(className, 'border border-transparent p-1.5')}
      style={{ width: width ?? '100%' }}
      {...props}
    >
      {children}
    </SlateElement>
  );
}
