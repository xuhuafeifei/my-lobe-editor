import { IS_BOLD } from 'lexical';
import { Strong } from 'mdast';
import { describe, expect, it } from 'vitest';

import { INodeHelper } from '@/editor-kernel/inode/helper';

import { parseMarkdownToLexical } from './parse';

describe('Markdown to Lexical Conversion', () => {
  it('should convert a simple markdown string to Lexical format', () => {
    const markdown = 'This is a **bold** text.';
    const lexical = parseMarkdownToLexical(markdown, {
      strong: (node: Strong, children) => {
        return children.map((child) => {
          if (INodeHelper.isTextNode(child)) {
            child.format = (child.format || 0) | IS_BOLD;
          }
          return child;
        });
      },
    });

    expect(lexical.children.length).toEqual(1);
    expect(lexical.children[0].type).toEqual('paragraph');
    // @ts-expect-error not error
    expect(lexical.children[0].children.length).toEqual(3);
    // @ts-expect-error not error
    expect(INodeHelper.isTextNode(lexical.children[0]?.children?.[1])).toBe(true);
    // @ts-expect-error not error
    expect(lexical.children[0]?.children?.[1]?.format).toBe(1);
  });

  it('should work html node', () => {
    const markdown = 'This is a <b>bold</b> text.';
    const lexical = parseMarkdownToLexical(markdown, {
      html: (node, children) => {
        if (node.value === '<b>') {
          return children.map((child) => {
            if (INodeHelper.isTextNode(child)) {
              child.format = (child.format || 0) | IS_BOLD;
            }
            return child;
          });
        }
        return false;
      },
    });

    expect(lexical.children.length).toEqual(1);
    expect(lexical.children[0].type).toEqual('paragraph');
    // @ts-expect-error not error
    expect(lexical.children[0].children.length).toEqual(3);
    // @ts-expect-error not error
    expect(INodeHelper.isTextNode(lexical.children[0]?.children?.[1])).toBe(true);
    // @ts-expect-error not error
    expect(lexical.children[0]?.children?.[1]?.format).toBe(1);
  });

  it('should work html mix markdown', () => {
    const markdown = 'This is a <b>**bold**</b> text.';
    const lexical = parseMarkdownToLexical(markdown, {
      html: (node, children) => {
        if (node.value === '<b>') {
          return children;
        }
        return false;
      },
      strong: (node: Strong, children) => {
        return children.map((child) => {
          if (INodeHelper.isTextNode(child)) {
            child.format = (child.format || 0) | IS_BOLD;
          }
          return child;
        });
      },
    });

    expect(lexical.children.length).toEqual(1);
    expect(lexical.children[0].type).toEqual('paragraph');
    // @ts-expect-error not error
    expect(lexical.children[0].children.length).toEqual(3);
    // @ts-expect-error not error
    expect(INodeHelper.isTextNode(lexical.children[0]?.children?.[1])).toBe(true);
    // @ts-expect-error not error
    expect(lexical.children[0]?.children?.[1]?.format).toBe(1);
  });

  it('should fallback list', () => {
    const markdown = '* asd\n* 123\n';
    const lexical = parseMarkdownToLexical(markdown, {});

    expect(lexical.children.length).toEqual(2);
    // @ts-expect-error not error
    expect(lexical.children[0].children.length).toEqual(1);
    // @ts-expect-error not error
    expect(lexical.children[0].children[0].text).toEqual('asd');
  });

  it('should ignore html comment', () => {
    const markdown = 'This is a <!-- comment --> text.';
    const lexical = parseMarkdownToLexical(markdown, {});
    expect(lexical.children.length).toEqual(1);

    // @ts-expect-error not error
    expect(lexical.children[0].children.length).toEqual(2);

    // @ts-expect-error not error
    expect(lexical.children[0].children[0].text).toEqual('This is a ');
    // @ts-expect-error not error
    expect(lexical.children[0].children[1].text).toEqual(' text.');
  });

  it('should NOT split list items at Chinese colon', () => {
    // This is the bug: "1. **开关关闭时**：不查询果切任务" gets split into 2 listitems at "："
    const markdown = '1. **开关关闭时**：不查询果切任务';

    // Mock the readers like the actual plugins do
    const { IS_BOLD } = require('lexical');
    const readers = {
      strong: (node: any, children: any[]) => {
        return children.map((child: any) => {
          if (child.type === 'text') {
            child.format = (child.format || 0) | IS_BOLD;
          }
          return child;
        });
      },
      list: (node: any, children: any[]) => {
        return {
          children,
          direction: 'ltr',
          format: '',
          indent: 0,
          listType: node.ordered ? 'number' : 'bullet',
          start: node.start || 1,
          tag: node.ordered ? 'ol' : 'ul',
          type: 'list',
          version: 1,
        };
      },
      listItem: (node: any, children: any[], index: number) => {
        // Fixed implementation
        const isCheck = typeof node.checked === 'boolean';
        const nestedList = children.find((c: any) => c.type === 'list');
        if (nestedList) {
          return {
            checked: isCheck ? node.checked : undefined,
            children: [nestedList],
            direction: 'ltr',
            format: '',
            indent: 0,
            type: 'listitem',
            value: index + 1,
            version: 1,
          };
        }
        const listItemChildren = children.flatMap((v: any) => {
          if (v.type === 'paragraph') {
            return v.children || [];
          }
          return v;
        });
        return {
          checked: isCheck ? node.checked : undefined,
          children: listItemChildren,
          direction: 'ltr',
          format: '',
          indent: 0,
          type: 'listitem',
          value: index + 1,
          version: 1,
        };
      },
      paragraph: (node: any, children: any[]) => {
        return {
          children,
          direction: 'ltr',
          format: '',
          indent: 0,
          textFormat: 0,
          textStyle: '',
          type: 'paragraph',
          version: 1,
        };
      },
    };

    const lexical = parseMarkdownToLexical(markdown, readers);

    // Should be ONE list with ONE listitem
    expect(lexical.children.length).toEqual(1);
    // @ts-ignore - accessing nested structure
    const list = lexical.children[0];
    expect(list.type).toEqual('list');
    // @ts-ignore - accessing nested structure
    expect(list.children.length).toEqual(1); // Should be ONE listitem, not two!
    // @ts-ignore - accessing nested structure
    const listitem = list.children[0];
    expect(listitem.type).toEqual('listitem');
    // @ts-ignore - accessing nested structure
    expect(listitem.value).toEqual(1); // Should be 1, not split into 1 and 2
    // @ts-ignore - accessing nested structure
    expect(listitem.children.length).toEqual(2); // Should have 2 text nodes (strong + text)
  });

  it('should output origin xml no reader', () => {
    const markdown =
      '不存在从 "int" 转换到 "std::__cxx11::basic_string<char, std::char_traits<char>, std::allocator<char>>" 的适当构造函数';
    const lexical = parseMarkdownToLexical(markdown, {});
    expect(lexical.children.length).toEqual(1);

    // @ts-expect-error not error
    expect(lexical.children[0].children.length).toEqual(5);

    // @ts-expect-error not error
    expect(lexical.children[0].children[0].text).toEqual(
      '不存在从 "int" 转换到 "std::__cxx11::basic_string<char, std::char_traits',
    );
    // @ts-expect-error not error
    expect(lexical.children[0].children[1].text).toEqual('<char>');
    // @ts-expect-error not error
    expect(lexical.children[0].children[2].text).toEqual(', std::allocator');
    // @ts-expect-error not error
    expect(lexical.children[0].children[3].text).toEqual('<char>');
    // @ts-expect-error not error
    expect(lexical.children[0].children[4].text).toEqual('>" 的适当构造函数');
  });

  it('should output origin xml no reader case 2', () => {
    const markdown = 'sql<number>`COALESCE(SUM(${plugins.installCount}), 0)`';
    const lexical = parseMarkdownToLexical(markdown, {
      inlineCode: (node, children) => {
        return [INodeHelper.createTextNode('`' + node.value + '`')];
      },
    });

    expect(lexical.children.length).toEqual(1);

    // @ts-expect-error not error
    expect(lexical.children[0].children.length).toEqual(3);

    // @ts-expect-error not error
    expect(lexical.children[0].children[0].text).toEqual('sql');
    // @ts-expect-error not error
    expect(lexical.children[0].children[1].text).toEqual('<number>');
    // @ts-expect-error not error
    expect(lexical.children[0].children[2].text).toEqual(
      '`COALESCE(SUM(${plugins.installCount}), 0)`',
    );
  });

  it('should parse markmap block into markmap node', () => {
    const markdown = '---markmap---\n- Root\n  - Child\n---/markmap---';

    // No need for special readers - markmap blocks are extracted before parsing
    const lexical = parseMarkdownToLexical(markdown, {});

    expect(lexical.children.length).toEqual(1);
    // @ts-ignore accessing type
    expect(lexical.children[0].type).toEqual('markmap');
    // @ts-ignore accessing type
    expect(lexical.children[0].markdown).toContain('- Root');
  });

  it('should parse meta2d block into meta2d node', () => {
    const markdown = '---meta2d---\ndata\n---/meta2d---';

    // No need for special readers - meta2d blocks are extracted before parsing
    const lexical = parseMarkdownToLexical(markdown, {});

    expect(lexical.children.length).toEqual(1);
    // @ts-ignore accessing type
    expect(lexical.children[0].type).toEqual('meta2d');
    // @ts-ignore accessing type
    expect(lexical.children[0].diagram).toEqual('data');
  });
});
