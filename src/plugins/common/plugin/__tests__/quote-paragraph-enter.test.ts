import { $createQuoteNode, HeadingNode, QuoteNode, registerRichText } from '@lexical/rich-text';
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  INSERT_PARAGRAPH_COMMAND,
  createEditor,
} from 'lexical';
import { describe, expect, it } from 'vitest';

import { registerQuoteEnter } from '../quote-enter';

function createQuoteEditor() {
  const editor = createEditor({
    nodes: [QuoteNode, HeadingNode],
    onError(e) {
      throw e;
    },
  });
  registerRichText(editor);
  registerQuoteEnter(editor);
  return editor;
}

describe('quote with paragraph children (markdown-like)', () => {
  it('first Enter creates a new empty paragraph inside the quote', () => {
    const editor = createQuoteEditor();

    editor.update(
      () => {
        const root = $getRoot();
        root.clear();
        const quote = $createQuoteNode();
        const p1 = $createParagraphNode();
        p1.append($createTextNode('定位：给人 review'));
        const p2 = $createParagraphNode();
        p2.append($createTextNode('配合阅读：接口细节'));
        quote.append(p1, p2);
        root.append(quote);
        p2.selectEnd();
      },
      { discrete: true },
    );

    editor.update(
      () => {
        editor.dispatchCommand(INSERT_PARAGRAPH_COMMAND, undefined);
      },
      { discrete: true },
    );

    editor.getEditorState().read(() => {
      const children = $getRoot().getChildren();
      expect(children).toHaveLength(1);
      expect(children[0].getType()).toBe('quote');
      const quoteChildren = (children[0] as QuoteNode).getChildren();
      expect(quoteChildren.map((c) => c.getType())).toEqual([
        'paragraph',
        'paragraph',
        'paragraph',
      ]);
      expect(quoteChildren[2].getTextContent()).toBe('');
    });
  });

  it('second Enter on empty paragraph exits the quote', () => {
    const editor = createQuoteEditor();

    editor.update(
      () => {
        const root = $getRoot();
        root.clear();
        const quote = $createQuoteNode();
        const p1 = $createParagraphNode();
        p1.append($createTextNode('定位：给人 review'));
        const p2 = $createParagraphNode();
        p2.append($createTextNode('配合阅读：接口细节'));
        quote.append(p1, p2);
        root.append(quote);
        p2.selectEnd();
      },
      { discrete: true },
    );

    editor.update(
      () => {
        editor.dispatchCommand(INSERT_PARAGRAPH_COMMAND, undefined);
      },
      { discrete: true },
    );

    editor.update(
      () => {
        editor.dispatchCommand(INSERT_PARAGRAPH_COMMAND, undefined);
      },
      { discrete: true },
    );

    editor.getEditorState().read(() => {
      const children = $getRoot().getChildren();
      expect(children.map((n) => n.getType())).toEqual(['quote', 'paragraph']);
      expect(children[0].getTextContent()).toContain('定位');
      expect(children[0].getTextContent()).toContain('配合阅读');
      expect(children[1].getTextContent()).toBe('');
    });
  });
});
