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
  type ElementNode,
  INSERT_PARAGRAPH_COMMAND,
  type LexicalEditor,
  type LexicalNode,
  type RangeSelection,
} from 'lexical';

/**
 * Flat caret offset within `root` text content (LineBreak / block edges → `\n`).
 * Handles both text anchors and element anchors (common after soft Enter).
 */
function $getOffsetWithin(selection: RangeSelection, root: ElementNode): number {
  const anchorNode = selection.anchor.getNode();
  const anchorOffset = selection.anchor.offset;
  const isElementAnchor = selection.anchor.type === 'element';

  if (isElementAnchor && anchorNode === root) {
    let offset = 0;
    const children = root.getChildren();
    for (let i = 0; i < anchorOffset && i < children.length; i++) {
      offset += children[i].getTextContentSize();
    }
    return offset;
  }

  let offset = 0;

  const walk = (node: LexicalNode): boolean => {
    if (node === anchorNode) {
      if (isElementAnchor && $isElementNode(node)) {
        const children = node.getChildren();
        for (let i = 0; i < anchorOffset && i < children.length; i++) {
          offset += children[i].getTextContentSize();
        }
      } else if ($isTextNode(node)) {
        offset += anchorOffset;
      } else if ($isLineBreakNode(node)) {
        offset += 1;
      }
      return true;
    }

    if ($isTextNode(node) || $isLineBreakNode(node)) {
      offset += node.getTextContentSize();
      return false;
    }

    if ($isElementNode(node)) {
      for (const child of node.getChildren()) {
        if (walk(child)) return true;
      }
    }
    return false;
  };

  for (const child of root.getChildren()) {
    if (walk(child)) break;
  }

  return offset;
}

function $isEmptySoftLine(selection: RangeSelection, root: ElementNode): boolean {
  const content = root.getTextContent();
  if (content.trim() === '') return true;

  const offset = $getOffsetWithin(selection, root);
  const lineStart = content.lastIndexOf('\n', Math.max(0, offset - 1)) + 1;
  const nextNl = content.indexOf('\n', offset);
  const lineEnd = nextNl === -1 ? content.length : nextNl;
  return content.slice(lineStart, lineEnd).trim() === '';
}

/** True when the caret sits on an empty line inside the quote (Typora “blank quote line”). */
export function $isEmptyLineInQuote(selection: RangeSelection, quote: QuoteNode): boolean {
  if (quote.getTextContent().trim() === '') return true;

  // Empty paragraph child (markdown-loaded quotes use paragraph children)
  const paragraph = $findMatchingParent(selection.anchor.getNode(), $isParagraphNode);
  if (paragraph && quote.isParentOf(paragraph)) {
    if (paragraph.getTextContent().trim() === '') return true;
    return $isEmptySoftLine(selection, paragraph);
  }

  // Quote with direct text / linebreak children (typed via `> ` shortcut)
  return $isEmptySoftLine(selection, quote);
}

/**
 * Exit quote on empty-line Enter; keep soft line breaks for non-empty lines (Typora-like).
 */
export function $exitQuoteAtSelection(_selection: RangeSelection, quote: QuoteNode): void {
  const content = quote.getTextContent();

  // Completely empty quote → replace with paragraph
  if (content.trim() === '') {
    const paragraph = $createParagraphNode();
    quote.replace(paragraph);
    paragraph.select();
    return;
  }

  // Drop trailing empty line(s) / linebreak / empty paragraph at end
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
    if ($isParagraphNode(child) && child.getTextContent().trim() === '') {
      child.remove();
      continue;
    }
    // Trailing soft-breaks only inside last paragraph
    if ($isParagraphNode(child) || $isElementNode(child)) {
      const nested = child.getChildren();
      for (let j = nested.length - 1; j >= 0; j--) {
        const n = nested[j];
        if ($isLineBreakNode(n)) {
          n.remove();
          continue;
        }
        if ($isTextNode(n) && n.getTextContent().trim() === '') {
          n.remove();
          continue;
        }
        break;
      }
      if (child.getTextContent().trim() === '' && $isParagraphNode(child)) {
        child.remove();
        continue;
      }
    }
    break;
  }

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
 * - non-empty line → new line inside quote
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

      // Markdown-style quote: paragraphs inside quote → split into a new paragraph in the quote
      const paragraph = $findMatchingParent(selection.anchor.getNode(), $isParagraphNode);
      if (paragraph && quote.isParentOf(paragraph)) {
        selection.insertParagraph();
        return true;
      }

      // Shortcut-created quote (text directly under quote) → soft linebreak
      selection.insertLineBreak();
      return true;
    },
    COMMAND_PRIORITY_HIGH,
  );
}
