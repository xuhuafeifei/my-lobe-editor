'use client';

import { Transformer } from 'markmap-lib';
import { Markmap } from 'markmap-view';
import React, { useEffect, useRef, useState, useCallback } from 'react';

interface MarkmapPreviewProps {
  markdown: string;
}

const MIN_SCALE = 0.2;
const MAX_SCALE = 5;
const SCALE_STEP = 0.2;

export function MarkmapPreview({ markdown }: MarkmapPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const markmapRef = useRef<Markmap | null>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!containerRef.current || !markdown.trim()) return;

    try {
      const transformer = new Transformer();
      const { root } = transformer.transform(markdown);

      if (!root) return;

      const container = containerRef.current;
      container.innerHTML = '';
      const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svgElement.style.width = '100%';
      svgElement.style.height = '100%';
      container.append(svgElement);

      if (markmapRef.current) {
        markmapRef.current.destroy();
      }

      const markmap = new Markmap(svgElement);
      markmapRef.current = markmap;

      markmap.setData(root);
      requestAnimationFrame(() => {
        markmap.fit();
      });
    } catch {
      // silent
    }

    return () => {
      if (markmapRef.current) {
        markmapRef.current.destroy();
        markmapRef.current = null;
      }
    };
  }, [markdown]);

  const zoomIn = useCallback(() => setScale((s) => Math.min(MAX_SCALE, s + SCALE_STEP)), []);
  const zoomOut = useCallback(() => setScale((s) => Math.max(MIN_SCALE, s - SCALE_STEP)), []);
  const resetZoom = useCallback(() => setScale(1), []);

  const btnBase: React.CSSProperties = {
    alignItems: 'center',
    background: 'none',
    border: '1px solid #d9d9d9',
    borderRadius: 4,
    color: '#595959',
    cursor: 'pointer',
    display: 'flex',
    fontSize: 14,
    height: 28,
    justifyContent: 'center',
    padding: '0 8px',
  };

  if (!markdown.trim()) {
    return (
      <div style={{ alignItems: 'center', color: '#bfbfbf', display: 'flex', fontSize: 14, height: '100%', justifyContent: 'center' }}>
        在左侧输入 Markdown 标题语法生成思维导图
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', width: '100%' }}>
      {/* Toolbar */}
      <div style={{ alignItems: 'center', borderBottom: '1px solid #f0f0f0', display: 'flex', gap: 4, padding: '8px 12px' }}>
        <span style={{ color: '#8c8c8c', fontSize: 12 }}>预览</span>
        <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
          <button disabled={scale <= MIN_SCALE} onClick={zoomOut} style={{ ...btnBase, opacity: scale <= MIN_SCALE ? 0.4 : 1 }} type="button">−</button>
          <button onClick={resetZoom} style={{ ...btnBase, fontFamily: 'monospace', minWidth: 48 }} type="button">
            {Math.round(scale * 100)}%
          </button>
          <button disabled={scale >= MAX_SCALE} onClick={zoomIn} style={{ ...btnBase, opacity: scale >= MAX_SCALE ? 0.4 : 1 }} type="button">+</button>
        </div>
      </div>
      {/* Markmap container */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <div
          ref={containerRef}
          style={{
            height: '100%',
            minHeight: 300,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            width: '100%',
          }}
        />
      </div>
    </div>
  );
}
