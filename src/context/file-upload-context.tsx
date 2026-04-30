'use client';

import * as React from 'react';

import type { UploadError } from '@platejs/media/react';

export type UploadResultLike = {
  appUrl?: string;
  download?: string | null;
  id?: number | string;
  key?: string;
  mediumUrl?: string;
  name?: string;
  originalUrl?: string;
  path?: string;
  size?: number;
  smallUrl?: string;
  thumbUrl?: string;
  type?: string;
  url?: string;
};

export interface FileUploadContextValue<T = UploadResultLike> {
  onUploadFile?: (file: File) => Promise<T>;
  onUploadValidateError?: (error: UploadError) => void;
}

export const FileUploadContext = React.createContext<FileUploadContextValue>({
  onUploadFile: undefined,
  onUploadValidateError: undefined,
});
