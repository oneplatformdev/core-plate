import { cn } from '@oneplatformdev/utils';
import type { SlateElementProps } from '@udecode/plate-common';
import { SlateElement } from '@udecode/plate-common';
import type { TTableElement } from '@udecode/plate-table';

export const TableElementStatic = ({
  children,
  className,
  ...props
}: SlateElementProps) => {
  const { colSizes } = props.element as TTableElement;

  return (
    <SlateElement className={cn(className, 'overflow-x-auto')} {...props}>
      <table
        className={cn(
          'my-4 ml-px mr-0 table h-px w-[calc(100%-6px)] table-fixed border-collapse'
        )}
      >
        <colgroup>
          {colSizes?.map((width, index) => (
            <col
              key={index}
              style={{
                width: width || undefined,
              }}
            />
          ))}
        </colgroup>

        <tbody className="min-w-full">{children}</tbody>
      </table>
    </SlateElement>
  );
};
