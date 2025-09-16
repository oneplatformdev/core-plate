'use client';

import { cn, withRef } from '@udecode/cn';
import { ListStyleType } from '@udecode/plate-indent-list';
import {
  useIndentListToolbarButton,
  useIndentListToolbarButtonState,
} from '@udecode/plate-indent-list/react';
import { List, ListOrdered } from 'lucide-react';

import { Button } from '@oneplatformdev/ui';

import { ToolbarButton } from './toolbar';

export const IndentListToolbarSimpleButton = withRef<
  typeof ToolbarButton,
  {
    nodeType?: ListStyleType;
  }
>(({ nodeType = ListStyleType.Disc, ...rest }, ref) => {
  const state = useIndentListToolbarButtonState({ nodeType });
  const { props } = useIndentListToolbarButton(state);
  const isActive = state.pressed;

  return (
    <Button
      ref={ref}
      size="icon"
      variant="outline"
      className={cn(isActive && "bg-[#F4F4F5]")}
      tooltip={
        nodeType === ListStyleType.Disc ? 'Bulleted List' : 'Numbered List'
      }
      {...props}
      {...rest}
    >
      {nodeType === ListStyleType.Disc
        ? <List className="w-4 h-4 text-[#666a78]" />
        : <ListOrdered className="w-4 h-4 text-[#666a78]" />}
    </Button>
  );
});
