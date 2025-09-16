import { createContext } from "react";

export interface UploadStateContextValue {
  globalUploading: boolean;
  setGlobalUploading: React.Dispatch<React.SetStateAction<boolean>>;
}

export const UploadStateContext = createContext<UploadStateContextValue | undefined>(undefined);
