'use client';

import React, {
  Component,
  type ReactNode,
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';

// markmap-lib 用于转换，markmap-view 用于渲染
import { Transformer } from 'markmap-lib';
import { Markmap } from 'markmap-view';

// ============================================================================
// Markmap 渲染错误边界
// ============================================================================
interface MarkmapErrorBoundaryProps {
  children: ReactNode;
  code?: string;
  fallback?: (error: Error) => ReactNode;
}

interface MarkmapErrorBoundaryState {
  error: Error | null;
  hasError: boolean;
}

class MarkmapRenderErrorBoundary extends Component<
  MarkmapErrorBoundaryProps,
  MarkmapErrorBoundaryState
> {
  constructor(props: MarkmapErrorBoundaryProps) {
    super(props);
    this.state = { error: null, hasError: false };
  }

  static getDerivedStateFromError(error: Error): MarkmapErrorBoundaryState {
    return { error, hasError: true };
  }

  componentDidUpdate(prevProps: MarkmapErrorBoundaryProps) {
    if (prevProps.code !== this.props.code) {
      this.setState({ error: null, hasError: false });
    }
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return this.props.fallback?.(this.state.error) ?? null;
    }
    return this.props.children;
  }
}

// ============================================================================
// Markmap 渲染失败时的 Fallback UI
// ============================================================================
const ErrorFallback = memo<{ error: Error }>(({ error }) => {
  const errorMsg = error.message || 'Markmap 渲染失败，请检查 Markdown 语法';
  return (
    <div
      style={{
        background: 'rgba(255, 77, 79, 0.08)',
        border: '1px solid rgba(255, 77, 79, 0.3)',
        borderRadius: 8,
        padding: 16,
        width: '100%',
      }}
    >
      <div style={{ color: '#ff4d4f', fontSize: 14, fontWeight: 500, marginBottom: 8 }}>
        ⚠️ Markmap 渲染失败
      </div>
      <div
        style={{
          color: '#ff7875',
          fontSize: 12,
          lineHeight: 1.6,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
        }}
      >
        {errorMsg}
      </div>
    </div>
  );
});

// ============================================================================
// 全屏 SVG 预览浮层（缩放 + 拖拽 + 工具栏）
// ============================================================================
const MIN_SCALE = 0.2;
const MAX_SCALE = 10;
const SCALE_STEP = 0.25;
const clampScale = (v: number) => Math.min(Math.max(MIN_SCALE, v), MAX_SCALE);

const SvgPreviewOverlay: React.FC<{ onClose: () => void; svg: string }> = ({ onClose, svg }) => {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const hasDraggedRef = useRef(false);
  const backdropRef = useRef<HTMLDivElement>(null);

  const zoomIn = useCallback(() => setScale((s) => clampScale(s + SCALE_STEP)), []);
  const zoomOut = useCallback(() => setScale((s) => clampScale(s - SCALE_STEP)), []);
  const resetZoom = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  // Wheel zoom
  useEffect(() => {
    const el = backdropRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      setScale((prev) => clampScale(prev * (e.deltaY > 0 ? 0.9 : 1.1)));
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []);

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // ESC to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Drag handlers — all on the content element via setPointerCapture
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    hasDraggedRef.current = false;
    lastPosRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastPosRef.current.x;
      const dy = e.clientY - lastPosRef.current.y;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
        hasDraggedRef.current = true;
      }
      lastPosRef.current = { x: e.clientX, y: e.clientY };
      setOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
    },
    [dragging],
  );

  const handlePointerUp = useCallback(() => {
    setDragging(false);
  }, []);

  const handleBackdropClick = useCallback(() => {
    if (hasDraggedRef.current) {
      hasDraggedRef.current = false;
      return;
    }
    onClose();
  }, [onClose]);

  const pct = `${Math.round(scale * 100)}%`;

  const btnBase: React.CSSProperties = {
    alignItems: 'center',
    background: 'rgba(255,255,255,0.15)',
    border: 'none',
    borderRadius: 4,
    color: '#fff',
    cursor: 'pointer',
    display: 'inline-flex',
    fontSize: 14,
    height: 32,
    justifyContent: 'center',
    lineHeight: 1,
    minWidth: 32,
    padding: '0 8px',
  };

  return createPortal(
    <div
      onClick={handleBackdropClick}
      ref={backdropRef}
      style={{
        alignItems: 'center',
        background: 'rgba(0, 0, 0, 0.65)',
        display: 'flex',
        inset: 0,
        justifyContent: 'center',
        position: 'fixed',
        zIndex: 1080,
      }}
    >
      {/* Close button (top-right) */}
      <button
        aria-label="Close preview"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        style={{
          ...btnBase,
          background: 'rgba(255,255,255,0.12)',
          height: 40,
          minWidth: 40,
          position: 'absolute',
          right: 16,
          top: 16,
          zIndex: 2,
        }}
        type="button"
      >
        <svg
          fill="none"
          height="18"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width="18"
        >
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>

      {/* SVG content (draggable + zoomable) */}
      <div
        onClick={(e) => e.stopPropagation()}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{
          background: '#fff',
          borderRadius: 8,
          cursor: dragging ? 'grabbing' : 'grab',
          padding: 24,
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          transformOrigin: 'center center',
          userSelect: 'none',
        }}
      >
        <div dangerouslySetInnerHTML={{ __html: svg }} style={{ pointerEvents: 'none' }} />
      </div>

      {/* Bottom toolbar */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          alignItems: 'center',
          background: 'rgba(0, 0, 0, 0.55)',
          borderRadius: 8,
          bottom: 24,
          display: 'flex',
          gap: 4,
          left: '50%',
          padding: '4px 8px',
          position: 'absolute',
          transform: 'translateX(-50%)',
          zIndex: 2,
        }}
      >
        <button
          aria-label="Zoom out"
          disabled={scale <= MIN_SCALE}
          onClick={zoomOut}
          style={{ ...btnBase, opacity: scale <= MIN_SCALE ? 0.4 : 1 }}
          type="button"
        >
          <svg
            fill="none"
            height="16"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            width="16"
          >
            <path d="M5 12h14" />
          </svg>
        </button>

        <button
          aria-label="Reset zoom"
          onClick={resetZoom}
          style={{ ...btnBase, fontFamily: 'monospace', minWidth: 56, userSelect: 'none' }}
          type="button"
        >
          {pct}
        </button>

        <button
          aria-label="Zoom in"
          disabled={scale >= MAX_SCALE}
          onClick={zoomIn}
          style={{ ...btnBase, opacity: scale >= MAX_SCALE ? 0.4 : 1 }}
          type="button"
        >
          <svg
            fill="none"
            height="16"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            width="16"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>
    </div>,
    document.body,
  );
};

