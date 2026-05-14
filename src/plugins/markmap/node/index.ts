import { addClassNamesToElement } from '@lexical/utils';
import {
  $applyNodeReplacement,
  DecoratorNode,
  EditorConfig,
  LexicalEditor,
  LexicalNode,
  SerializedLexicalNode,
  Spread,
} from 'lexical';

import { getKernelFromEditor } from '@/editor-kernel';

export type SerializedMarkmapNode = Spread<
  {
    markdown: string;
  },
  SerializedLexicalNode
>;

export class MarkmapNode extends DecoratorNode<unknown> {
  static getType(): string {
    return 'markmap';
  }

  static clone(node: MarkmapNode): MarkmapNode {
    return new MarkmapNode(node.__markdown, node.__key);
  }

  static importJSON(serializedNode: SerializedMarkmapNode): MarkmapNode {
    return new MarkmapNode(serializedNode.markdown);
  }

  __markdown: string;
  /** When true, decorator opens the editor once after insert (not persisted in markdown). */
  __autoOpenEditor: boolean;

  constructor(markdown = '', key?: string, autoOpenEditor = false) {
    super(key);
    this.__markdown = markdown;
    this.__autoOpenEditor = autoOpenEditor;
  }

  clearAutoOpenEditor(): void {
    const w = this.getWritable();
    w.__autoOpenEditor = false;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = document.createElement('div');
    addClassNamesToElement(element, config.theme.markmap ?? 'editor-markmap');
    return element;
  }

  decorate(editor: LexicalEditor): unknown {
    const decorator = getKernelFromEditor(editor)?.getDecorator(MarkmapNode.getType());
    if (!decorator) return null;
    if (typeof decorator === 'function') {
      return decorator(this, editor);
    }
    return {
      queryDOM: decorator.queryDOM,
      render: decorator.render(this, editor),
    };
  }

  exportJSON(): SerializedMarkmapNode {
    return {
      ...super.exportJSON(),
      markdown: this.__markdown,
    };
  }

  getTextContent(): string {
    return `---markmap---\n${this.__markdown}\n---/markmap---\n`;
  }

  isInline(): boolean {
    return false;
  }

  updateMarkdown(markdown: string) {
    const writer = this.getWritable();
    writer.__markdown = markdown;
  }

  updateDOM(): boolean {
    return false;
  }
}

export type CreateMarkmapNodeOptions = {
  autoOpenEditor?: boolean;
};

export function $createMarkmapNode(
  markdown = '',
  options?: CreateMarkmapNodeOptions,
): MarkmapNode {
  return $applyNodeReplacement(
    new MarkmapNode(markdown, undefined, options?.autoOpenEditor ?? false),
  );
}

export function $isMarkmapNode(node: LexicalNode): node is MarkmapNode {
  return node instanceof MarkmapNode;
}
