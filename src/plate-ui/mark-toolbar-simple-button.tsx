'use client';

import { cn, withRef } from '@udecode/cn';
import {
  useMarkToolbarButton,
  useMarkToolbarButtonState,
} from '@udecode/plate-common/react';

import { Button } from '@oneplatformdev/ui';


export const MarkToolbarSimpleButton = withRef<
  typeof Button,
  {
    nodeType: string;
    clear?: string[] | string;
  }
>(({ clear, nodeType, ...rest }, ref) => {
  const state = useMarkToolbarButtonState({ clear, nodeType });
  const { props } = useMarkToolbarButton(state);
  const isActive = state.pressed;

  return (
    <Button
      ref={ref}
      size="icon"
      variant="outline"
      className={cn(isActive && "bg-[#F4F4F5]")}
      {...props}
      {...rest}
    />
  );
});
