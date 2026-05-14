import { useState } from 'react';
import { type Value } from 'platejs';

import { PlateEditor, StaticEditor } from '@oneplatformdev/plate';

import { demoValue } from './demo-value';

type SandboxHomeProps = {
  onOpenFeedCreate: () => void;
};

export function SandboxHome({ onOpenFeedCreate }: SandboxHomeProps) {
  const [locale, setLocale] = useState<'en' | 'uk'>('uk');
  const [isStatic, setIsStatic] = useState(false);
  const [editorValue, setEditorValue] = useState<Value>(demoValue);

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
          onClick={() => setIsStatic((prev) => !prev)}
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
          Mode: {isStatic ? 'Static' : 'Editor'}
        </button>
      </div>

      {isStatic ? (
        <StaticEditor value={editorValue} />
      ) : (
        <PlateEditor
          initialValue={editorValue}
          locale={locale}
          onChangeDebounceMs={0}
          onChangeValues={setEditorValue}
        />
      )}
    </div>
  );
}
