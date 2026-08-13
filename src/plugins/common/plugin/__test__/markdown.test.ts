import { IS_BOLD, IS_UNDERLINE } from 'lexical';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import Editor from '@/editor-kernel';
import { CommonPlugin } from '@/plugins/common';
import { MarkdownPlugin } from '@/plugins/markdown/plugin';
import { TablePlugin } from '@/plugins/table/plugin';
import { IEditor } from '@/types';

describe('Common Plugin Tests', () => {
  let kernel: IEditor;

  beforeEach(() => {
    kernel = Editor.createEditor();
    kernel.registerPlugins([CommonPlugin, MarkdownPlugin, TablePlugin]);
    kernel.initNodeEditor();
  });

  it('should markdown reader work', () => {
    kernel.setDocument('markdown', 'this is <ins>underline</ins> and this is <u>underline2</u>');
    const { root } = kernel.getDocument('json') as any;

    expect(root.children.length).toBe(1);
    expect(root.children[0].type).toBe('paragraph');
    expect(root.children[0].children.length).toBe(4);

    expect(root.children[0].children[0].text).toBe('this is ');
    expect(root.children[0].children[0].format).toBe(0);

    expect(root.children[0].children[1].text).toBe('underline');
    expect(root.children[0].children[1].format & IS_UNDERLINE).toBe(IS_UNDERLINE);

    expect(root.children[0].children[2].text).toBe(' and this is ');
    expect(root.children[0].children[2].format).toBe(0);

    expect(root.children[0].children[3].text).toBe('underline2');
    expect(root.children[0].children[3].format & IS_UNDERLINE).toBe(IS_UNDERLINE);
  });

  it('should markdown html mix markdown work', () => {
    kernel.setDocument('markdown', 'this is <ins>**strong**</ins>');
    const { root } = kernel.getDocument('json') as any;

    expect(root.children.length).toBe(1);
    expect(root.children[0].type).toBe('paragraph');
    expect(root.children[0].children.length).toBe(2);

    expect(root.children[0].children[0].text).toBe('this is ');
    expect(root.children[0].children[0].format).toBe(0);

    expect(root.children[0].children[1].text).toBe('strong');
    expect(root.children[0].children[1].format & IS_UNDERLINE).toBe(IS_UNDERLINE);
    expect(root.children[0].children[1].format & IS_BOLD).toBe(IS_BOLD);
  });

  it('should export text color style as span', () => {
    kernel.setDocument('json', {
      root: {
        children: [
          {
            children: [
              {
                detail: 0,
                format: 0,
                mode: 'normal',
                style: '',
                text: '1',
                type: 'text',
                version: 1,
              },
              {
                detail: 0,
                format: 0,
                mode: 'normal',
                style: 'color: rgb(220,38,38)',
                text: '2',
                type: 'text',
                version: 1,
              },
              {
                detail: 0,
                format: 0,
                mode: 'normal',
                style: '',
                text: '3',
                type: 'text',
                version: 1,
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            textFormat: 0,
            textStyle: '',
            type: 'paragraph',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'root',
        version: 1,
      },
    });

    const markdown = kernel.getDocument('markdown') as unknown as string;
    expect(markdown).toContain('1<span style="color: rgb(220,38,38)">2</span>3');
  });

  it('should import span color style from markdown', () => {
    kernel.setDocument('markdown', '1<span style="color: rgb(220,38,38)">2</span>3\n');
    const { root } = kernel.getDocument('json') as any;
    // eslint-disable-next-line no-console
    console.log(
      '[md-color-import] json children:',
      JSON.stringify(root.children[0].children, null, 2),
    );

    expect(root.children[0].children.length).toBe(3);
    expect(root.children[0].children[0]).toMatchObject({ style: '', text: '1' });
    expect(root.children[0].children[1]).toMatchObject({
      style: 'color: rgb(220,38,38)',
      text: '2',
    });
    expect(root.children[0].children[2]).toMatchObject({ style: '', text: '3' });
  });

  it('should roundtrip color style markdown ↔ json', () => {
    const md = '1<span style="color: rgb(220,38,38)">2</span>3\n';
    kernel.setDocument('markdown', md);
    const out = kernel.getDocument('markdown') as unknown as string;
    // eslint-disable-next-line no-console
    console.log('[md-color-roundtrip] re-export:', JSON.stringify(out));
    expect(out).toContain('1<span style="color: rgb(220,38,38)">2</span>3');
  });

  it('should import span color inside table cell', () => {
    kernel.setDocument(
      'markdown',
      `| A | B |
| - | - |
| 1<span style="color: rgb(220,38,38)">2</span>3 | plain |
`,
    );
    const { root } = kernel.getDocument('json') as any;
    const cell = root.children[0].children[1].children[0]; // row1 col0
    const texts = cell.children.filter((c: any) => c.type === 'text');
    // eslint-disable-next-line no-console
    console.log('[md-color-table] cell texts:', JSON.stringify(texts, null, 2));
    const colored = texts.find((t: any) => t.text === '2');
    expect(colored?.style).toBe('color: rgb(220,38,38)');
  });
});
