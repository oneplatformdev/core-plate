'use client';

import * as React from 'react';

import type { UploadError } from '@platejs/media/react';

import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { normalizeStaticValue, type Value } from 'platejs';
import { Plate, usePlateEditor } from 'platejs/react';

import {
  createEditorKit,
} from '@/components/editor-kit';
import { FileUploadContext, type UploadResultLike } from '@/context/file-upload-context';
import { defaultPlateMessages, type PlateMessages, ukPlateMessages } from '@/i18n/messages';
import { PlateI18nProvider } from '@/i18n/provider';
import { Editor, EditorContainer, type EditorProps } from '@/components/ui/editor';
import { TooltipProvider } from '@/components/ui/tooltip';

const defaultValue = normalizeStaticValue([
  {
    children: [{ text: '' }],
    type: 'p',
  },
]);

export type PlateEditorProps = {
  contentRef?: React.Ref<HTMLDivElement>;
  children?: React.ReactNode;
  className?: string;
  containerClassName?: string;
  containerVariant?: 'comment' | 'default' | 'demo' | 'select';
  editorClassName?: string;
  editorVariant?: EditorProps['variant'];
  initialValue?: Value;
  isSimpleEditor?: boolean;
  onChangeDebounceMs?: number;
  onChangeValues?: (value: Value) => void;
  onUploadFile?: (file: File) => Promise<UploadResultLike>;
  onUploadValidateError?: (error: UploadError) => void;
  pinToolbarProps?: unknown;
  locale?: 'en' | 'uk';
  messages?: PlateMessages;
  value?: Value;
} & Pick<EditorProps, 'autoFocus' | 'placeholder' | 'readOnly'>;

export function PlateEditor({
  contentRef,
  autoFocus,
  children,
  className,
  containerClassName,
  containerVariant = 'default',
  editorClassName,
  editorVariant = 'default',
  initialValue,
  isSimpleEditor,
  onChangeDebounceMs = 150,
  onChangeValues,
  onUploadFile,
  onUploadValidateError,
  placeholder,
  pinToolbarProps,
  locale = 'uk',
  messages,
  readOnly,
  value,
}: PlateEditorProps) {
  void isSimpleEditor;
  void pinToolbarProps;

  const baseMessages = locale === 'uk' ? ukPlateMessages : defaultPlateMessages;
  const mergedMessages = React.useMemo(
    () => ({ ...baseMessages, ...(messages ?? {}) }),
    [baseMessages, messages]
  );
  const effectivePlaceholder = placeholder ?? mergedMessages.typeSomethingPlaceholder;

  const initialEditorValueRef = React.useRef<Value>(
    value ?? initialValue ?? defaultValue
  );
  const onChangeValuesRef = React.useRef(onChangeValues);
  const debounceTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const pendingValueRef = React.useRef<Value | null>(null);

  React.useEffect(() => {
    onChangeValuesRef.current = onChangeValues;
  }, [onChangeValues]);

  React.useEffect(
    () => () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      if (pendingValueRef.current) {
        onChangeValuesRef.current?.(pendingValueRef.current);
      }
    },
    []
  );

  const editorPlugins = React.useMemo(
    () => createEditorKit(effectivePlaceholder),
    [effectivePlaceholder]
  );

  const editor = usePlateEditor(
    {
      plugins: editorPlugins,
      value: initialEditorValueRef.current,
    },
    [editorPlugins]
  );

  if (!editor) return null;

  return (
    <PlateI18nProvider locale={locale} messages={messages}>
      <FileUploadContext.Provider value={{ onUploadFile, onUploadValidateError }}>
        <TooltipProvider delayDuration={0}>
          <div
            role="toolbar-wrapper"
            className="relative box-border min-h-full overflow-visible"
          >
            <DndProvider backend={HTML5Backend}>
              <Plate
                editor={editor}
                onValueChange={({ value: nextValue }) => {
                  if (!onChangeValuesRef.current) return;

                  if (onChangeDebounceMs <= 0) {
                    onChangeValuesRef.current(nextValue);
                    return;
                  }

                  pendingValueRef.current = nextValue;

                  if (debounceTimeoutRef.current) {
                    clearTimeout(debounceTimeoutRef.current);
                  }

                  debounceTimeoutRef.current = setTimeout(() => {
                    if (!pendingValueRef.current) return;

                    onChangeValuesRef.current?.(pendingValueRef.current);
                    pendingValueRef.current = null;
                    debounceTimeoutRef.current = null;
                  }, onChangeDebounceMs);
                }}
              >
                <EditorContainer className={containerClassName} variant={containerVariant}>
                  <Editor
                    autoFocus={autoFocus}
                    className={editorClassName ?? className}
                    placeholder={effectivePlaceholder}
                    readOnly={readOnly}
                    ref={contentRef}
                    variant={editorVariant}
                  />
                </EditorContainer>

                {children}
              </Plate>
            </DndProvider>
          </div>
        </TooltipProvider>
      </FileUploadContext.Provider>
    </PlateI18nProvider>
  );
}
