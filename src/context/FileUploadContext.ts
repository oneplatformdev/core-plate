import { createContext } from "react";

export interface IMedia {
	id: number;
	originalSize: string;
	name: string;
	mimetype: string;
	originalUrl: string;
	thumbUrl: string;
	smallUrl: string;
	mediumUrl: string;
	created_at: string;
}

export interface IFile {
	id: string;
	name?: string;
	path: string;
	download: string | null;
	mimetype: string;
	size: number;
	createdAt: string;
	duration?: number;
	originalUrl: string;
	mediumUrl: string;
	smallUrl: string;
}

export interface IFileUploadContextValue<T = IFile | IMedia> {
  onUploadFile?: (file: File) => Promise<T>;
}

const defaultValue: IFileUploadContextValue<IFile | IMedia> = {
  onUploadFile: async (file: File) => {
    console.log("onUploadFile => file", file);
    return {} as IFile | IMedia;
  },
};

export const FileUploadContext = createContext<IFileUploadContextValue<IFile | IMedia>>(defaultValue);
