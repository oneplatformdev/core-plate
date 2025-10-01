import { useContext } from "react";

import { UploadStateContext } from "@/context/UploadStateContext";

export const useUploadState = () => {
  const context = useContext(UploadStateContext);
  if (!context) {
    throw new Error("useUploadState must be used within an UploadStateProvider");
  }
  return context;
};
