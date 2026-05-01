'use client';

import * as React from 'react';

import type { TMediaEmbedElement } from 'platejs';
import type { PlateElementProps } from 'platejs/react';

import { CaptionPlugin } from '@platejs/caption/react';
import {
  AudioPlugin,
  FilePlugin,
  ImagePlugin,
  MediaEmbedPlugin,
  PlaceholderPlugin,
  VideoPlugin,
} from '@platejs/media/react';
import { KEYS } from 'platejs';

import { AudioElement } from '@/components/ui/media-audio-node';
import { FileElement } from '@/components/ui/media-file-node';
import { ImageElement } from '@/components/ui/media-image-node';
import { PlaceholderElement } from '@/components/ui/media-placeholder-node';
import { MediaPreviewDialog } from '@/components/ui/media-preview-dialog';
import { MediaUploadToast } from '@/components/ui/media-upload-toast';
import { VideoElement } from '@/components/ui/media-video-node';

const MediaEmbedElementLazy = React.lazy(() =>
  import('@/components/ui/media-embed-node').then((m) => ({
    default: m.MediaEmbedElement,
  }))
);

function MediaEmbedElement(props: PlateElementProps<TMediaEmbedElement>) {
  return (
    <React.Suspense fallback={null}>
      <MediaEmbedElementLazy {...props} />
    </React.Suspense>
  );
}

export const MediaKit = [
  ImagePlugin.configure({
    options: { disableUploadInsert: true },
    render: { afterEditable: MediaPreviewDialog, node: ImageElement },
  }),
  MediaEmbedPlugin.withComponent(MediaEmbedElement),
  VideoPlugin.withComponent(VideoElement),
  AudioPlugin.withComponent(AudioElement),
  FilePlugin.withComponent(FileElement),
  PlaceholderPlugin.configure({
    options: { disableEmptyPlaceholder: true },
    render: { afterEditable: MediaUploadToast, node: PlaceholderElement },
  }),
  CaptionPlugin.configure({
    options: {
      query: {
        allow: [KEYS.img, KEYS.video, KEYS.audio, KEYS.file, KEYS.mediaEmbed],
      },
    },
  }),
];
