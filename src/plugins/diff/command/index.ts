import {
  $getNodeByKey,
  $getPreviousSelection,
  $getRoot,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  $parseSerializedNode,
  COMMAND_PRIORITY_EDITOR,
  type LexicalEditor,
  type LexicalNode,
  type SerializedLexicalNode,
  createCommand,
} from 'lexical';

import { exportNodeToJSON } from '@/plugins/common/utils';

import { $createDiffChromeNode, $isDiffChromeNode } from '../node/DiffChromeNode';
import { $createDiffHunkNode, $isDiffHunkNode, type DiffHunkKind } from '../node/DiffHunkNode';
import { blockPlainText } from '../utils/sample-block';

export type DiffOpPayload =
  | {
      kind: 'update';
      newBlock: SerializedLexicalNode;
      slot?: number;
    }
  | {
      kind: 'delete';
      slot?: number;
    }
  | {
      afterSlot?: number;
      kind: 'insert_after';
      newBlock: SerializedLexicalNode;
    };

export const APPLY_DIFF_OP_COMMAND = createCommand<DiffOpPayload>('APPLY_DIFF_OP_COMMAND');
export const ACCEPT_DIFF_OP_COMMAND = createCommand<string>('ACCEPT_DIFF_OP_COMMAND');
export const REJECT_DIFF_OP_COMMAND = createCommand<string>('REJECT_DIFF_OP_COMMAND');

let opSeq = 0;
function nextOpId(): string {
  opSeq += 1;
  return `diff-${Date.now().toString(36)}-${opSeq}`;
}

function $getTopLevelBySlot(slot1Based: number) {
  return $getRoot().getChildren()[slot1Based - 1] ?? null;
}

function $getSelectedTopLevel(): LexicalNode | null {
  const selection = $getSelection() || $getPreviousSelection();
  if (!$isRangeSelection(selection)) return null;
  try {
    const top = selection.anchor.getNode().getTopLevelElementOrThrow();
    if ($isDiffHunkNode(top) || $isDiffChromeNode(top)) return null;
    // If selection is inside a hunk, climb to the hunk and refuse (already pending).
    let n: LexicalNode | null = selection.anchor.getNode();
    while (n) {
      if ($isDiffHunkNode(n)) return null;
      n = n.getParent();
    }
    return top;
  } catch {
    return null;
  }
}

function $appendSerializedBlock(hunk: ReturnType<typeof $createDiffHunkNode>, block: SerializedLexicalNode) {
  const live = $parseSerializedNode(block);
  hunk.append(live);
}

/** @internal exported for overwrite_all / slot APIs */
export function $buildHunk(
  kind: DiffHunkKind,
  oldBlock: SerializedLexicalNode | null,
  contentBlock: SerializedLexicalNode,
): ReturnType<typeof $createDiffHunkNode> {
  const opId = nextOpId();
  const hunk = $createDiffHunkNode({ kind, oldBlock, opId });
  const oldText =
    kind === 'update' || kind === 'delete' ? blockPlainText(oldBlock) : '';
  hunk.append(
    $createDiffChromeNode({
      kind,
      oldText: kind === 'update' ? oldText : '',
      opId,
    }),
  );
  $appendSerializedBlock(hunk, contentBlock);
  return hunk;
}

function $resolveTarget(slot?: number): LexicalNode | null {
  if (typeof slot === 'number') return $getTopLevelBySlot(slot);
  return $getSelectedTopLevel() ?? $getTopLevelBySlot(1);
}

function $applyOp(payload: DiffOpPayload): boolean {
  if (payload.kind === 'update') {
    const target = $resolveTarget(payload.slot);
    if (!target || !$isElementNode(target) || $isDiffHunkNode(target)) return false;
    const oldBlock = exportNodeToJSON(target);
    const hunk = $buildHunk('update', oldBlock, payload.newBlock);
    target.replace(hunk);
    return true;
  }

  if (payload.kind === 'delete') {
    const target = $resolveTarget(payload.slot);
    if (!target || !$isElementNode(target) || $isDiffHunkNode(target)) return false;
    const oldBlock = exportNodeToJSON(target);
    // Content stays as the old block (red via CSS); chrome has Accept/Reject.
    const hunk = $buildHunk('delete', oldBlock, oldBlock);
    target.replace(hunk);
    return true;
  }

  const after =
    typeof payload.afterSlot === 'number'
      ? payload.afterSlot === 0
        ? null
        : $getTopLevelBySlot(payload.afterSlot)
      : ($getSelectedTopLevel() ?? $getTopLevelBySlot(1));

  const hunk = $buildHunk('insert', null, payload.newBlock);

  if (!after) {
    const root = $getRoot();
    const first = root.getFirstChild();
    if (first) first.insertBefore(hunk);
    else root.append(hunk);
    return true;
  }
  if ($isDiffHunkNode(after)) return false;
  after.insertAfter(hunk);
  return true;
}

