import './index.css';

export { PlateEditor, type PlateEditorProps } from '@/components/core-plate-editor';
export { StaticEditor, type StaticEditorProps } from '@/components/core-plate-static-editor';
export { EditorKit, useEditor } from '@/components/editor-kit';
export type { EditorValue } from '@/components/plate-types';
export { Editor, EditorContainer, EditorView, type EditorProps } from '@/components/ui/editor';
export { defaultPlateMessages, ukPlateMessages, type PlateMessageKey, type PlateMessages } from '@/i18n/messages';
export { UploadErrorCode, type UploadError } from '@platejs/media/react';
