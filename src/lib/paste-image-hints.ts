// Small module-level registry that lets the Google-Docs-paste flow tell the
// placeholder UI what dimensions to reserve for each image while it uploads.
// Without these hints the placeholder would render at 0 height until the
// browser decodes the file, causing the editor to scroll-jump as each image
// pops in.

export type ImageDims = { width: number; height: number };

const hints = new Map<string, ImageDims>();

export const pasteImageHints = {
  set(id: string, dims: ImageDims) {
    hints.set(id, dims);
  },
  get(id: string): ImageDims | undefined {
    return hints.get(id);
  },
  delete(id: string) {
    hints.delete(id);
  },
};

// Read natural dimensions of a File without inserting it into the DOM.
export const measureImageFile = (file: File): Promise<ImageDims | null> =>
  new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    const done = (dims: ImageDims | null) => {
      URL.revokeObjectURL(url);
      resolve(dims);
    };
    img.onload = () => {
      if (img.naturalWidth && img.naturalHeight) {
        done({ width: img.naturalWidth, height: img.naturalHeight });
      } else {
        done(null);
      }
    };
    img.onerror = () => done(null);
    img.src = url;
  });
