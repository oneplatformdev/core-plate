import * as React from 'react';

import type { TCaptionElement, TMediaEmbedElement, TResizableProps } from 'platejs';
import type { SlateElementProps } from 'platejs/static';

import { parseVideoUrl } from '@platejs/media';
import { NodeApi } from 'platejs';
import { SlateElement } from 'platejs/static';

export function MediaEmbedElementStatic(
  props: SlateElementProps<TMediaEmbedElement & TCaptionElement & TResizableProps>
) {
  const { align = 'center', caption, url, width } = props.element;
  const embed = typeof url === 'string' ? parseVideoUrl(url) : undefined;
  const embedUrl = embed?.url ?? url;

  return (
    <SlateElement className="py-2.5" {...props}>
      <div style={{ textAlign: align }}>
        <figure className="group relative m-0 inline-block cursor-default" style={{ width }}>
          {embedUrl ? (
            <iframe
              className="aspect-video w-full max-w-full rounded-sm border-0"
              src={embedUrl}
              title="embed"
              allowFullScreen
            />
          ) : null}
          {caption && <figcaption>{NodeApi.string(caption[0])}</figcaption>}
        </figure>
      </div>
      {props.children}
    </SlateElement>
  );
}
