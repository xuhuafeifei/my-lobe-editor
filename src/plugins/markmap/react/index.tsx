'use client';

import { $getNodeByKey, type LexicalEditor } from 'lexical';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';

import { useLexicalComposerContext } from '@/editor-kernel/react/react-context';

import { $isMarkmapNode, MarkmapNode } from '../node';
import { MarkmapPlugin } from '../plugin';
import { MarkmapEditor } from './MarkmapEditor';
import { MarkmapPreview } from './MarkmapPreview';

export interface ReactMarkmapPluginProps {
  className?: string;
  theme?: {
    markmap?: string;
  };
}

function MarkmapDecorator({
  className,
  editor: lexicalEditor,
  node,
}: {
  className?: string;
  editor: LexicalEditor;
  node: MarkmapNode;
}) {
  const [editing, setEditing] = useState(false);
  const markdown = node.__markdown;

  useLayoutEffect(() => {
    const key = node.getKey();
    let shouldOpen = false;
    lexicalEditor.getEditorState().read(() => {
      const latest = $getNodeByKey(key);
      if (latest && $isMarkmapNode(latest) && latest.__autoOpenEditor) shouldOpen = true;
    });
    if (shouldOpen) {
      setEditing(true);
      lexicalEditor.update(() => {
        const latest = $getNodeByKey(key);
        if (latest && $isMarkmapNode(latest) && latest.__autoOpenEditor) {
          latest.clearAutoOpenEditor();
        }
      });
    }
  }, [lexicalEditor, node.getKey()]);

  const handleDelete = useCallback(() => {
    lexicalEditor.update(() => {
      const latest = node.getLatest();
      const next = latest.getNextSibling();
      const prev = latest.getPreviousSibling();
      latest.remove();
      if (next) {
        next.selectStart();
        return;
      }
      if (prev) {
        prev.selectEnd();
      }
    });
  }, [lexicalEditor, node]);

  const handleSave = useCallback(
    (newMarkdown: string) => {
      lexicalEditor.update(() => {
        node.updateMarkdown(newMarkdown);
      });
      setEditing(false);
    },
    [lexicalEditor, node],
  );

  if (editing) {
    return (
      <div className={className}>
        <MarkmapEditor markdown={markdown} onClose={() => setEditing(false)} onSave={handleSave} />
      </div>
    );
  }

  return (
    <div className={className} style={{ margin: '8px 0', position: 'relative' }}>
      {/* HUD buttons */}
      <div
        style={{
          bottom: 8,
          display: 'flex',
          gap: 4,
          position: 'absolute',
          right: 8,
          zIndex: 10,
        }}
      >
        <button
          onClick={() => setEditing(true)}
          style={{
            background: 'rgba(0,0,0,0.5)',
            border: 'none',
            borderRadius: 4,
            color: '#fff',
            cursor: 'pointer',
            fontSize: 12,
            padding: '4px 8px',
          }}
          type="button"
        >
          编辑
        </button>
        <button
          onClick={handleDelete}
          style={{
            background: 'rgba(255,77,79,0.7)',
            border: 'none',
            borderRadius: 4,
            color: '#fff',
            cursor: 'pointer',
            fontSize: 12,
            padding: '4px 8px',
          }}
          type="button"
        >
          删除
        </button>
      </div>
      <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, height: 350 }}>
        <MarkmapPreview markdown={markdown} />
      </div>
    </div>
  );
}

export function ReactMarkmapPlugin({ className, theme }: ReactMarkmapPluginProps) {
  const [editor] = useLexicalComposerContext();

  const decorator = useCallback(
    (node: MarkmapNode, lexicalEditor: LexicalEditor) => {
      return <MarkmapDecorator className={className} editor={lexicalEditor} node={node} />;
    },
    [className],
  );

  const registeredRef = useRef(false);
  if (!registeredRef.current) {
    registeredRef.current = true;
    editor.registerPlugin(MarkmapPlugin, { decorator, theme });
  }

  return null;
}
