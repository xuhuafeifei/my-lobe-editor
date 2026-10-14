import {
  $createTextNode,
  $getSelection,
  $insertNodes,
  $isRangeSelection,
  COMMAND_PRIORITY_HIGH,
  type LexicalEditor,
  PASTE_COMMAND,
} from 'lexical';

import {
  isPasteTargetCodeEditor,
  isPasteTargetNativeFormControl,
} from '@/plugins/common/plugin/paste-handler';
import type { LinkAttributes } from '@/plugins/link/node/LinkNode';
import { $createLinkNode } from '@/plugins/link/node/LinkNode';
import { $isSelectionInCodeContext } from '@/plugins/markdown/plugin';

const BARE_HTTP_URL = /^https?:\/\/\S+$/i;

function normalizePasteText(raw: string): string {
  return raw.replaceAll(/[\u200B-\u200D\u2060\uFEFF]/g, '').trim();
}

/**
 * When clipboard is plain text that is a single http(s) URL (e.g. browser address bar),
 * insert a LinkNode instead of leaving bare text.
 */
export function registerPasteAutoLink(
  editor: LexicalEditor,
  options?: {
    attributes?: LinkAttributes;
    linkRegex?: RegExp;
    validateUrl?: (url: string) => boolean;
  },
): () => void {
  const linkRegex = options?.linkRegex ?? BARE_HTTP_URL;

  return editor.registerCommand(
    PASTE_COMMAND,
    (event) => {
      // Duck-type: Node test envs may lack ClipboardEvent global
      if (!event || typeof event !== 'object' || !('clipboardData' in event)) return false;
      const clipboardEvent = event as ClipboardEvent;
      if (isPasteTargetNativeFormControl(clipboardEvent)) return false;
      if (isPasteTargetCodeEditor(clipboardEvent)) return false;

      const clipboardData = clipboardEvent.clipboardData;
      if (!clipboardData) return false;

      // Rich HTML (including <a href>) — let Lexical / markdown path handle it
      const html = clipboardData.getData('text/html');
      if (html && /<a\s[^>]*href\s*=/i.test(html)) {
        return false;
      }

      const text = normalizePasteText(clipboardData.getData('text/plain') || '');
      if (!text || !linkRegex.test(text)) return false;
      if (options?.validateUrl && !options.validateUrl(text)) return false;

      const inCode = editor.getEditorState().read(() => $isSelectionInCodeContext());
      if (inCode) return false;

      clipboardEvent.preventDefault();
      editor.update(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;

        const linkNode = $createLinkNode(text, options?.attributes);
        linkNode.append($createTextNode(text));
        $insertNodes([linkNode]);
      });

      return true;
    },
    COMMAND_PRIORITY_HIGH,
  );
}
