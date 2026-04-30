import * as React from 'react';

import { FileUploadContext, type UploadResultLike } from '@/context/file-upload-context';
import type { OurFileRouter } from '@/lib/uploadthing';
import type {
  ClientUploadedFileData,
  UploadFilesOptions,
} from 'uploadthing/types';

import { generateReactHelpers } from '@uploadthing/react';
import { toast } from 'sonner';
import { z } from 'zod';

export type UploadedFile<T = unknown> = ClientUploadedFileData<T>;

interface UseUploadFileProps
  extends Pick<
    UploadFilesOptions<OurFileRouter['editorUploader']>,
    'headers' | 'onUploadBegin' | 'onUploadProgress' | 'skipPolling'
  > {
  onUploadComplete?: (file: UploadedFile) => void;
  onUploadError?: (error: unknown) => void;
}

export function useUploadFile({
  onUploadComplete,
  onUploadError,
  ...props
}: UseUploadFileProps = {}) {
  const { onUploadFile: uploadWithConsumer } = React.useContext(FileUploadContext);
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
      if (uploadWithConsumer) {
        const uploaded = await uploadWithConsumer(file);
        const normalized = normalizeUploadedFile(
          file,
          (uploaded ?? {}) as UploadResultLike
        );

        setUploadedFile(normalized);
        onUploadComplete?.(normalized);
        setProgress(100);

        return normalized;
      }

      const res = await uploadFiles('editorUploader', {
        ...props,
        files: [file],
        onUploadProgress: ({ progress }) => {
          setProgress(Math.min(progress, 100));
        },
      });

      setUploadedFile(res[0]);
      onUploadComplete?.(res[0]);

      return res[0];
    } catch (error) {
      const errorMessage = getErrorMessage(error);

      const message =
        errorMessage.length > 0
          ? errorMessage
          : 'Something went wrong, please try again later.';

      toast.error(message);

      onUploadError?.(error);

      // Mock upload for unauthenticated users
      // toast.info('User not logged in. Mocking upload process.');
      const mockUploadedFile = {
        key: 'mock-key-0',
        appUrl: `https://mock-app-url.com/${file.name}`,
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file),
      } as UploadedFile;

      // Simulate upload progress
      let progress = 0;

      const simulateProgress = async () => {
        while (progress < 100) {
          await new Promise((resolve) => setTimeout(resolve, 50));
          progress += 2;
          setProgress(Math.min(progress, 100));
        }
      };

      await simulateProgress();

      setUploadedFile(mockUploadedFile);

      return mockUploadedFile;
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

export const { uploadFiles, useUploadThing } =
  generateReactHelpers<OurFileRouter>();

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

export function showErrorToast(err: unknown) {
  const errorMessage = getErrorMessage(err);

  return toast.error(errorMessage);
}
