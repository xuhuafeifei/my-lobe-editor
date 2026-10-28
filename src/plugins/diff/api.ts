import type { LexicalEditor, SerializedEditorState, SerializedLexicalNode } from 'lexical';
import { $getRoot, $parseSerializedNode } from 'lexical';

import { getKernelFromEditor } from '@/editor-kernel/utils';
import { exportNodeToJSON } from '@/plugins/common/utils';
import { IMarkdownShortCutService } from '@/plugins/markdown';
import { parseMarkdownToLexical } from '@/plugins/markdown/data-source/markdown/parse';
import { computeLexicalDiffRows } from '@/renderer/diff/compute';

import {
  $buildHunk,
  $rejectAllDiffOps,
  acceptAllDiffOps,
  assertCanPublish,
  hasPendingDiff,
  rejectAllDiffOps,
} from './command';
import { $isDiffHunkNode } from './node/DiffHunkNode';

export type DiffApiResult = { ok: true } | { ok: false; error: string };

export type FlattenMode = 'keep' | 'reject';

type SerializedRecord = Record<string, unknown>;

/** Drop any in-flight DiffHunks (Undo All) so a new proposal can land. */
function discardPendingDiffs(editor: LexicalEditor): void {
  if (hasPendingDiff(editor)) {
    rejectAllDiffOps(editor);
  }
}

function mdToRoot(editor: LexicalEditor, md: string): SerializedEditorState {
  try {
    const kernel = getKernelFromEditor(editor);
    const service = kernel.requireService(IMarkdownShortCutService);
    if (service) {
      return { root: service.parseMarkdownToLexical(md) } as SerializedEditorState;
    }
  } catch {
    // fall through
  }
  return { root: parseMarkdownToLexical(md, {}) } as SerializedEditorState;
}

function mdToBlocks(editor: LexicalEditor, md: string): SerializedLexicalNode[] {
  const { root } = mdToRoot(editor, md);
  return Array.isArray(root.children) ? [...root.children] : [];
}

function isDiffHunkSerialized(node: SerializedLexicalNode): boolean {
  return (node as SerializedRecord).type === 'diff-hunk';
}

function isDiffChromeSerialized(node: SerializedLexicalNode): boolean {
  return (node as SerializedRecord).type === 'diff-chrome';
}

function flattenSerializedHunk(
  node: SerializedLexicalNode,
  mode: FlattenMode,
): SerializedLexicalNode[] {
  const record = node as SerializedRecord;
  const kind = String(record.kind ?? '');
  const oldBlock = (record.oldBlock as SerializedLexicalNode | null | undefined) ?? null;
  const children = Array.isArray(record.children)
    ? (record.children as SerializedLexicalNode[]).filter((c) => !isDiffChromeSerialized(c))
    : [];

  if (mode === 'keep') {
    if (kind === 'delete') return [];
    return children;
  }

  if (kind === 'insert') return [];
  if (oldBlock) return [oldBlock];
  return [];
}

/** Pure: strip DiffHunk from serialized state (does not mutate the live editor). */
export function flattenCanonicalState(
  state: SerializedEditorState,
  mode: FlattenMode = 'keep',
): SerializedEditorState {
  const children = Array.isArray(state.root.children) ? state.root.children : [];
  const next: SerializedLexicalNode[] = [];
  for (const child of children) {
    if (isDiffHunkSerialized(child)) {
      next.push(...flattenSerializedHunk(child, mode));
    } else {
      next.push(child);
    }
  }
  return {
    root: {
      ...state.root,
      children: next,
    },
  };
}

export function getCanonicalEditorState(
  editor: LexicalEditor,
  mode: FlattenMode = 'keep',
): SerializedEditorState {
  const state = editor.getEditorState().toJSON() as SerializedEditorState;
  return flattenCanonicalState(state, mode);
}

function $getSlotNode(slot1Based: number) {
  return $getRoot().getChildren()[slot1Based - 1] ?? null;
}

export function updateSlot(editor: LexicalEditor, slot: number, md: string): DiffApiResult {
  discardPendingDiffs(editor);

  const blocks = mdToBlocks(editor, md);
  if (blocks.length !== 1) {
    return { ok: false, error: 'update_slot expects exactly one top-level markdown block' };
  }

  let ok = false;
  let error = 'update_slot failed';
  editor.update(
    () => {
      $rejectAllDiffOps();
      const target = $getSlotNode(slot);
      if (!target || $isDiffHunkNode(target)) {
        error = 'invalid slot or target is already a diff hunk';
        return;
      }
      const oldBlock = exportNodeToJSON(target);
      const hunk = $buildHunk('update', oldBlock, blocks[0]);
      target.replace(hunk);
      ok = true;
    },
    { discrete: true },
  );
  return ok ? { ok: true } : { ok: false, error };
}

