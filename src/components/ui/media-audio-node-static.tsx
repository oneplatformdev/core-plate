import * as React from 'react';

import type { TAudioElement, TCaptionProps } from 'platejs';
import type { SlateElementProps } from 'platejs/static';

import { NodeApi } from 'platejs';
import { SlateElement } from 'platejs/static';

import { formatBytes } from '@/lib/file-format';
import { AudioPlayer, MediaMeta } from './media-audio-node';

type TAudioElementWithMeta = TAudioElement &
  TCaptionProps & {
    name?: string;
    size?: number;
  };

export function AudioElementStatic(props: SlateElementProps<TAudioElement>) {
  const element = props.element as TAudioElementWithMeta;
  const { caption, name, size, url } = element;

  return (
    <SlateElement {...props} className="my-1">
      <div className="rounded-lg border border-border bg-background p-4">
        {caption && (
          <div className="mb-2 text-sm font-medium">
            {NodeApi.string(caption[0])}
          </div>
        )}
        <AudioPlayer url={url} />
        <MediaMeta
          className="mt-2"
          parts={[name || undefined, formatBytes(size)]}
        />
      </div>
      {props.children}
    </SlateElement>
  );
}
