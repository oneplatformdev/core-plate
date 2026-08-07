import { useState } from 'react';
import { type Value } from 'platejs';

import { PlateEditor, StaticEditor } from '@oneplatformdev/plate';

import { demoValue } from './demo-value';

type SandboxHomeProps = {
  onOpenFeedCreate: () => void;
  onOpenTablePreview: () => void;
};

export function SandboxHome({
  onOpenFeedCreate,
  onOpenTablePreview,
}: SandboxHomeProps) {
  const [locale, setLocale] = useState<'en' | 'uk'>('uk');
  const [mode, setMode] = useState<'editor' | 'readonly' | 'static'>('editor');
  const [editorValue, setEditorValue] = useState<Value>(demoValue);

  const nextMode =
    mode === 'editor' ? 'readonly' : mode === 'readonly' ? 'static' : 'editor';

  return (
    <div style={{ padding: 16 }}>
      <div style={{ marginBottom: 12 }}>
        <button
          type="button"
          onClick={onOpenFeedCreate}
          style={{
            border: '1px solid #d4d4d8',
            borderRadius: 8,
            background: '#ffffff',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            padding: '8px 12px',
          }}
        >
          Open FeedCreate Layout
        </button>

        <button
          type="button"
          onClick={onOpenTablePreview}
          style={{
            border: '1px solid #d4d4d8',
            borderRadius: 8,
            background: '#ffffff',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            marginLeft: 8,
            padding: '8px 12px',
          }}
        >
          Open Wide Table Prototype
        </button>
      </div>

      <div style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
        <button
          type="button"
          onClick={() => setLocale((prev) => (prev === 'uk' ? 'en' : 'uk'))}
          style={{
            border: '1px solid #d4d4d8',
            borderRadius: 8,
            background: '#ffffff',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            padding: '6px 10px',
          }}
        >
          Preview locale: {locale.toUpperCase()}
        </button>

        <button
          type="button"
          onClick={() => setMode(nextMode)}
          style={{
            border: '1px solid #d4d4d8',
            borderRadius: 8,
            background: '#ffffff',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            padding: '6px 10px',
          }}
        >
          Mode: {mode} (tap to cycle)
        </button>
      </div>

      {mode === 'static' ? (
        <StaticEditor value={editorValue} />
      ) : (
        <PlateEditor
          key={mode}
          initialValue={editorValue}
          locale={locale}
          maxLength={500_000}
          readOnly={mode === 'readonly'}
          onChangeDebounceMs={0}
          onChangeValues={setEditorValue}
        />
      )}
    </div>
  );
}
