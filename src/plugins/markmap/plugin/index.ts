import {
  $createNodeSelection,
  $setSelection,
  DecoratorNode,
  type LexicalEditor,
} from 'lexical';

import type { Paragraph } from 'mdast';

import { INodeHelper } from '@/editor-kernel/inode/helper';
import { KernelPlugin } from '@/editor-kernel/plugin';
import { MARKDOWN_READER_LEVEL_HIGH } from '@/plugins/markdown/service/shortcut';
import type { IMarkdownShortCutService } from '@/plugins/markdown/service/shortcut';
import type { IEditorKernel, IEditorPlugin, IEditorPluginConstructor } from '@/types';

import { registerMarkmapCommand } from '../command';
import { $createMarkmapNode, MarkmapNode } from '../node';

const MARKMAP_SHORTCUT = /^---markmap---$/i;
const MARKMAP_BLOCK = /^---markmap---\n([\S\s]*?)\n---\/markmap---$/i;

export interface MarkmapPluginOptions {
  decorator?: (node: MarkmapNode, editor: LexicalEditor) => unknown;
  theme?: {
    markmap?: string;
  };
}

function extractParagraphText(node: Paragraph): string {
  return (node.children || [])
    .map((child) => {
      if ('value' in child && typeof child.value === 'string') {
        return child.value;
      }
      return '';
    })
    .join('');
}

export const MarkmapPlugin: IEditorPluginConstructor<MarkmapPluginOptions> = class
  extends KernelPlugin
  implements IEditorPlugin<MarkmapPluginOptions>
{
  static pluginName = 'MarkmapPlugin';

  constructor(
    protected kernel: IEditorKernel,
    public config?: MarkmapPluginOptions,
  ) {
    super();
    kernel.registerNodes([MarkmapNode]);

    if (config?.theme) {
      kernel.registerThemes(config.theme);
    }
    this.registerDecorator(
      kernel,
      MarkmapNode.getType(),
      (node: DecoratorNode<unknown>, editor: LexicalEditor) => {
        return config?.decorator ? config.decorator(node as MarkmapNode, editor) : null;
      },
    );
  }

  onInit(editor: LexicalEditor): void {
    this.register(registerMarkmapCommand(editor));
    this.registerMarkdown();
  }

  registerMarkdown() {
    const markdownService = this.kernel.requireService<IMarkdownShortCutService>(
      'MarkdownShortCutService' as any,
    );
    if (!markdownService) return;

    markdownService.registerMarkdownShortCut({
      regExp: MARKMAP_SHORTCUT,
      replace: (parentNode) => {
        const node = $createMarkmapNode('', { autoOpenEditor: true });
        parentNode.replace(node);
        const selection = $createNodeSelection();
        selection.add(node.getKey());
        $setSelection(selection);
      },
      trigger: 'enter',
      type: 'element',
    });

    markdownService.registerMarkdownWriter(MarkmapNode.getType(), (ctx, node) => {
      const markmapNode = node as MarkmapNode;
      ctx.appendLine('---markmap---');
      ctx.appendLine(markmapNode.__markdown || '');
      ctx.appendLine('---/markmap---');
      return true;
    });

    markdownService.registerMarkdownReader(
      'paragraph',
      (node) => {
        const paragraphText = extractParagraphText(node as Paragraph);
        const match = paragraphText.match(MARKMAP_BLOCK);
        if (!match) return false;
        const markdown = match[1]?.trim() || '';
        return INodeHelper.createTypeNode(MarkmapNode.getType(), {
          markdown,
        });
      },
      MARKDOWN_READER_LEVEL_HIGH,
    );
  }
};
