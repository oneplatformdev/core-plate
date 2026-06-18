import { useMemo } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { type Value } from 'platejs';
import { Plate, usePlateEditor } from 'platejs/react';

import { CharCounterOverlay } from '@/components/char-counter-kit';
import { createEditorKit } from '@/components/editor-kit';
import { Editor, EditorContainer } from '@/components/ui/editor';
import { FixedToolbar } from '@/components/ui/fixed-toolbar';
import { FixedToolbarButtons } from '@/components/ui/fixed-toolbar-buttons';
import { defaultPlateMessages, ukPlateMessages } from '@/i18n/messages';
import { PlateI18nProvider } from '@/i18n/provider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { FileUploadContext, type UploadResultLike, type UploadOptions } from '@/context/file-upload-context';

// Sandbox-only fake uploader: returns a local object URL so paste-from-google-docs
// and toolbar uploads render without a real backend.
const fakeUploadFile = async (
  file: File,
  options?: UploadOptions
): Promise<UploadResultLike> => {
  const url = URL.createObjectURL(file);
  const steps = [10, 35, 65, 90, 100];
  for (const p of steps) {
    await new Promise((r) => setTimeout(r, 120));
    options?.onProgress?.(p);
  }
  return {
    url,
    appUrl: url,
    originalUrl: url,
    name: file.name,
    size: file.size,
    type: file.type,
    key: `sandbox-${Date.now()}-${file.name}`,
  };
};

type FeedSplitEditorProps = {
  value: Value;
  onChangeValues: (next: Value) => void;
};

export function FeedSplitEditor({ value, onChangeValues }: FeedSplitEditorProps) {
  const messages = ukPlateMessages ?? defaultPlateMessages;
  const plugins = useMemo(
    () =>
      createEditorKit(messages.typeSomethingPlaceholder, {
        maxLength: 2500,
      }).filter((p: any) => p.key !== 'fixed-toolbar'),
    [messages.typeSomethingPlaceholder]
  );

  const editor = usePlateEditor(
    {
      plugins,
      value,
    },
    [plugins]
  );

  if (!editor) return null;

  return (
    <PlateI18nProvider locale="uk" messages={messages}>
      <TooltipProvider delayDuration={0}>
        <FileUploadContext.Provider value={{ onUploadFile: fakeUploadFile }}>
        <DndProvider backend={HTML5Backend}>
          <Plate
            editor={editor}
            onValueChange={({ value: nextValue }) => onChangeValues(nextValue)}
          >
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%' }}>
              <FixedToolbar>
                <FixedToolbarButtons />
              </FixedToolbar>

              <EditorContainer
                variant="default"
                className="h-full min-h-0 overflow-y-auto overflow-x-hidden"
              >
                <Editor variant="none" className="px-16 pt-4 pb-24 text-base sm:px-[max(64px,calc(50%-350px))]" />
                <CharCounterOverlay maxLength={2500} />
              </EditorContainer>
            </div>
          </Plate>
        </DndProvider>
        </FileUploadContext.Provider>
      </TooltipProvider>
    </PlateI18nProvider>
  );
}

