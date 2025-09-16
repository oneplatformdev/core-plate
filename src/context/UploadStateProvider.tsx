import { useState } from "react";

import { UploadStateContext } from "./UploadStateContext";


export const UploadStateProvider = ({ children }: { children: React.ReactNode }) => {
  const [globalUploading, setGlobalUploading] = useState(false);

  return (
    <UploadStateContext.Provider value={{ globalUploading, setGlobalUploading }}>
      {children}
    </UploadStateContext.Provider>
  );
};
