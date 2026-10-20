import { $isQuoteNode, type QuoteNode } from '@lexical/rich-text';
import { $findMatchingParent } from '@lexical/utils';
import {
  $createParagraphNode,
  $getSelection,
  $isElementNode,
  $isLineBreakNode,
  $isParagraphNode,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_HIGH,
  INSERT_PARAGRAPH_COMMAND,
  type LexicalEditor,
  type LexicalNode,
  type RangeSelection,
} from 'lexical';

/**
 * Offset of the caret within the quote's flat text content (LineBreak → `\n`).
 */
function $getCaretOffsetInQuote(selection: RangeSelection, quote: QuoteNode): number {
  const anchorNode = selection.anchor.getNode();
  let offset = 0;

  const walk = (node: LexicalNode): boolean => {
    if (node === anchorNode) {
      if ($isTextNode(node)) {
        offset += selection.anchor.offset;
      } else if ($isLineBreakNode(node)) {
        // caret on linebreak itself — treat as after the `\n`
        offset += 1;
      }
      return true;
    }

    if ($isTextNode(node)) {
      offset += node.getTextContentSize();
      return false;
    }

    if ($isLineBreakNode(node)) {
      offset += 1;
      return false;
    }

    if ('getChildren' in node) {
      for (const child of (node as QuoteNode).getChildren()) {
        if (walk(child)) return true;
      }
    }
    return false;
  };

  for (const child of quote.getChildren()) {
    if (walk(child)) break;
  }

  return offset;
}

/** True when the caret sits on an empty line inside the quote (Typora “blank quote line”). */
export function $isEmptyLineInQuote(selection: RangeSelection, quote: QuoteNode): boolean {
  const content = quote.getTextContent();
  if (content.trim() === '') return true;

  const offset = $getCaretOffsetInQuote(selection, quote);
  const lineStart = content.lastIndexOf('\n', Math.max(0, offset - 1)) + 1;
  const nextNl = content.indexOf('\n', offset);
  const lineEnd = nextNl === -1 ? content.length : nextNl;
  return content.slice(lineStart, lineEnd).trim() === '';
}

/**
 * Exit quote on empty-line Enter; keep soft line breaks for non-empty lines (Typora-like).
 */
export function $exitQuoteAtSelection(selection: RangeSelection, quote: QuoteNode): void {
  const content = quote.getTextContent();

  // Completely empty quote → replace with paragraph
  if (content.trim() === '') {
    const paragraph = $createParagraphNode();
    quote.replace(paragraph);
    paragraph.select();
    return;
  }

  // Drop trailing empty line(s) / linebreak / empty paragraph at end, then insert paragraph after quote
  const children = quote.getChildren();
  for (let i = children.length - 1; i >= 0; i--) {
    const child = children[i];
    if ($isLineBreakNode(child)) {
      child.remove();
      continue;
    }
    if ($isTextNode(child) && child.getTextContent().trim() === '') {
      child.remove();
      continue;
    }
    if (
      ($isParagraphNode(child) || $isElementNode(child)) &&
      child.getTextContent().trim() === ''
    ) {
      child.remove();
      continue;
    }
    break;
  }

  // If quote became empty after cleanup, replace it
  if (quote.getTextContent().trim() === '') {
    const paragraph = $createParagraphNode();
    quote.replace(paragraph);
    paragraph.select();
    return;
  }

  const paragraph = $createParagraphNode();
  quote.insertAfter(paragraph);
  paragraph.select();
}

/**
 * Typora-like blockquote Enter:
 * - non-empty line → soft linebreak (stay in quote)
 * - empty line → exit quote into a normal paragraph
 */
export function registerQuoteEnter(editor: LexicalEditor): () => void {
  return editor.registerCommand(
    INSERT_PARAGRAPH_COMMAND,
    () => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
        return false;
      }

      const quote = $findMatchingParent(selection.anchor.getNode(), $isQuoteNode);
      if (!quote || !$isQuoteNode(quote)) {
        return false;
      }

      if ($isEmptyLineInQuote(selection, quote)) {
        $exitQuoteAtSelection(selection, quote);
        return true;
      }

      // Stay in quote (first Enter on a non-empty line)
      selection.insertLineBreak();
      return true;
    },
    COMMAND_PRIORITY_HIGH,
  );
}
