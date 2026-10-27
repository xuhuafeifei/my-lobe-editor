/* eslint-disable @typescript-eslint/no-use-before-define */
import { addClassNamesToElement } from '@lexical/utils';
import type {
  DOMExportOutput,
  EditorConfig,
  LexicalNode,
  LexicalUpdateJSON,
  NodeKey,
  SerializedElementNode,
  SerializedLexicalNode,
  Spread,
} from 'lexical';
import { $applyNodeReplacement, ElementNode } from 'lexical';

export type DiffHunkKind = 'update' | 'delete' | 'insert';

export type SerializedDiffHunkNode = Spread<
  {
    kind: DiffHunkKind;
    /** Serialized original block for reject / delete restore. */
    oldBlock: SerializedLexicalNode | null;
    opId: string;
  },
  SerializedElementNode
>;

/**
 * Top-level ElementNode hunk:
 * - children[0] = DiffChrome (buttons + optional red old text)
 * - children[1..] = editable block content (new for update/insert, old body for delete)
 */
export class DiffHunkNode extends ElementNode {
  __opId: string;
  __kind: DiffHunkKind;
  __oldBlock: SerializedLexicalNode | null;

  static getType(): string {
    return 'diff-hunk';
  }

  static clone(node: DiffHunkNode): DiffHunkNode {
    return new DiffHunkNode(node.__opId, node.__kind, node.__oldBlock, node.__key);
  }

  static importJSON(serializedNode: SerializedDiffHunkNode): DiffHunkNode {
    return $createDiffHunkNode({
      kind: serializedNode.kind,
      oldBlock: serializedNode.oldBlock ?? null,
      opId: serializedNode.opId,
    }).updateFromJSON(serializedNode);
  }

  constructor(
    opId: string,
    kind: DiffHunkKind,
    oldBlock: SerializedLexicalNode | null,
    key?: NodeKey,
  ) {
    super(key);
    this.__opId = opId;
    this.__kind = kind;
    this.__oldBlock = oldBlock;
  }

  get opId(): string {
    return this.__opId;
  }

  get kind(): DiffHunkKind {
    return this.__kind;
  }

  get oldBlock(): SerializedLexicalNode | null {
    return this.__oldBlock;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = document.createElement('div');
    addClassNamesToElement(element, config.theme?.['diff-hunk']);
    element.classList.add(`is-${this.__kind}`);
    element.setAttribute('data-diff-op-id', this.__opId);
    element.setAttribute('data-diff-kind', this.__kind);
    return element;
  }

  updateDOM(prev: DiffHunkNode, dom: HTMLElement): boolean {
    if (prev.__kind !== this.__kind) {
      dom.classList.remove(`is-${prev.__kind}`);
      dom.classList.add(`is-${this.__kind}`);
      dom.setAttribute('data-diff-kind', this.__kind);
    }
    return false;
  }

  exportDOM(): DOMExportOutput {
    return { element: document.createElement('div') };
  }

  exportJSON(): SerializedDiffHunkNode {
    return {
      ...super.exportJSON(),
      kind: this.__kind,
      oldBlock: this.__oldBlock,
      opId: this.__opId,
      type: 'diff-hunk',
      version: 1,
    };
  }

  updateFromJSON(serializedNode: LexicalUpdateJSON<SerializedDiffHunkNode>): this {
    const self = super.updateFromJSON(serializedNode);
    if (serializedNode.opId) self.__opId = serializedNode.opId;
    if (serializedNode.kind) self.__kind = serializedNode.kind;
    if ('oldBlock' in serializedNode) self.__oldBlock = serializedNode.oldBlock ?? null;
    return self;
  }

  canBeEmpty(): false {
    return false;
  }
}

export function $createDiffHunkNode(payload: {
  kind: DiffHunkKind;
  oldBlock?: SerializedLexicalNode | null;
  opId: string;
}): DiffHunkNode {
  return $applyNodeReplacement(
    new DiffHunkNode(payload.opId, payload.kind, payload.oldBlock ?? null),
  );
}

export function $isDiffHunkNode(node: LexicalNode | null | undefined): node is DiffHunkNode {
  return node instanceof DiffHunkNode;
}
