import {
  $insertNodes,
  COMMAND_PRIORITY_EDITOR,
  LexicalCommand,
  LexicalEditor,
  createCommand,
} from 'lexical';

import { $createMarkmapNode } from '../node';

export const INSERT_MARKMAP_COMMAND: LexicalCommand<void> = createCommand('INSERT_MARKMAP_COMMAND');

export function registerMarkmapCommand(editor: LexicalEditor): () => void {
  return editor.registerCommand(
    INSERT_MARKMAP_COMMAND,
    () => {
      editor.update(() => {
        const node = $createMarkmapNode('', { autoOpenEditor: true });
        $insertNodes([node]);
      });
      return true;
    },
    COMMAND_PRIORITY_EDITOR,
  );
}
