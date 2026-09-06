import type { HistoryStateEntry } from '@lexical/history';
import { mergeRegister } from '@lexical/utils';
import {
  $getRoot,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  $isRootOrShadowRoot,
  $isTextNode,
  COMMAND_PRIORITY_HIGH,
  type EditorState,
  HISTORIC_TAG,
  HISTORY_PUSH_TAG,
  LexicalEditor,
  LexicalNode,
  createCommand,
} from 'lexical';

import { IEditorKernel } from '@/types';
import { createDebugLogger } from '@/utils/debug';

import { parseMarkdownToLexical } from '../data-source/markdown/parse';
import { MarkdownShortCutService } from '../service/shortcut';
import { $generateNodesFromSerializedNodes } from '../utils';

const logger = createDebugLogger('plugin', 'markdown');

export const INSERT_MARKDOWN_COMMAND = createCommand<{
  editorState?: EditorState;
  historyState: HistoryStateEntry | null;
  markdown: string;
  replaceDocument?: boolean;
}>('INSERT_MARKDOWN_COMMAND');

export const GET_MARKDOWN_SELECTION_COMMAND = createCommand<{
  onResult: (_startLine: number, _endLine: number) => void;
}>('GET_MARKDOWN_SELECTION_COMMAND');

function getLineNumber(content: string, charIndex: number): number {
  return content.slice(0, Math.max(0, charIndex)).split('\n').length;
}

function restoreToEntry(editor: LexicalEditor, entry: HistoryStateEntry | null) {
  if (!entry) return;

  editor.setEditorState(entry.editorState, {
    tag: HISTORIC_TAG,
  });
}

function $getTopLevelNode(node: LexicalNode): LexicalNode {
  let current = node;
  let parent = current.getParent();
  while (parent !== null && !$isRootOrShadowRoot(parent)) {
    current = parent;
    parent = current.getParent();
  }
  return current;
}

function $insertMarkdownBlocks(nodes: LexicalNode[]): void {
  if (nodes.length === 0) return;

  let selection = $getSelection();
  if (!$isRangeSelection(selection)) {
    $getRoot().append(...nodes);
    nodes.at(-1)?.selectEnd();
    return;
  }

  if (!selection.isCollapsed()) selection.removeText();

  let placeholder = $getTopLevelNode(selection.anchor.getNode());
  if (placeholder.getTextContent() !== '') {
    selection.insertParagraph();
    selection = $getSelection();
    if (!$isRangeSelection(selection)) {
      $getRoot().append(...nodes);
      nodes.at(-1)?.selectEnd();
      return;
    }
    placeholder = $getTopLevelNode(selection.anchor.getNode());
  }

  for (const node of nodes) placeholder.insertBefore(node);
  if (placeholder.getTextContent() === '') placeholder.remove();
  nodes.at(-1)?.selectEnd();
}

function collectTextNodesFromEditor(kernel: IEditorKernel): Array<{ key: string; text: string }> {
  const result: Array<{ key: string; text: string }> = [];
  const lex = kernel.getLexicalEditor();
  if (!lex) return result;

  lex.getEditorState().read(() => {
    function walk(node: LexicalNode) {
      if ($isTextNode(node) && node.getType() !== 'cursor') {
        result.push({ key: node.getKey(), text: node.getTextContent() });
      }
      if ($isElementNode(node)) {
        node.getChildren().forEach(walk);
      }
    }
    walk($getRoot());
  });

  return result;
}

function mapTextNodeToMarkdownPosition(
  fullMarkdown: string,
  textNodes: Array<{ key: string; text: string }>,
  targetKey: string,
  targetOffset: number,
): number {
  let markdownPos = 0;

  for (const node of textNodes) {
    const offsets: number[] = [];
    let textPos = 0;
    const startMarkdownPos = markdownPos;

    while (textPos < node.text.length && markdownPos < fullMarkdown.length) {
      if (fullMarkdown[markdownPos] === node.text[textPos]) {
        offsets[textPos] = markdownPos;
        markdownPos++;
        textPos++;
      } else {
        markdownPos++;
      }
    }

    if (node.key === targetKey) {
      if (targetOffset < node.text.length) {
        return offsets[targetOffset] ?? startMarkdownPos + targetOffset;
      }
      const lastOffset = node.text.length - 1;
      return (offsets[lastOffset] ?? startMarkdownPos + lastOffset) + 1;
    }
  }

  return 0;
}

export function registerMarkdownCommand(
  editor: LexicalEditor,
  kernel: IEditorKernel,
  service: MarkdownShortCutService,
) {
  return mergeRegister(
    editor.registerCommand(
      INSERT_MARKDOWN_COMMAND,
      (payload) => {
        const { markdown } = payload;
        logger.debug('INSERT_MARKDOWN_COMMAND payload:', payload);
        if (payload.editorState) {
          editor.setEditorState(payload.editorState, { tag: HISTORIC_TAG });
        } else {
          restoreToEntry(editor, payload.historyState);
        }
        const isEmpty = editor.getEditorState().read(
          () =>
            $getRoot()
              .getTextContent()
              .replaceAll(/[\u200B-\u200D\u2060\uFEFF]/g, '') === '',
        );
        if (payload.replaceDocument || isEmpty) {
          kernel.setDocument('markdown', markdown, { keepHistory: true });
          return false;
        }
        setTimeout(() => {
          editor.update(
            () => {
              try {
                const root = parseMarkdownToLexical(markdown, service.markdownReaders);
                let selection = $getSelection();
                if (selection === null) {
                  $getRoot().selectEnd();
                  selection = $getSelection();
                }
                const nodes = $generateNodesFromSerializedNodes(root.children);
                logger.debug('INSERT_MARKDOWN_COMMAND nodes:', nodes);
                $insertMarkdownBlocks(nodes);
                return true;
              } catch (error) {
                logger.error('Failed to handle markdown paste:', error);
              }
            },
            { tag: HISTORY_PUSH_TAG },
          );
        }, 0);
        return false;
      },
      COMMAND_PRIORITY_HIGH,
    ),
    editor.registerCommand(
      GET_MARKDOWN_SELECTION_COMMAND,
      (payload) => {
        const fullMarkdown = kernel.getDocument('markdown') as unknown as string | undefined;
        if (!fullMarkdown) return false;

        const selection = kernel.getSelection();
        if (!selection || selection.type !== 'range') return false;

        const textNodes = collectTextNodesFromEditor(kernel);

        const anchorPos = mapTextNodeToMarkdownPosition(
          fullMarkdown,
          textNodes,
          selection.startNodeId,
          selection.startOffset,
        );
        const focusPos = mapTextNodeToMarkdownPosition(
          fullMarkdown,
          textNodes,
          selection.endNodeId,
          selection.endOffset,
        );

        const startPos = Math.min(anchorPos, focusPos);
        const endPos = Math.max(anchorPos, focusPos);

        payload.onResult(
          getLineNumber(fullMarkdown, startPos),
          getLineNumber(fullMarkdown, endPos),
        );
        return false;
      },
      COMMAND_PRIORITY_HIGH,
    ),
  );
}
