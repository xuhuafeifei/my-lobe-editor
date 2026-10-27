'use client';

import { $getRoot, type LexicalEditor } from 'lexical';
import { type FC, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { useLexicalEditor } from '@/editor-kernel/react/useLexicalEditor';
import type { IEditor } from '@/types';

import {
  acceptAllDiffOps,
  acceptDiffOp,
  rejectAllDiffOps,
  rejectDiffOp,
} from '../../command';
import { $isDiffHunkNode } from '../../node/DiffHunkNode';
import { styles } from '../style';

type PendingOp = { kind: string; opId: string };

type HoverState = {
  left: number;
  opId: string;
  top: number;
};

function readPending(lexical: LexicalEditor): PendingOp[] {
  const list: PendingOp[] = [];
  lexical.getEditorState().read(() => {
    for (const child of $getRoot().getChildren()) {
      if (!$isDiffHunkNode(child) && child.getType() !== 'diff-hunk') continue;
      const opId = $isDiffHunkNode(child)
        ? child.opId
        : String((child as { __opId?: string }).__opId ?? '');
      const kind = $isDiffHunkNode(child)
        ? child.kind
        : String((child as { __kind?: string }).__kind ?? '');
      if (opId) list.push({ kind, opId });
    }
  });
  return list;
}

function markActive(root: HTMLElement | null, opId: string | undefined) {
  if (!root) return;
  root.querySelectorAll('[data-diff-op-id]').forEach((el) => {
    el.classList.toggle('is-active', el.getAttribute('data-diff-op-id') === opId);
  });
}

function scrollToOp(root: HTMLElement | null, opId: string | undefined) {
  if (!root || !opId) return;
  const target = root.querySelector(`[data-diff-op-id="${opId}"]`) as HTMLElement | null;
  target?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function placeUnder(hunk: HTMLElement): HoverState | null {
  const opId = hunk.getAttribute('data-diff-op-id');
  if (!opId) return null;
  const rect = hunk.getBoundingClientRect();
  return {
    left: rect.left,
    opId,
    top: rect.bottom + 4,
  };
}

interface DiffReviewBarProps {
  editor: IEditor;
}

const DiffReviewBar: FC<DiffReviewBarProps> = ({ editor }) => {
  const [pending, setPending] = useState<PendingOp[]>([]);
  const [index, setIndex] = useState(0);
  const [lexical, setLexical] = useState<LexicalEditor | null>(null);
  const [hover, setHover] = useState<HoverState | null>(null);
  const hoverHunkRef = useRef<HTMLElement | null>(null);
  const hideTimerRef = useRef<number | null>(null);

  const refresh = useCallback((lex: LexicalEditor) => {
    const next = readPending(lex);
    setPending(next);
    setIndex((i) => (next.length === 0 ? 0 : Math.min(i, next.length - 1)));
    setHover((h) => {
      if (!h || !next.some((p) => p.opId === h.opId)) {
        hoverHunkRef.current = null;
        return null;
      }
      const el = hoverHunkRef.current;
      return el ? placeUnder(el) : h;
    });
  }, []);

  useLexicalEditor((lex) => {
    setLexical(lex);
    refresh(lex);
    return lex.registerUpdateListener(() => {
      refresh(lex);
    });
  }, [refresh]);

  const active = pending[index];

  useEffect(() => {
    markActive(editor.getRootElement(), active?.opId);
  }, [editor, active?.opId, pending]);

  const clearHideTimer = () => {
    if (hideTimerRef.current != null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  const scheduleHide = () => {
    clearHideTimer();
    hideTimerRef.current = window.setTimeout(() => {
      hoverHunkRef.current = null;
      setHover(null);
    }, 140);
  };

  const showActionsFor = useCallback(
    (hunk: HTMLElement) => {
      clearHideTimer();
      hoverHunkRef.current = hunk;
      const next = placeUnder(hunk);
      if (!next) return;
      setHover(next);
      setIndex((i) => {
        const idx = pending.findIndex((p) => p.opId === next.opId);
        return idx >= 0 ? idx : i;
      });
    },
    [pending],
  );

  useEffect(() => {
    const root = editor.getRootElement();
    if (!root || pending.length === 0) return;

    const onOver = (e: MouseEvent) => {
      const t = e.target as Element | null;
      if (!t?.closest) return;
      if (t.closest('[data-diff-hunk-actions]')) {
        clearHideTimer();
        return;
      }
      const hunk = t.closest('[data-diff-op-id]') as HTMLElement | null;
      if (hunk && root.contains(hunk)) showActionsFor(hunk);
    };

    const onOut = (e: MouseEvent) => {
      const to = e.relatedTarget as Element | null;
      if (to?.closest?.('[data-diff-op-id]') || to?.closest?.('[data-diff-hunk-actions]')) return;
      scheduleHide();
    };

    root.addEventListener('mouseover', onOver);
    root.addEventListener('mouseout', onOut);
    return () => {
      root.removeEventListener('mouseover', onOver);
      root.removeEventListener('mouseout', onOut);
      clearHideTimer();
    };
  }, [editor, pending.length, showActionsFor]);

  // Keep hover bar pinned under hunk while scrolling / resizing
  useEffect(() => {
    if (!hover) return;
    const sync = () => {
      const el = hoverHunkRef.current;
      if (!el) return;
      const next = placeUnder(el);
      if (next) setHover(next);
    };
    window.addEventListener('scroll', sync, true);
    window.addEventListener('resize', sync);
    return () => {
      window.removeEventListener('scroll', sync, true);
      window.removeEventListener('resize', sync);
    };
  }, [hover]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (pending.length === 0 || !lexical || !active) return;
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        acceptDiffOp(lexical, active.opId);
      }
      if (meta && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        rejectDiffOp(lexical, active.opId);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lexical, pending, active]);

  if (pending.length === 0 || !lexical) return null;

  const go = (nextIndex: number) => {
    setIndex(nextIndex);
    scrollToOp(editor.getRootElement(), pending[nextIndex]?.opId);
  };

  return (
    <>
      <div className={styles.topBar}>
        <button
          aria-label="Previous change"
          className={styles.navBtn}
          disabled={pending.length < 2}
          onClick={() => go((index - 1 + pending.length) % pending.length)}
          onMouseDown={(e) => e.preventDefault()}
          type="button"
        >
          ▲
        </button>
        <span className={styles.navCount}>
          {index + 1} of {pending.length}
        </span>
        <button
          aria-label="Next change"
          className={styles.navBtn}
          disabled={pending.length < 2}
          onClick={() => go((index + 1) % pending.length)}
          onMouseDown={(e) => e.preventDefault()}
          type="button"
        >
          ▼
        </button>
        <div className={styles.topSpacer} />
        <button
          className={styles.undoBtn}
          onClick={() => rejectAllDiffOps(lexical)}
          onMouseDown={(e) => e.preventDefault()}
          type="button"
        >
          Undo All
        </button>
        <button
          className={styles.keepBtn}
          onClick={() => acceptAllDiffOps(lexical)}
          onMouseDown={(e) => e.preventDefault()}
          type="button"
        >
          Keep All
        </button>
      </div>

      {hover
        ? createPortal(
            <div
              className={styles.hunkActions}
              data-diff-hunk-actions=""
              onMouseEnter={clearHideTimer}
              onMouseLeave={scheduleHide}
              style={{ left: hover.left, top: hover.top }}
            >
              <button
                className={styles.undoBtn}
                onClick={() => rejectDiffOp(lexical, hover.opId)}
                onMouseDown={(e) => e.preventDefault()}
                type="button"
              >
                Undo ⌘N
              </button>
              <button
                className={styles.keepBtn}
                onClick={() => acceptDiffOp(lexical, hover.opId)}
                onMouseDown={(e) => e.preventDefault()}
                type="button"
              >
                Keep ⌘Y
              </button>
            </div>,
            document.body,
          )
        : null}
    </>
  );
};

DiffReviewBar.displayName = 'DiffReviewBar';

export default DiffReviewBar;
