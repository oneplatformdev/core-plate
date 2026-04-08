import type { OurFileRouter } from '@op/modules/plate/api/uploadthing/route';
import { generateReactHelpers } from '@uploadthing/react';
import React, { useContext } from 'react';
import type { ClientUploadedFileData, UploadFilesOptions, } from 'uploadthing/types';
import { z } from 'zod';
import { useNotify } from "@oneplatformdev/ui/Toast";

import { FileUploadContext } from "@op/modules/plate/context/FileUploadContext.ts";

import { useUploadState } from '../hooks/use-upload-state';

export interface UploadedFile<T = unknown> extends ClientUploadedFileData<T> {}

interface UseUploadFileProps
  extends Pick<
    UploadFilesOptions<OurFileRouter, keyof OurFileRouter>,
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
  const [uploadedFile, setUploadedFile] = React.useState<UploadedFile>();
  const [uploadingFile, setUploadingFile] = React.useState<File>();
  const [progress, setProgress] = React.useState<number>(0);
  const [isUploading, setIsUploading] = React.useState(false);
  const { onUploadFile } = useContext(FileUploadContext);
  const { setGlobalUploading } = useUploadState();
  const { notifyToast } = useNotify();

  async function uploadThing(file: File) {
    setIsUploading(true);
    setGlobalUploading(true);
    setUploadingFile(file);

    try {
      try {
        const uploadRes = await uploadFiles('editorUploader', {
          ...props,
          files: [file],
          onUploadProgress: ({ progress }) => {
            setProgress(Math.min(progress, 100));
          },
        });
        console.log('uploadRes[0]', uploadRes[0]);
      } catch (err) {
        console.error(err);
      }

      const res = await onUploadFile?.(file);

      if (!res || ('isError' in res && res.isError)) {
        const message = res && 'message' in res && typeof res.message === 'string' && res.message
          ? res.message
          : 'File upload failed';
        throw new Error(message);
      }

      const fileRes: UploadedFile = {
        key: res.name || 'mock-key-0',
        appUrl: `https://mock-app-url.com/${file.name}`,
        name: file.name,
        size: file.size,
        type: file.type,
        url: res.originalUrl || URL.createObjectURL(file),
        serverData: undefined,
        customId: String(res.id),
        fileHash: ''
      };

      setUploadedFile(fileRes);
      onUploadComplete?.(fileRes);
      setProgress(100);

      return uploadedFile;
    } catch (error) {
      const errorMessage = getErrorMessage(error);

      const message =
        errorMessage.length > 0
          ? errorMessage
          : 'Something went wrong, please try again later.';

      notifyToast(message, 'destructive');

      onUploadError?.(error);
      setUploadedFile(undefined);
      return;
    } finally {
      setProgress(0);
      setIsUploading(false);
      setGlobalUploading(false);
      setUploadingFile(undefined);
    }
  }

  return {
    isUploading,
    progress,
    uploadFile: uploadThing,
    uploadedFile,
    uploadingFile,
  };
}

export const { uploadFiles, useUploadThing } =
  generateReactHelpers<OurFileRouter>();

export function getErrorMessage(err: unknown) {
  const unknownError = 'Something went wrong, please try again later.';

  if (err instanceof z.ZodError) {
    const errors = err.issues.map((issue) => {
      return issue.message;
    });

    return errors.join('\n');
  } else if (err instanceof Error) {
    return err.message;
  } else {
    return unknownError;
  }
}

