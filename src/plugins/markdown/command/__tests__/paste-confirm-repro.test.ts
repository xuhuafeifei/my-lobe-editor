import { $getRoot } from 'lexical';
import { describe, expect, it } from 'vitest';

import Editor from '@/editor-kernel';
import { CommonPlugin } from '@/plugins/common';
import { MarkdownPlugin } from '@/plugins/markdown/plugin';

import { INSERT_MARKDOWN_COMMAND } from '../index';

const NOVEL_MARKDOWN = `# part229

**罐装的阴谋**

上回说到，艾米毒发，危在旦夕，在信使救援下，生命体征有所好转

唐科倚靠在艾米床边，一遍遍擦拭手中的枪管，只为更好的守护身边的女孩

他并未理会一旁更换盐水的信使, 目光始终落在金属光泽映射下的自己
`;

describe('confirmed markdown paste', () => {
  it('restores the pre-dialog selection and keeps paragraph breaks', async () => {
    const editor = Editor.createEditor().registerPlugins([CommonPlugin, MarkdownPlugin]);
    editor.setRootElement(document.createElement('div'));
    editor.setDocument('text', '');

    const lexical = editor.getLexicalEditor()!;
    const editorState = lexical.getEditorState();

    // Opening the confirm dialog moves DOM focus away from the editor.
    editor.blur();

    lexical.dispatchCommand(INSERT_MARKDOWN_COMMAND, {
      editorState,
      historyState: null,
      markdown: NOVEL_MARKDOWN,
    });
    await new Promise((resolve) => setTimeout(resolve, 20));

    const json = editor.getDocument('json') as any;
    expect(json.root.children.map((child: any) => child.type)).toEqual([
      'heading',
      'paragraph',
      'paragraph',
      'paragraph',
      'paragraph',
    ]);

    const markdown = String(editor.getDocument('markdown'));
    expect(markdown).toContain('# part229');
    expect(markdown).toContain('**罐装的阴谋**');
    expect(markdown).toMatch(/好转\n\n唐科/);
    expect(markdown).toMatch(/女孩\n\n他并未理会/);
  });

  it('keeps pasted blocks separate when inserting into existing content', async () => {
    const editor = Editor.createEditor().registerPlugins([CommonPlugin, MarkdownPlugin]);
    editor.setRootElement(document.createElement('div'));
    editor.setDocument('markdown', 'before');

    const lexical = editor.getLexicalEditor()!;
    lexical.update(() => $getRoot().selectEnd());
    await new Promise((resolve) => setTimeout(resolve, 0));
    const editorState = lexical.getEditorState();

    lexical.dispatchCommand(INSERT_MARKDOWN_COMMAND, {
      editorState,
      historyState: null,
      markdown: NOVEL_MARKDOWN,
    });
    await new Promise((resolve) => setTimeout(resolve, 20));

    const json = editor.getDocument('json') as any;
    expect(json.root.children.map((child: any) => child.type)).toEqual([
      'paragraph',
      'heading',
      'paragraph',
      'paragraph',
      'paragraph',
      'paragraph',
    ]);
  });
});
