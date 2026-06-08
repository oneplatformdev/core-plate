'use client';

import * as React from 'react';

import type { TPlaceholderElement } from 'platejs';
import type { PlateElementProps } from 'platejs/react';

import {
  PlaceholderPlugin,
  PlaceholderProvider,
  updateUploadHistory,
} from '@platejs/media/react';
import { AudioLines, FileUp, Film, ImageIcon, Loader2Icon } from 'lucide-react';
import { KEYS } from 'platejs';
import { PlateElement, useEditorPlugin, withHOC } from 'platejs/react';
import { useFilePicker } from 'use-file-picker';

import { cn } from '@/lib/utils';
import { focusEditorReliably } from '@/lib/focus-editor';
import { useUploadFile } from '@/hooks/use-upload-file';
import { pasteImageHints } from '@/lib/paste-image-hints';
import { pasteAbortControllers } from '@/lib/paste-abort';

const CONTENT: Record<
  string,
  {
    accept: string[];
    content: React.ReactNode;
    icon: React.ReactNode;
  }
> = {
  [KEYS.audio]: {
    accept: ['audio/*'],
    content: 'Add an audio file',
    icon: <AudioLines />,
  },
  [KEYS.file]: {
    accept: ['*'],
    content: 'Add a file',
    icon: <FileUp />,
  },
  [KEYS.img]: {
    accept: ['image/*'],
    content: 'Add an image',
    icon: <ImageIcon />,
  },
  [KEYS.video]: {
    accept: ['video/*'],
    content: 'Add a video',
    icon: <Film />,
  },
};

