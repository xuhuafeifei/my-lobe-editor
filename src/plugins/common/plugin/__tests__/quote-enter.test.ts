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

function childTypes(editor: ReturnType<typeof createQuoteEditor>) {
  return editor.getEditorState().read(() =>
    $getRoot()
      .getChildren()
      .map((n) => n.getType()),
  );
}

function childTexts(editor: ReturnType<typeof createQuoteEditor>) {
  return editor.getEditorState().read(() =>
    $getRoot()
      .getChildren()
      .map((n) => n.getTextContent()),
  );
}

describe('registerQuoteEnter (Typora-like)', () => {
  it('first Enter on non-empty quote inserts a soft linebreak and stays in quote', () => {
    const editor = createQuoteEditor();

    editor.update(
      () => {
        const root = $getRoot();
        root.clear();
        const quote = $createQuoteNode();
        quote.append($createTextNode('111'));
        root.append(quote);
        quote.selectEnd();
      },
      { discrete: true },
    );

    editor.update(
      () => {
        editor.dispatchCommand(INSERT_PARAGRAPH_COMMAND, undefined);
      },
      { discrete: true },
    );

    expect(childTypes(editor)).toEqual(['quote']);
    expect(childTexts(editor)).toEqual(['111\n']);
  });

  it('second Enter on empty quote line exits into a normal paragraph', () => {
    const editor = createQuoteEditor();

    editor.update(
      () => {
        const root = $getRoot();
        root.clear();
        const quote = $createQuoteNode();
        quote.append($createTextNode('111'));
        root.append(quote);
        quote.selectEnd();
      },
      { discrete: true },
    );

    // first Enter → soft break inside quote
    editor.update(
      () => {
        editor.dispatchCommand(INSERT_PARAGRAPH_COMMAND, undefined);
      },
      { discrete: true },
    );

    // second Enter → exit quote
    editor.update(
      () => {
        editor.dispatchCommand(INSERT_PARAGRAPH_COMMAND, undefined);
      },
      { discrete: true },
    );

    expect(childTypes(editor)).toEqual(['quote', 'paragraph']);
    expect(childTexts(editor)).toEqual(['111', '']);
  });

  it('Enter in a fully empty quote replaces it with a paragraph', () => {
    const editor = createQuoteEditor();

    editor.update(
      () => {
        const root = $getRoot();
        root.clear();
        const quote = $createQuoteNode();
        quote.append($createTextNode(''));
        root.append(quote);
        quote.selectEnd();
      },
      { discrete: true },
    );

    editor.update(
      () => {
        editor.dispatchCommand(INSERT_PARAGRAPH_COMMAND, undefined);
      },
      { discrete: true },
    );

    expect(childTypes(editor)).toEqual(['paragraph']);
  });

  it('does not handle Enter outside of quotes', () => {
    const editor = createQuoteEditor();

    editor.update(
      () => {
        const root = $getRoot();
        root.clear();
        const p = $createParagraphNode();
        p.append($createTextNode('hello'));
        root.append(p);
        p.selectEnd();
      },
      { discrete: true },
    );

    editor.update(
      () => {
        // Should fall through to Lexical default (registerRichText) → new paragraph
        editor.dispatchCommand(INSERT_PARAGRAPH_COMMAND, undefined);
      },
      { discrete: true },
    );

    const types = childTypes(editor);
    expect(types.length).toBeGreaterThanOrEqual(2);
    expect(types.every((t) => t === 'paragraph')).toBe(true);
  });
});
