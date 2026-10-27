/* eslint-disable @typescript-eslint/no-use-before-define */
import { addClassNamesToElement } from '@lexical/utils';
import type {
  DOMExportOutput,
  EditorConfig,
  LexicalEditor,
  LexicalNode,
  LexicalUpdateJSON,
  SerializedLexicalNode,
  Spread,
} from 'lexical';
import { $applyNodeReplacement, DecoratorNode } from 'lexical';

import { getKernelFromEditor } from '@/editor-kernel/utils';

import type { DiffHunkKind } from './DiffHunkNode';

export type SerializedDiffChromeNode = Spread<
  {
    kind: DiffHunkKind;
    oldText: string;
    opId: string;
  },
  SerializedLexicalNode
>;

/** Toolbar + optional red "old" preview inside a DiffHunk ElementNode. */
export class DiffChromeNode extends DecoratorNode<unknown> {
  __opId: string;
  __kind: DiffHunkKind;
  __oldText: string;

  static getType(): string {
    return 'diff-chrome';
  }

  static clone(node: DiffChromeNode): DiffChromeNode {
    return new DiffChromeNode(node.__opId, node.__kind, node.__oldText, node.__key);
  }

  static importJSON(serializedNode: SerializedDiffChromeNode): DiffChromeNode {
    return $createDiffChromeNode({
      kind: serializedNode.kind,
      oldText: serializedNode.oldText ?? '',
      opId: serializedNode.opId,
    }).updateFromJSON(serializedNode);
  }

  constructor(opId: string, kind: DiffHunkKind, oldText: string, key?: string) {
    super(key);
    this.__opId = opId;
    this.__kind = kind;
    this.__oldText = oldText;
  }

  get opId() {
    return this.__opId;
  }

  get kind() {
    return this.__kind;
  }

  get oldText() {
    return this.__oldText;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const el = document.createElement('div');
    addClassNamesToElement(el, config.theme?.['diff-chrome']);
    el.setAttribute('contenteditable', 'false');
    el.setAttribute('data-diff-chrome-kind', this.__kind);
    // Cursor: only update shows a red "old" line; delete/insert wash the body.
    if (this.__kind !== 'update' || !this.__oldText) {
      el.style.display = 'none';
    }
    return el;
  }

  updateDOM(): boolean {
    return false;
  }

  exportDOM(): DOMExportOutput {
    return { element: document.createElement('div') };
  }

  isInline(): false {
    return false;
  }

  isKeyboardSelectable(): boolean {
    return false;
  }

  getTextContent(): string {
    return '';
  }

  exportJSON(): SerializedDiffChromeNode {
    return {
      ...super.exportJSON(),
      kind: this.__kind,
      oldText: this.__oldText,
      opId: this.__opId,
      type: 'diff-chrome',
      version: 1,
    };
  }

  updateFromJSON(serializedNode: LexicalUpdateJSON<SerializedDiffChromeNode>): this {
    const self = super.updateFromJSON(serializedNode);
    if (serializedNode.opId) self.__opId = serializedNode.opId;
    if (serializedNode.kind) self.__kind = serializedNode.kind;
    if (typeof serializedNode.oldText === 'string') self.__oldText = serializedNode.oldText;
    return self;
  }

  decorate(editor: LexicalEditor): unknown {
    const decorator = getKernelFromEditor(editor)?.getDecorator('diff-chrome');
    if (!decorator) return null;
    if (typeof decorator === 'function') {
      return decorator(this, editor);
    }
    return {
      queryDOM: decorator.queryDOM,
      render: decorator.render(this, editor),
    };
  }
}

export function $createDiffChromeNode(payload: {
  kind: DiffHunkKind;
  oldText?: string;
  opId: string;
}): DiffChromeNode {
  return $applyNodeReplacement(
    new DiffChromeNode(payload.opId, payload.kind, payload.oldText ?? ''),
  );
}

export function $isDiffChromeNode(node: LexicalNode | null | undefined): node is DiffChromeNode {
  return node instanceof DiffChromeNode;
}
