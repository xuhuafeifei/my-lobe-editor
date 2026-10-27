'use client';

import { type FC, useMemo } from 'react';

import { useLexicalComposerContext } from '@/editor-kernel/react/react-context';

import { DiffPlugin } from '../plugin';
import DiffChromeView from './components/DiffChromeView';
import DiffReviewBar from './components/DiffReviewBar';
import { diffHunkTheme } from './style';
import type { ReactDiffPluginProps } from './type';

/**
 * Register during render (useMemo) before ReactPlainText setRootElement.
 * Top bar: ▲/▼ + Keep All / Undo All; hover a hunk → Keep/Undo under it.
 */
const ReactDiffPlugin: FC<ReactDiffPluginProps> = () => {
  const [editor] = useLexicalComposerContext();

  useMemo(() => {
    editor.registerPlugin(DiffPlugin, {
      decorator(node, lexicalEditor) {
        return <DiffChromeView editor={lexicalEditor} node={node} />;
      },
      theme: diffHunkTheme,
    });
  }, [editor]);

  return <DiffReviewBar editor={editor} />;
};

ReactDiffPlugin.displayName = 'ReactDiffPlugin';

export default ReactDiffPlugin;