export const PlaceholderElement = withHOC(
  PlaceholderProvider,
  function PlaceholderElement(props: PlateElementProps<TPlaceholderElement>) {
    const { editor, element } = props;

    const { api } = useEditorPlugin(PlaceholderPlugin);

    const { isUploading, progress, uploadedFile, uploadFile, uploadingFile } =
      useUploadFile();

    const loading = isUploading && uploadingFile;

    const currentContent = CONTENT[element.mediaType];

    const isImage = element.mediaType === KEYS.img;

    const imageRef = React.useRef<HTMLImageElement>(null);

    const { openFilePicker } = useFilePicker({
      accept: currentContent.accept,
      multiple: true,
      onFilesSelected: ({ plainFiles: updatedFiles }) => {
        const firstFile = updatedFiles[0];
        const restFiles = updatedFiles.slice(1);

        replaceCurrentPlaceholder(firstFile);

        if (restFiles.length > 0) {
          editor.getTransforms(PlaceholderPlugin).insert.media(restFiles);
        }
      },
    });

    const replaceCurrentPlaceholder = React.useCallback(
      (file: File) => {
        api.placeholder.addUploadingFile(element.id as string, file);
        const controller = pasteAbortControllers.get(element.id as string);
        uploadFile(file, { signal: controller?.signal }).catch(() => {
          // Error already surfaced via onUploadError. Tear down placeholder
          // so the editor doesn't show a stuck "uploading" indicator. Same
          // path for aborted uploads — the cancelled image just disappears.
          api.placeholder.removeUploadingFile(element.id as string);
          const path = editor.api.findPath(element);
          if (path) {
            editor.tf.withoutSaving(() => {
              editor.tf.removeNodes({ at: path });
            });
          }
        });
      },
      [api.placeholder, editor, element, uploadFile]
    );

    React.useEffect(() => {
      if (!uploadedFile) return;

      const path = editor.api.findPath(element);
      if (!path) return;

      editor.tf.withoutSaving(() => {
        editor.tf.removeNodes({ at: path });

        const isResizableMedia =
          element.mediaType === KEYS.img || element.mediaType === KEYS.video;

        // Зберігаємо імʼя/розмір/тип для всіх медіа (audio та file їх показують).
        const keepMeta =
          element.mediaType === KEYS.file || element.mediaType === KEYS.audio;

        const node = {
          children: [{ text: '' }],
          initialHeight: imageRef.current?.height,
          initialWidth: imageRef.current?.width,
          isUpload: true,
          name: keepMeta ? uploadedFile.name : '',
          mimeType: uploadedFile.type,
          size: uploadedFile.size,
          placeholderId: element.id as string,
          type: element.mediaType!,
          url: uploadedFile.url,
          ...(isResizableMedia ? { width: 'calc(100% - 80px)' } : {}),
        };

        editor.tf.insertNodes(node, { at: path });

        updateUploadHistory(editor, node);
      });

      const restoreFocus = () => {
        const activeElement = document.activeElement as HTMLElement | null;
        const isInteractingWithOverlay = !!activeElement?.closest(
          '[data-slot="dropdown-menu-content"], [data-slot="alert-dialog-content"], [data-slot="popover-content"]'
        );
        if (isInteractingWithOverlay) return;

        editor.tf.select(editor.api.end([]));
        editor.tf.collapse({ edge: 'end' });
        focusEditorReliably(editor);
      };

      requestAnimationFrame(() => {
        restoreFocus();
        setTimeout(restoreFocus, 10);
      });

      api.placeholder.removeUploadingFile(element.id as string);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [uploadedFile, element.id]);

    // React dev mode will call React.useEffect twice
    const isReplaced = React.useRef(false);

    /** Paste and drop */
    React.useEffect(() => {
      if (isReplaced.current) return;

      isReplaced.current = true;
      const currentFiles = api.placeholder.getUploadingFile(
        element.id as string
      );

      if (!currentFiles) return;

      replaceCurrentPlaceholder(currentFiles);

      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isReplaced]);

    const imageHint = isImage
      ? pasteImageHints.get(element.id as string)
      : undefined;

    return (
      <PlateElement className="my-1" {...props}>
        {!isImage && (
          <div
            className={cn(
              'flex cursor-pointer select-none items-center rounded-sm bg-muted p-3 pr-9 hover:bg-primary/10'
            )}
            onClick={() => !loading && openFilePicker()}
            contentEditable={false}
          >
            <div className="relative mr-3 flex text-muted-foreground/80 [&_svg]:size-6">
              {currentContent.icon}
            </div>
            <div className="whitespace-nowrap text-muted-foreground text-sm">
              <div>
                {loading ? uploadingFile?.name : currentContent.content}
              </div>

              {loading && (
                <div className="mt-1 flex items-center gap-1.5">
                  <div>{formatBytes(uploadingFile?.size ?? 0)}</div>
                  <div>–</div>
                  <div className="flex items-center">
                    <Loader2Icon className="mr-1 size-3.5 animate-spin text-muted-foreground" />
                    {Math.round(progress ?? 0)}%
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {isImage &&
          (loading && uploadingFile ? (
            <ImageProgress
              file={uploadingFile}
              imageRef={imageRef}
              progress={progress}
              placeholderId={element.id as string}
            />
          ) : (
            <ImageSkeleton hint={imageHint} />
          ))}

        {props.children}
      </PlateElement>
    );
  }
);

function ImageSkeleton({
  hint,
}: {
  hint?: { width: number; height: number };
}) {
  return (
    <div
      className="relative mx-auto w-[calc(100%-80px)]"
      contentEditable={false}
      style={{
        aspectRatio: hint ? `${hint.width} / ${hint.height}` : undefined,
        minHeight: hint ? undefined : 160,
      }}
      aria-hidden
    >
      <div className="absolute inset-0 animate-pulse rounded-sm bg-muted" />
    </div>
  );
}

export function ImageProgress({
  className,
  file,
  imageRef,
  progress = 0,
  placeholderId,
}: {
  file: File;
  className?: string;
  imageRef?: React.RefObject<HTMLImageElement | null>;
  progress?: number;
  placeholderId?: string;
}) {
  const [objectUrl, setObjectUrl] = React.useState<string | null>(null);
  const [aspect, setAspect] = React.useState<string | undefined>(() => {
    if (!placeholderId) return undefined;
    const hint = pasteImageHints.get(placeholderId);
    return hint ? `${hint.width} / ${hint.height}` : undefined;
  });

  React.useEffect(() => {
    const url = URL.createObjectURL(file);
    setObjectUrl(url);

    // If we don't already have a hint from the paste flow, probe the file's
    // natural dimensions ourselves so the skeleton box still reserves space.
    if (!aspect) {
      const probe = new Image();
      probe.onload = () => {
        if (probe.naturalWidth && probe.naturalHeight) {
          setAspect(`${probe.naturalWidth} / ${probe.naturalHeight}`);
        }
      };
      probe.src = url;
    }

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file, aspect]);

  if (!objectUrl) {
    return null;
  }

  return (
    <div
      className={cn('relative mx-auto w-[calc(100%-80px)]', className)}
      contentEditable={false}
      style={{
        aspectRatio: aspect,
        minHeight: aspect ? undefined : 120,
      }}
    >
      {/* Hidden img keeps imageRef.width/height in sync with the reserved box,
          so the eventual media node inherits the same dimensions and there is
          no swap-time layout shift. */}
      <img
        ref={imageRef}
        className="absolute inset-0 h-full w-full rounded-sm object-cover opacity-0"
        alt={file.name}
        src={objectUrl}
        aria-hidden
      />
      <div
        className="absolute inset-0 animate-pulse rounded-sm bg-muted"
        aria-hidden
      />
    </div>
  );
}

function formatBytes(
  bytes: number,
  opts: {
    decimals?: number;
    sizeType?: 'accurate' | 'normal';
  } = {}
) {
  const { decimals = 0, sizeType = 'normal' } = opts;

  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const accurateSizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB'];

  if (bytes === 0) return '0 Byte';

  const i = Math.floor(Math.log(bytes) / Math.log(1024));

  return `${(bytes / 1024 ** i).toFixed(decimals)} ${
    sizeType === 'accurate'
      ? (accurateSizes[i] ?? 'Bytest')
      : (sizes[i] ?? 'Bytes')
  }`;
}
