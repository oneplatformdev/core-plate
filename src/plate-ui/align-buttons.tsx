'use client';

import { cn } from '@oneplatformdev/utils';
import {
  useAlignDropdownMenu,
  useAlignDropdownMenuState,
} from '@udecode/plate-alignment/react';
import {
  AlignCenterIcon,
  AlignLeftIcon,
  AlignRightIcon,
} from 'lucide-react';

import { Button } from '@oneplatformdev/ui';

const items = [
  { icon: AlignLeftIcon, value: 'left', tooltip: 'Align left' },
  { icon: AlignCenterIcon, value: 'center', tooltip: 'Align center' },
  { icon: AlignRightIcon, value: 'right', tooltip: 'Align right' },
];

export function AlignButtons() {
  const state = useAlignDropdownMenuState();
  const { radioGroupProps } = useAlignDropdownMenu(state);

  return (
    <div className="flex gap-1">
      {items.map(({ icon: Icon, value }) => {
        const isActive = radioGroupProps.value === value;
        const handleClick = () => radioGroupProps.onValueChange?.(value);

        return (
          <Button
            key={value}
            size="icon"
            variant="outline"
            className={cn(isActive && "bg-[#F4F4F5]")}
            onClick={handleClick}
          >
            <Icon className="w-4 h-4 text-[#666a78]" />
          </Button>
        );
      })}
    </div>
  );
}