export function insertAfterSlot(editor: LexicalEditor, slot: number, md: string): DiffApiResult {
  discardPendingDiffs(editor);

  const blocks = mdToBlocks(editor, md);
  if (blocks.length === 0) {
    return { ok: false, error: 'insert_after got empty markdown' };
  }

  let ok = false;
  let error = 'insert_after failed';
  editor.update(
    () => {
      $rejectAllDiffOps();
      const after = slot === 0 ? null : $getSlotNode(slot);
      if (slot !== 0 && (!after || $isDiffHunkNode(after))) {
        error = 'invalid afterSlot';
        return;
      }

      let cursor = after;
      for (const block of blocks) {
        const hunk = $buildHunk('insert', null, block);
        if (!cursor) {
          const root = $getRoot();
          const first = root.getFirstChild();
          if (first) first.insertBefore(hunk);
          else root.append(hunk);
        } else {
          cursor.insertAfter(hunk);
        }
        cursor = hunk;
      }
      ok = true;
    },
    { discrete: true },
  );
  return ok ? { ok: true } : { ok: false, error };
}

export function removeSlot(editor: LexicalEditor, slot: number): DiffApiResult {
  discardPendingDiffs(editor);

  let ok = false;
  let error = 'remove_slot failed';
  editor.update(
    () => {
      $rejectAllDiffOps();
      const target = $getSlotNode(slot);
      if (!target || $isDiffHunkNode(target)) {
        error = 'invalid slot or target is already a diff hunk';
        return;
      }
      const oldBlock = exportNodeToJSON(target);
      const hunk = $buildHunk('delete', oldBlock, oldBlock);
      target.replace(hunk);
      ok = true;
    },
    { discrete: true },
  );
  return ok ? { ok: true } : { ok: false, error };
}

/**
 * Full-document propose (approach B): LCS current vs md → multiple DiffHunks.
 * Any pending hunks are Undo All'd first so LCS runs against the restored base.
 */
export function overwriteAll(editor: LexicalEditor, md: string): DiffApiResult {
  discardPendingDiffs(editor);

  const oldState = editor.getEditorState().toJSON() as SerializedEditorState;
  const newState = mdToRoot(editor, md);
  const rows = computeLexicalDiffRows(oldState, newState);

  const plan: Array<
    | { kind: 'equal'; block: SerializedLexicalNode }
    | { kind: 'update'; oldBlock: SerializedLexicalNode; newBlock: SerializedLexicalNode }
    | { kind: 'delete'; oldBlock: SerializedLexicalNode }
    | { kind: 'insert'; newBlock: SerializedLexicalNode }
  > = [];

  for (const row of rows) {
    if (row.kind === 'equal') {
      const block = row.oldCell?.sourceBlock ?? row.oldCell?.block;
      if (block) plan.push({ block, kind: 'equal' });
      continue;
    }
    if (row.kind === 'modify') {
      const oldBlock = row.oldCell?.sourceBlock ?? row.oldCell?.block;
      const newBlock = row.newCell?.sourceBlock ?? row.newCell?.block;
      if (oldBlock && newBlock) plan.push({ kind: 'update', newBlock, oldBlock });
      continue;
    }
    if (row.kind === 'delete') {
      const oldBlock = row.oldCell?.sourceBlock ?? row.oldCell?.block;
      if (oldBlock) plan.push({ kind: 'delete', oldBlock });
      continue;
    }
    const newBlock = row.newCell?.sourceBlock ?? row.newCell?.block;
    if (newBlock) plan.push({ kind: 'insert', newBlock });
  }

  const hasChange = plan.some((p) => p.kind !== 'equal');
  if (!hasChange) return { ok: true };

  let applied = false;
  editor.update(
    () => {
      $rejectAllDiffOps();
      const root = $getRoot();
      root.clear();
      for (const step of plan) {
        if (step.kind === 'equal') {
          root.append($parseSerializedNode(step.block));
          continue;
        }
        if (step.kind === 'update') {
          root.append($buildHunk('update', step.oldBlock, step.newBlock));
          continue;
        }
        if (step.kind === 'delete') {
          root.append($buildHunk('delete', step.oldBlock, step.oldBlock));
          continue;
        }
        root.append($buildHunk('insert', null, step.newBlock));
      }
      applied = true;
    },
    { discrete: true },
  );

  return applied ? { ok: true } : { ok: false, error: 'overwrite_all failed' };
}

export { assertCanPublish, hasPendingDiff };

/** Mutate live tree via accept/reject all. Prefer getCanonicalEditorState for export. */
export function materializeCanonical(editor: LexicalEditor, mode: FlattenMode): void {
  if (mode === 'keep') acceptAllDiffOps(editor);
  else rejectAllDiffOps(editor);
}
