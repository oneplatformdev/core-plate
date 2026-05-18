'use client';

import * as React from 'react';

import type { DropdownMenuProps } from '@radix-ui/react-dropdown-menu';

import { PlaceholderPlugin } from '@platejs/media/react';
import {
  AudioLinesIcon,
  FileUpIcon,
  FilmIcon,
  ImageIcon,
  LinkIcon,
} from 'lucide-react';
import { isUrl, KEYS } from 'platejs';
import { useEditorRef } from 'platejs/react';
import { toast } from 'sonner';
import { useFilePicker } from 'use-file-picker';

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { focusEditorReliably } from '@/lib/focus-editor';

import {
  ToolbarSplitButton,
  ToolbarSplitButtonPrimary,
  ToolbarSplitButtonSecondary,
} from './toolbar';
import { usePlateI18n } from '@/i18n/provider';
import type { PlateMessageKey } from '@/i18n/messages';
import { useToolbarOverflowMenu } from './toolbar-overflow-context';

const MEDIA_CONFIG: Record<
  string,
  {
    accept: string[];
    icon: React.ReactNode;
    titleKey: PlateMessageKey;
    tooltipKey: PlateMessageKey;
  }
> = {
  [KEYS.audio]: {
    accept: ['audio/*'],
    icon: <AudioLinesIcon className="size-4" />,
    titleKey: 'insertAudio',
    tooltipKey: 'audio',
  },
  [KEYS.file]: {
    accept: ['*'],
    icon: <FileUpIcon className="size-4" />,
    titleKey: 'insertFile',
    tooltipKey: 'file',
  },
  [KEYS.img]: {
    accept: ['image/*'],
    icon: <ImageIcon className="size-4" />,
    titleKey: 'insertImage',
    tooltipKey: 'image',
  },
  [KEYS.video]: {
    accept: ['video/*'],
    icon: <FilmIcon className="size-4" />,
    titleKey: 'insertVideo',
    tooltipKey: 'video',
  },
};

export function MediaToolbarButton({
  nodeType,
  ...props
}: DropdownMenuProps & { nodeType: string }) {
  const { t } = usePlateI18n();
  const currentConfig = MEDIA_CONFIG[nodeType];

  const editor = useEditorRef();
  const [open, setOpen] = React.useState(false);
  const inOverflowMenu = useToolbarOverflowMenu();
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const { openFilePicker } = useFilePicker({
    accept: currentConfig.accept,
    multiple: true,
    onFilesSelected: ({ plainFiles: updatedFiles }) => {
      editor.getTransforms(PlaceholderPlugin).insert.media(updatedFiles);
    },
  });

  return (
    <>
      <ToolbarSplitButton
        tooltip={t(currentConfig.tooltipKey)}
        onClick={() => {
          openFilePicker();
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setOpen(true);
          }
        }}
        pressed={open}
      >
        <ToolbarSplitButtonPrimary>
          {currentConfig.icon}
        </ToolbarSplitButtonPrimary>

        <DropdownMenu
          open={open}
          onOpenChange={setOpen}
          modal={false}
          {...props}
        >
          <DropdownMenuTrigger asChild>
            <ToolbarSplitButtonSecondary />
          </DropdownMenuTrigger>

          <DropdownMenuContent
            onClick={(e) => e.stopPropagation()}
            align={inOverflowMenu ? 'end' : 'start'}
            alignOffset={inOverflowMenu ? 0 : -32}
            side={inOverflowMenu ? 'left' : 'bottom'}
          >
            <DropdownMenuGroup>
              <DropdownMenuItem onSelect={() => openFilePicker()}>
                {currentConfig.icon}
                {t('uploadFromComputer')}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setDialogOpen(true)}>
                <LinkIcon />
                {t('insertViaUrl')}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </ToolbarSplitButton>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <MediaUrlDialogContent
            currentConfig={currentConfig}
            nodeType={nodeType}
            setOpen={setDialogOpen}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

function MediaUrlDialogContent({
  currentConfig,
  nodeType,
  setOpen,
}: {
  currentConfig: (typeof MEDIA_CONFIG)[string];
  nodeType: string;
  setOpen: (value: boolean) => void;
}) {
  const { t } = usePlateI18n();
  const editor = useEditorRef();
  const [url, setUrl] = React.useState('');
  const scheduleRestoreFocus = React.useCallback(() => {
    setTimeout(() => {
      const activeElement = document.activeElement as HTMLElement | null;
      const isInteractingWithOverlay = !!activeElement?.closest(
        '[data-slot="dropdown-menu-content"], [data-slot="dialog-content"], [data-slot="popover-content"]'
      );

      if (isInteractingWithOverlay) return;

      editor.tf.select(editor.api.end([]));
      editor.tf.collapse({ edge: 'end' });
      focusEditorReliably(editor);
    }, 10);
  }, [editor]);

  const isDirectVideoFileUrl = React.useCallback((value: string) => {
    return /\.(mp4|webm|ogg|mov|m4v)(\?.*)?(#.*)?$/i.test(value);
  }, []);

  const embedMedia = React.useCallback(() => {
    if (!isUrl(url)) return toast.error(t('invalidUrl'));

    setOpen(false);
    const resolvedType =
      nodeType === KEYS.video && !isDirectVideoFileUrl(url)
        ? KEYS.mediaEmbed
        : nodeType;

    const isResizable =
      resolvedType === KEYS.img ||
      resolvedType === KEYS.video ||
      resolvedType === KEYS.mediaEmbed;

    editor.tf.insertNodes({
      children: [{ text: '' }],
      name: resolvedType === KEYS.file ? url.split('/').pop() : undefined,
      type: resolvedType,
      url,
      ...(isResizable ? { width: 400 } : {}),
    });
    scheduleRestoreFocus();
  }, [url, t, setOpen, editor.tf, nodeType, isDirectVideoFileUrl, scheduleRestoreFocus]);

  return (
    <>
      <DialogHeader className="flex flex-row items-center justify-between min-h-10">
        <DialogTitle>{t(currentConfig.titleKey)}</DialogTitle>
      </DialogHeader>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="url"
          className="font-sans text-[14px] font-medium leading-[125%] text-[#06080D]"
        >
          {t('url')}
        </label>
        <Input
          id="url"
          className="h-11 w-full rounded-lg border border-[#E8E9EB] bg-[#FCFCFC] px-2 py-1 font-sans text-[16px] font-medium leading-[140%] text-[#06080D] placeholder:text-[#666A78]"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') embedMedia();
          }}
          placeholder=""
          type="url"
          autoFocus
        />
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button
            variant="outline"
            className="h-10 min-h-10 w-[140px] min-w-[140px] rounded-lg border border-[#E1E1E5] bg-[#FCFCFC] px-3 py-2 font-sans text-[16px] font-medium leading-[140%] text-[#06080D] hover:bg-[#FCFCFC]"
          >
            {t('cancel')}
          </Button>
        </DialogClose>
        <Button
          className="h-10 min-h-10 w-[140px] min-w-[140px] rounded-lg bg-[#9368FF] px-3 py-2 font-sans text-[16px] font-medium leading-[140%] text-[#FCFCFC] hover:bg-[#9368FF]/90"
          onClick={(e) => {
            e.preventDefault();
            embedMedia();
          }}
        >
          {t('accept')}
        </Button>
      </DialogFooter>
    </>
  );
}
