'use client';

import type { LexicalEditor } from 'lexical';
import { type FC } from 'react';

import type { DiffChromeNode } from '../../node/DiffChromeNode';
import { styles } from '../style';

interface DiffChromeViewProps {
  editor: LexicalEditor;
  node: DiffChromeNode;
}

/** Old-line preview only (Cursor-style). Keep/Undo live in the floating bar. */
const DiffChromeView: FC<DiffChromeViewProps> = ({ node }) => {
  if (node.kind === 'update' && node.oldText) {
    return (
      <div className={styles.chrome} contentEditable={false}>
        <div className={styles.deleteLine}>{node.oldText}</div>
      </div>
    );
  }
  // delete / insert: wash comes from parent .is-delete / .is-insert
  return null;
};

DiffChromeView.displayName = 'DiffChromeView';

export default DiffChromeView;