function $findHunkByOpId(opId: string) {
  for (const child of $getRoot().getChildren()) {
    if ($isDiffHunkNode(child) && child.opId === opId) return child;
  }
  return null;
}

function $contentChildren(hunk: ReturnType<typeof $createDiffHunkNode>) {
  return hunk.getChildren().filter((c) => !$isDiffChromeNode(c));
}

function $accept(opId: string): boolean {
  const hunk = $findHunkByOpId(opId);
  if (!hunk) return false;

  if (hunk.kind === 'delete') {
    hunk.remove();
    return true;
  }

  // update / insert → keep editable content nodes, drop chrome + wrapper
  const content = $contentChildren(hunk);
  if (content.length === 0) {
    hunk.remove();
    return true;
  }
  for (const node of content) {
    hunk.insertBefore(node);
  }
  hunk.remove();
  return true;
}

function $reject(opId: string): boolean {
  const hunk = $findHunkByOpId(opId);
  if (!hunk) return false;

  if (hunk.kind === 'insert') {
    hunk.remove();
    return true;
  }

  // update / delete → restore oldBlock
  const block = hunk.oldBlock;
  if (!block) {
    hunk.remove();
    return true;
  }
  const live = $parseSerializedNode(block);
  hunk.replace(live);
  return true;
}

export function registerDiffCommands(editor: LexicalEditor) {
  return [
    editor.registerCommand(
      APPLY_DIFF_OP_COMMAND,
      (payload) => {
        // Must mutate inside update; keep sync so dispatchCommand return value is accurate.
        let ok = false;
        editor.update(
          () => {
            ok = $applyOp(payload);
          },
          { discrete: true },
        );
        return ok;
      },
      COMMAND_PRIORITY_EDITOR,
    ),
    editor.registerCommand(
      ACCEPT_DIFF_OP_COMMAND,
      (opId) => {
        let ok = false;
        editor.update(
          () => {
            ok = $accept(opId);
          },
          { discrete: true },
        );
        return ok;
      },
      COMMAND_PRIORITY_EDITOR,
    ),
    editor.registerCommand(
      REJECT_DIFF_OP_COMMAND,
      (opId) => {
        let ok = false;
        editor.update(
          () => {
            ok = $reject(opId);
          },
          { discrete: true },
        );
        return ok;
      },
      COMMAND_PRIORITY_EDITOR,
    ),
  ];
}

export function acceptDiffOp(editor: LexicalEditor, opId: string) {
  editor.update(() => {
    $accept(opId);
  });
}

export function rejectDiffOp(editor: LexicalEditor, opId: string) {
  editor.update(() => {
    $reject(opId);
  });
}

function $collectOpIds(): string[] {
  const ids: string[] = [];
  for (const child of $getRoot().getChildren()) {
    if ($isDiffHunkNode(child)) ids.push(child.opId);
    else if (child.getType() === 'diff-hunk') {
      const id = (child as { __opId?: string }).__opId;
      if (id) ids.push(id);
    }
  }
  return ids;
}

export function acceptAllDiffOps(editor: LexicalEditor) {
  editor.update(() => {
    for (const id of $collectOpIds()) $accept(id);
  });
}

export function rejectAllDiffOps(editor: LexicalEditor) {
  editor.update(() => {
    for (const id of $collectOpIds()) $reject(id);
  });
}

export function $hasPendingDiff(): boolean {
  return $collectOpIds().length > 0;
}

export function hasPendingDiff(editor: LexicalEditor): boolean {
  return editor.getEditorState().read(() => $hasPendingDiff());
}

/** Host publish gate: block when any DiffHunk is pending. */
export function assertCanPublish(
  editor: LexicalEditor,
): { ok: true } | { ok: false; error: string } {
  if (hasPendingDiff(editor)) {
    return { ok: false, error: 'pending diff; Keep All / Undo All before publish' };
  }
  return { ok: true };
}

/** @deprecated use acceptDiffOp */
export function acceptDiffHunkByKey(editor: LexicalEditor, key: string) {
  editor.update(() => {
    const node = $getNodeByKey(key);
    if ($isDiffHunkNode(node)) $accept(node.opId);
    if ($isDiffChromeNode(node)) $accept(node.opId);
  });
}

/** @deprecated use rejectDiffOp */
export function rejectDiffHunkByKey(editor: LexicalEditor, key: string) {
  editor.update(() => {
    const node = $getNodeByKey(key);
    if ($isDiffHunkNode(node)) $reject(node.opId);
    if ($isDiffChromeNode(node)) $reject(node.opId);
  });
}
