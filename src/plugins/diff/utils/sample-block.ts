import type { SerializedLexicalNode } from 'lexical';

/** Demo helper: plain paragraph serialized block. */
export function makeParagraphBlock(text: string): SerializedLexicalNode {
  return {
    children: [
      {
        detail: 0,
        format: 0,
        mode: 'normal',
        style: '',
        text,
        type: 'text',
        version: 1,
      },
    ],
    direction: 'ltr',
    format: '',
    indent: 0,
    textFormat: 0,
    textStyle: '',
    type: 'paragraph',
    version: 1,
  } as unknown as SerializedLexicalNode;
}

export function blockPlainText(block: SerializedLexicalNode | null | undefined): string {
  if (!block) return '';
  const walk = (node: Record<string, unknown>): string => {
    if (typeof node.text === 'string') return node.text;
    const children = node.children;
    if (!Array.isArray(children)) return '';
    return children.map((c) => walk(c as Record<string, unknown>)).join('');
  };
  return walk(block as unknown as Record<string, unknown>);
}
