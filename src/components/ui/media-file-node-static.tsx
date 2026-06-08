import * as React from 'react';

import type { TCaptionProps, TFileElement } from 'platejs';
import type { SlateElementProps } from 'platejs/static';

import { NodeApi } from 'platejs';
import { SlateElement } from 'platejs/static';

import { formatBytes } from '@/lib/file-format';
import { FileTypeIcon } from './file-type-icon';
import { MediaMeta } from './media-audio-node';

type TFileElementWithMeta = TFileElement &
  TCaptionProps & {
    size?: number;
  };

export function FileElementStatic(props: SlateElementProps<TFileElement>) {
  const element = props.element as TFileElementWithMeta;
  const { caption, name, size, url } = element;

  return (
    <SlateElement className="my-1 rounded-sm" {...props}>
      <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-4">
        <a
          href={url}
          download={name}
          rel="noopener noreferrer"
          target="_blank"
          className="shrink-0"
          aria-label={name}
        >
          <FileTypeIcon name={name} size={40} />
        </a>

        <div className="flex min-w-0 flex-1 flex-col">
          {caption && (
            <div className="text-sm font-medium">{NodeApi.string(caption[0])}</div>
          )}
          <MediaMeta className="mt-1" parts={[name, formatBytes(size)]} />
        </div>
      </div>
      {props.children}
    </SlateElement>
  );
}
