import * as React from 'react';

import { FileUploadContext, type UploadResultLike } from '@/context/file-upload-context';
import type { ClientUploadedFileData } from 'uploadthing/types';

import { z } from 'zod';

export type UploadedFile<T = unknown> = ClientUploadedFileData<T>;

interface UseUploadFileProps {
  onUploadComplete?: (file: UploadedFile) => void;
  onUploadError?: (error: unknown) => void;
}

const MAX_VIDEO_SIZE_BYTES = 128 * 1024 * 1024;
const MAX_IMAGE_SIZE_BYTES = 16 * 1024 * 1024;

export function useUploadFile({
  onUploadComplete,
  onUploadError,
}: UseUploadFileProps = {}) {
  const {
    onUploadFile: uploadWithConsumer,
    onUploadError: consumerOnUploadError,
  } = React.useContext(FileUploadContext);
  const [uploadedFile, setUploadedFile] = React.useState<UploadedFile>();
  const [uploadingFile, setUploadingFile] = React.useState<File>();
  const [progress, setProgress] = React.useState<number>(0);
  const [isUploading, setIsUploading] = React.useState(false);

  const normalizeUploadedFile = React.useCallback(
    (file: File, uploaded: UploadResultLike): UploadedFile => {
      const resolvedUrl =
        uploaded.appUrl ??
        uploaded.originalUrl ??
        uploaded.mediumUrl ??
        uploaded.smallUrl ??
        uploaded.thumbUrl ??
        uploaded.url ??
        uploaded.download ??
        uploaded.path ??
        URL.createObjectURL(file);

      return {
        appUrl:
          uploaded.appUrl ??
          uploaded.originalUrl ??
          uploaded.mediumUrl ??
          uploaded.smallUrl ??
          uploaded.thumbUrl ??
          uploaded.url ??
          resolvedUrl,
        customId: uploaded.id != null ? String(uploaded.id) : null,
        fileHash: '',
        key: uploaded.key ?? uploaded.name ?? file.name,
        name: uploaded.name ?? file.name,
        serverData: undefined,
        size: uploaded.size ?? file.size,
        type: uploaded.type ?? file.type,
        ufsUrl: resolvedUrl,
        url: resolvedUrl,
      };
    },
    []
  );

  async function uploadThing(file: File) {
    setIsUploading(true);
    setUploadingFile(file);

    try {
      if (file.type.startsWith('video/') && file.size > MAX_VIDEO_SIZE_BYTES) {
        throw new Error('Video file is too large. Maximum size is 128MB.');
      }
      if (file.type.startsWith('image/') && file.size > MAX_IMAGE_SIZE_BYTES) {
        throw new Error('Image file is too large. Maximum size is 16MB.');
      }

      if (!uploadWithConsumer) {
        throw new Error(
          'useUploadFile: no upload handler is configured. Wrap the editor in <FileUploadContext.Provider value={{ onUploadFile }}> or pass `onUploadFile` to <PlateEditor />.'
        );
      }

      const uploaded = await uploadWithConsumer(file);
      const normalized = normalizeUploadedFile(
        file,
        (uploaded ?? {}) as UploadResultLike
      );

      setUploadedFile(normalized);
      onUploadComplete?.(normalized);
      setProgress(100);

      return normalized;
    } catch (error) {
      consumerOnUploadError?.(error, file);
      onUploadError?.(error);
      throw error;
    } finally {
      setProgress(0);
      setIsUploading(false);
      setUploadingFile(undefined);
    }
  }

  return {
    isUploading,
    progress,
    uploadedFile,
    uploadFile: uploadThing,
    uploadingFile,
  };
}

export function getErrorMessage(err: unknown) {
  const unknownError = 'Something went wrong, please try again later.';

  if (err instanceof z.ZodError) {
    const errors = err.issues.map((issue) => issue.message);

    return errors.join('\n');
  }
  if (err instanceof Error) {
    return err.message;
  }
  return unknownError;
}

