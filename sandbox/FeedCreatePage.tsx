import { ArrowLeft } from 'lucide-react';
import { useMemo, useState } from 'react';
import { type Value } from 'platejs';

import { demoValue } from './demo-value';
import { FeedSplitEditor } from './FeedSplitEditor';

type FeedCreatePageProps = {
  onBack: () => void;
};

type FeedCreateComponentProps = {
  title: string;
  onTitleChange: (next: string) => void;
  content: Value;
  onContentChange: (next: Value) => void;
};

function ContainerLayout(props: { children: React.ReactNode }) {
  const { children } = props;

  return (
    <div
      style={{
        background: '#f3f4f6',
        minHeight: '100vh',
        padding: 16,
        boxSizing: 'border-box',
      }}
    >
      {children}
    </div>
  );
}

function FeedCreateComponent(props: FeedCreateComponentProps) {
  const { title, onTitleChange, content, onContentChange } = props;
  const counter = useMemo(() => `${title.length} / 255`, [title.length]);

  return (
    <div
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: 14,
        background: '#fff',
        display: 'grid',
        gridTemplateColumns: '1fr 380px',
        gap: 0,
        height: 'calc(100vh - 120px)',
        minHeight: 420,
        overflow: 'hidden',
      }}
    >
      <style>{`
        .feed-create-plate {
          height: 100%;
          min-height: 0;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          overflow-x: hidden;
        }

        .feed-create-plate .op-plate-scope {
          height: fit-content;
          min-height: 0;
          display: flex;
          flex-direction: column;
          overflow: visible;
        }

        .feed-create-plate .op-plate-scope > .relative {
          height: fit-content;
          min-height: 0;
          display: grid;
          grid-template-rows: auto minmax(0, 1fr);
          overflow: visible;
        }

        .feed-create-plate [role="toolbar-wrapper"] {
          grid-row: 1;
          position: sticky;
          top: 0;
          z-index: 20;
          background: #fff;
          min-height: auto !important;
          height: auto !important;
          flex: 0 0 auto;
          border-bottom: 1px solid #eef0f2;
        }

        .feed-create-plate [data-slate-editor],
        .feed-create-plate .slate-editor {
          grid-row: 2;
          min-height: 100%;
          height: fit-content;
          max-height: none;
          padding-bottom: 1.5rem !important;
          overflow: visible;
        }
      `}</style>
      <div
        style={{
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          padding: 16,
          borderRight: '1px solid #eef0f2',
        }}
      >
        <label style={{ fontWeight: 600, fontSize: 14 }}>
          Заголовок *
        </label>
        <input
          value={title}
          onChange={(e) => onTitleChange(e.target.value.slice(0, 255))}
          placeholder="Введіть заголовок"
          style={{
            height: 46,
            borderRadius: 10,
            border: '1px solid #d4d4d8',
            padding: '0 14px',
            fontSize: 16,
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />

        <div style={{ textAlign: 'right', color: '#6b7280', fontSize: 14 }}>{counter}</div>

        <div style={{ minHeight: 0, flex: 1, overflow: 'hidden' }} className="feed-create-plate">
          <FeedSplitEditor value={content} onChangeValues={onContentChange} />
        </div>
      </div>

      <div
        style={{
          padding: 16,
          background: '#fff',
          overflowY: 'auto',
        }}
      >
        <h3 style={{ margin: '0 0 12px', fontSize: 24 }}>Загальні налаштування</h3>
        <div
          style={{
            border: '1px dashed #c4b5fd',
            borderRadius: 12,
            padding: 20,
            marginBottom: 16,
            color: '#6b7280',
          }}
        >
          Обкладинка / ініціатор / категорія / доступ
        </div>
      </div>
    </div>
  );
}

export function FeedCreatePage({ onBack }: FeedCreatePageProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState<Value>(demoValue);

  return (
    <ContainerLayout>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 12,
        }}
      >
        <button
          type="button"
          onClick={onBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 34,
            height: 34,
            borderRadius: 8,
            border: '1px solid #d4d4d8',
            background: '#fff',
            cursor: 'pointer',
          }}
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </button>
        <h2 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>Створити новину</h2>
      </div>

      <FeedCreateComponent
        title={title}
        onTitleChange={setTitle}
        content={content}
        onContentChange={setContent}
      />
    </ContainerLayout>
  );
}

