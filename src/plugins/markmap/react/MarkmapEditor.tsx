'use client';

import { useCallback, useState } from 'react';

import { MarkmapPreview } from './MarkmapPreview';

interface MarkmapEditorProps {
  markdown: string;
  onClose: () => void;
  onSave: (markdown: string) => void;
}

export function MarkmapEditor({ markdown, onSave, onClose }: MarkmapEditorProps) {
  const [value, setValue] = useState(markdown);

  const handleSave = useCallback(() => {
    onSave(value);
    onClose();
  }, [onSave, onClose, value]);

  return (
    <div
      style={{
        background: '#fff',
        display: 'flex',
        flexDirection: 'column',
        inset: 0,
        position: 'fixed',
        zIndex: 9999,
      }}
    >
      {/* Header */}
      <div
        style={{
          alignItems: 'center',
          background: '#fafafa',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'space-between',
          padding: '12px 16px',
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 500 }}>Markmap 思维导图</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: '1px solid #d9d9d9',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 13,
              padding: '4px 12px',
            }}
            type="button"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            style={{
              background: '#1677ff',
              border: 'none',
              borderRadius: 4,
              color: '#fff',
              cursor: 'pointer',
              fontSize: 13,
              padding: '4px 16px',
            }}
            type="button"
          >
            保存
          </button>
        </div>
      </div>

      {/* Split view */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left: textarea */}
        <div style={{ borderRight: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', width: '50%' }}>
          <div style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0', color: '#8c8c8c', fontSize: 12, padding: '8px 12px' }}>
            Markdown 编辑器
          </div>
          <textarea
            onChange={(e) => setValue(e.target.value)}
            placeholder={'# 根节点\n## 分支 1\n### 子节点\n## 分支 2'}
            style={{
              border: 'none',
              flex: 1,
              fontFamily: 'monospace',
              fontSize: 14,
              lineHeight: 1.6,
              outline: 'none',
              padding: 16,
              resize: 'none',
            }}
            value={value}
          />
        </div>
        {/* Right: preview */}
        <div style={{ display: 'flex', flexDirection: 'column', width: '50%' }}>
          <MarkmapPreview markdown={value} />
        </div>
      </div>
    </div>
  );
}
