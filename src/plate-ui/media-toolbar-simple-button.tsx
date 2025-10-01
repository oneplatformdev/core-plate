'use client';

import type { DropdownMenuProps } from '@radix-ui/react-dropdown-menu';
import { insertNodes, isUrl } from '@udecode/plate-common';
import { type PlateEditor, useEditorRef } from '@udecode/plate-common/react';
import {
  FilePlugin,
  ImagePlugin,
} from '@udecode/plate-media/react';
import { ImageIcon, LinkIcon } from 'lucide-react';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useFilePicker } from 'use-file-picker';

import { Button } from '@oneplatformdev/ui';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
  useOpenState,
} from './dropdown-menu';
import { FloatingInput } from './input';
import { useUploadState } from '../hooks/use-upload-state';

type EditorWithMediaInsert = PlateEditor & {
  tf: {
    insert: {
      media: (files: File[]) => void;
    };
  };
};

const getMediaConfig = (t: ReturnType<typeof useTranslation>['t']) => ({
  [ImagePlugin.key]: {
    accept: ['image/*'],
    icon: <ImageIcon className="size-4" />,
    title: t('plate.media.insertImage'),
    tooltip: t('plate.media.iconTooltipImage'),
  },
});

export function MediaToolbarSimpleButton({
  nodeType,
  ...props
}: DropdownMenuProps & { nodeType: keyof ReturnType<typeof getMediaConfig>, isUploadDisabled?: boolean;}) {
  const { t } = useTranslation('lms');
  const mediaConfig = getMediaConfig(t);
  const currentConfig = mediaConfig[nodeType];

  const editor = useEditorRef();
  const [dialogOpen, setDialogOpen] = useState(false);
  const openState = useOpenState();

  const { globalUploading: loading  } = useUploadState();

  const { openFilePicker } = useFilePicker({
    accept: currentConfig.accept,
    multiple: true,
    onFilesSelected: ({ plainFiles }) => {
      (editor as EditorWithMediaInsert).tf.insert.media(plainFiles);
    },
  });

  return (
    <>
      <DropdownMenu modal={false} {...openState} {...props}>
        <DropdownMenuTrigger asChild disabled={loading}>
          <Button
            size="icon"
            variant="outline"
            tooltip={currentConfig.tooltip}
            onClick={(e) => {
              e.preventDefault();
              openState.onOpenChange(true);
            }}
            className='text-[#666a78]'
            disabled={loading}
          >
            {currentConfig.icon}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          onClick={(e) => e.stopPropagation()}
          align="start"
        >
          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={() => openFilePicker()}>
              {currentConfig.icon}
              {t('plate.media.uploadFromComputer')}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setDialogOpen(true)}>
              <LinkIcon />
              {t('plate.media.insertViaUrl')}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent className="gap-6">
          <MediaUrlDialogContent
            currentConfig={currentConfig}
            nodeType={nodeType}
            setOpen={setDialogOpen}
          />
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function MediaUrlDialogContent({
  currentConfig,
  nodeType,
  setOpen,
}: {
  currentConfig: {
    accept: string[];
    icon: React.ReactNode;
    title: string;
    tooltip: string;
  };
  nodeType: string;
  setOpen: (value: boolean) => void;
}) {
  const { t } = useTranslation('lms');
  const editor = useEditorRef();
  const [url, setUrl] = useState('');

  const embedMedia = useCallback(() => {
    if (!isUrl(url)) return toast.error('Invalid URL');

    setOpen(false);
    insertNodes(editor, {
      children: [{ text: '' }],
      name: nodeType === FilePlugin.key ? url.split('/').pop() : undefined,
      type: nodeType,
      url,
    });
  }, [url, editor, nodeType, setOpen]);

  return (
    <>
      <AlertDialogHeader>
        <AlertDialogTitle>{currentConfig.title}</AlertDialogTitle>
      </AlertDialogHeader>

      <AlertDialogDescription className="group relative w-full">
        <FloatingInput
          id="url"
          className="w-full"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') embedMedia();
          }}
          label="URL"
          placeholder=""
          type="url"
          autoFocus
        />
      </AlertDialogDescription>

      <AlertDialogFooter>
        <AlertDialogCancel>{t('plate.media.cancel')}</AlertDialogCancel>
        <AlertDialogAction
          onClick={(e) => {
            e.preventDefault();
            embedMedia();
          }}
        >
          {t('plate.media.accept')}
        </AlertDialogAction>
      </AlertDialogFooter>
    </>
  );
}