// ============================================================================
// 带完整错误处理的 Markmap 包装组件
// ============================================================================
interface MarkmapWithErrorBoundaryProps {
  children: string;
  enableImagePreview?: boolean;
}

/**
 * 带完整错误处理的 Markmap 包装组件
 *
 * 错误捕获层级：
 * 1. 预解析检测：Transformer.transform() 转换 Markdown 为 markmap 数据
 * 2. 渲染错误边界：Class ErrorBoundary 捕获 React 渲染期间的错误
 * 3. 代码变化时自动重置错误状态
 */
const MarkmapWithErrorBoundary = memo<MarkmapWithErrorBoundaryProps>(
  ({ children, enableImagePreview = true }) => {
    const markdown = children.trim();
    const containerRef = useRef<HTMLDivElement>(null);
    const markmapRef = useRef<Markmap | null>(null);
    const [error, setError] = useState<Error | null>(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [svgContent, setSvgContent] = useState<string>('');

    // 使用 markmap-lib 和 markmap-view 渲染
    useEffect(() => {
      let canceled = false;
      setError(null);
      setSvgContent('');

      if (!markdown || !containerRef.current) return;

      try {
        // 1. 创建 Transformer 实例
        const transformer = new Transformer();

        // 2. 将 Markdown 转换为 markmap 数据
        const { root } = transformer.transform(markdown);

        if (!root) {
          throw new Error('无法解析 Markdown 内容');
        }

        // 3. 清理之前的实例
        if (markmapRef.current) {
          markmapRef.current.destroy();
          markmapRef.current = null;
        }

        // 4. 在容器内创建 SVG 元素
        const container = containerRef.current;
        container.innerHTML = '';
        const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svgElement.style.width = '100%';
        svgElement.style.minHeight = '300px';
        container.append(svgElement);

        // 5. 创建新的 markmap 实例并渲染
        const markmap = new Markmap(svgElement);
        markmapRef.current = markmap;

        // 6. 设置数据并渲染
        markmap.setData(root);

        // 7. 适配大小
        requestAnimationFrame(() => {
          markmap.fit();
        });

        // 8. 延迟获取 SVG 内容（等待渲染完成）
        setTimeout(() => {
          if (!canceled && containerRef.current) {
            const svg = containerRef.current.querySelector('svg');
            if (svg) {
              setSvgContent(svg.outerHTML);
            }
          }
        }, 500);
      } catch (error_) {
        if (!canceled) {
          setError(error_ instanceof Error ? error_ : new Error(String(error_)));
        }
      }

      return () => {
        canceled = true;
        if (markmapRef.current) {
          markmapRef.current.destroy();
          markmapRef.current = null;
        }
      };
    }, [markdown]);

    const handlePreviewClick = useCallback(
      (e: React.MouseEvent) => {
        if (!enableImagePreview) return;
        e.stopPropagation();
        setPreviewOpen(true);
      },
      [enableImagePreview],
    );

    const handlePreviewClose = useCallback(() => setPreviewOpen(false), []);

    if (!markdown) {
      return null;
    }

    if (error) {
      return <ErrorFallback error={error} />;
    }

    return (
      <MarkmapRenderErrorBoundary code={markdown} fallback={(err) => <ErrorFallback error={err} />}>
        <div
          onClick={svgContent ? handlePreviewClick : undefined}
          ref={containerRef}
          style={{
            cursor: enableImagePreview && svgContent ? 'zoom-in' : undefined,
            minHeight: 200,
            padding: 16,
            width: '100%',
          }}
        />
        {previewOpen && svgContent && <SvgPreviewOverlay onClose={handlePreviewClose} svg={svgContent} />}
      </MarkmapRenderErrorBoundary>
    );
  },
);

MarkmapWithErrorBoundary.displayName = 'MarkmapWithErrorBoundary';

export default MarkmapWithErrorBoundary;
