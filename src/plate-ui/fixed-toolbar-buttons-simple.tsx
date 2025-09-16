'use client';

import { useEditorReadOnly } from '@udecode/plate-common/react';
import { ListStyleType } from '@udecode/plate-indent-list';
import { ImagePlugin } from '@udecode/plate-media/react';
// import { ArrowUpToLineIcon } from 'lucide-react';
import {
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
} from 'lucide-react';

import { AlignButtons } from './align-buttons';
import { IndentListToolbarSimpleButton } from './indent-list-toolbar-simple-button';
import { MarkToolbarSimpleButton } from './mark-toolbar-simple-button';
import { MediaToolbarSimpleButton } from './media-toolbar-simple-button';
import { TurnIntoDropdownSimpleMenu } from './turn-into-dropdown-simple-menu';


export function FixedToolbarButtonsSimple() {
  const readOnly = useEditorReadOnly();

  return (
    <div className="flex w-full">
      {!readOnly && (
        <div className="flex gap-1">
          <TurnIntoDropdownSimpleMenu />

          <AlignButtons />

          <MarkToolbarSimpleButton nodeType="bold" >
            <BoldIcon className="w-4 h-4 text-[#666a78]" />
          </MarkToolbarSimpleButton>
          <MarkToolbarSimpleButton nodeType="italic">
            <ItalicIcon className="w-4 h-4 text-[#666a78]" />
          </MarkToolbarSimpleButton>
          <MarkToolbarSimpleButton nodeType="underline">
            <UnderlineIcon className="w-4 h-4 text-[#666a78]" />
          </MarkToolbarSimpleButton>

          <IndentListToolbarSimpleButton nodeType={ListStyleType.Disc} />
          <IndentListToolbarSimpleButton nodeType={ListStyleType.Decimal} />

          <MediaToolbarSimpleButton nodeType={ImagePlugin.key} />
        </div>
      )}
    </div>
  );
}
