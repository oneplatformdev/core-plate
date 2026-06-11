'use client';

import * as React from 'react';

import type { TFileElement } from 'platejs';
import type { PlateElementProps } from 'platejs/react';

import { useMediaState } from '@platejs/media/react';
import { ResizableProvider } from '@platejs/resizable';
import { DownloadIcon, Trash2Icon } from 'lucide-react';
import {
  PlateElement,
  useReadOnly,
  useRemoveNodeButton,
  withHOC,
} from 'platejs/react';

import { formatBytes } from '@/lib/file-format';
import { usePlateI18n } from '@/i18n/provider';
import { Caption, CaptionTextarea } from './caption';
import { FileTypeIcon } from './file-type-icon';
import { MediaMeta } from './media-audio-node';

type TFileElementWithMeta = TFileElement & {
  name?: string;
  size?: number;
};

export const FileElement = withHOC(
  ResizableProvider,
  function FileElement(props: PlateElementProps<TFileElement>) {
    const { t } = usePlateI18n();
    const readOnly = useReadOnly();
    const { name, unsafeUrl } = useMediaState();
    const element = props.element as TFileElementWithMeta;
    const { props: removeButtonProps } = useRemoveNodeButton({ element });

    const fileName = element.name || name;

    return (
      <PlateElement className="my-1 rounded-sm" {...props}>
        <div
          className="group relative flex items-center gap-3 rounded-lg border border-border bg-background p-4 pr-10"
          contentEditable={false}
        >
          <a
            href={unsafeUrl}
            download={fileName}
            rel="noopener noreferrer"
            target="_blank"
            className="shrink-0"
            aria-label={fileName}
          >
            <FileTypeIcon name={fileName} size={40} />
          </a>

          <div className="flex min-w-0 flex-1 flex-col">
            <Caption style={{ width: '100%' }} align="left">
              <CaptionTextarea
                className="text-left text-sm font-medium"
                readOnly={readOnly}
                placeholder={t('writeCaption')}
              />
            </Caption>

            <MediaMeta
              className="mt-1"
              parts={[fileName, formatBytes(element.size)]}
            />
          </div>

          <a
            href={unsafeUrl}
            download={fileName}
            rel="noopener noreferrer"
            target="_blank"
            className="flex size-8 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
            aria-label={fileName}
          >
            <DownloadIcon className="size-5" />
          </a>

          {!readOnly && (
            <button
              type="button"
              {...removeButtonProps}
              className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-destructive group-hover:opacity-100"
              aria-label={t('caption')}
            >
              <Trash2Icon className="size-4" />
            </button>
          )}
        </div>
        {props.children}
      </PlateElement>
    );
  }
);
