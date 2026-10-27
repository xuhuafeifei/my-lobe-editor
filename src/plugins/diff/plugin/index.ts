import { mergeRegister } from '@lexical/utils';
import { DecoratorNode, LexicalEditor } from 'lexical';

import { KernelPlugin } from '@/editor-kernel/plugin';
import { IEditorKernel, IEditorPlugin, IEditorPluginConstructor } from '@/types';

import { registerDiffCommands } from '../command';
import { DiffChromeNode } from '../node/DiffChromeNode';
import { DiffHunkNode } from '../node/DiffHunkNode';

export interface DiffPluginOptions {
  decorator: (node: DiffChromeNode, editor: LexicalEditor) => unknown;
  theme?: string;
}

export const DiffPlugin: IEditorPluginConstructor<DiffPluginOptions> = class
  extends KernelPlugin
  implements IEditorPlugin<DiffPluginOptions>
{
  static pluginName = 'DiffPlugin';

  constructor(
    protected kernel: IEditorKernel,
    config?: DiffPluginOptions,
  ) {
    super();
    kernel.registerNodes([DiffHunkNode, DiffChromeNode]);
    kernel.registerThemes({
      'diff-chrome': '',
      'diff-hunk': config?.theme || '',
    });
    this.registerDecorator(
      kernel,
      'diff-chrome',
      (node: DecoratorNode<unknown>, editor: LexicalEditor) => {
        return config?.decorator ? config.decorator(node as DiffChromeNode, editor) : null;
      },
    );
  }

  onInit(editor: LexicalEditor): void {
    this.register(mergeRegister(...registerDiffCommands(editor)));
  }
};
