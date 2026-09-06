import { describe, expect, it } from 'vitest';

import { Kernel } from '@/editor-kernel/kernel';
import { CodeblockPlugin } from '@/plugins/codeblock';
import { CommonPlugin } from '@/plugins/common';
import { MarkdownPlugin } from '@/plugins/markdown';
import { INSERT_MARKDOWN_COMMAND } from '@/plugins/markdown/command';

import { ListPlugin } from './';

const codediv = '```';

describe('List Plugin', () => {
  it('badcase: list contains codeblock', () => {
    const markdown = `-   Item 1
    ${codediv}js
    console.log('Hello, world!');
    ${codediv}
-   Item 2`;

    const editor = new Kernel();
    editor.registerPlugins([MarkdownPlugin, CommonPlugin, CodeblockPlugin, ListPlugin]);

    editor.setRootElement(document.createElement('div'));

    editor.setDocument('markdown', markdown);

    const { root } = editor.getDocument('json') as any;
    expect(root.children.length).toBe(1);
    expect(root.children[0].type).toBe('list');
    // Two list items: one with "Item 1" + codeblock, one with "Item 2"
    expect(root.children[0].children.length).toBe(2);
    expect(root.children[0].children[0].type).toBe('listitem');
    // First listitem contains both the paragraph text and code
    expect(root.children[0].children[0].children.length).toBe(2);
    expect(root.children[0].children[0].children[0].type).toBe('text');
    expect(root.children[0].children[0].children[0].text).toBe('Item 1');
    expect(root.children[0].children[0].children[1].type).toBe('code');
    // Second listitem contains just "Item 2"
    expect(root.children[0].children[1].type).toBe('listitem');
    expect(root.children[0].children[1].children.length).toBe(1);
    expect(root.children[0].children[1].children[0].text).toBe('Item 2');
  });

  it('preserves parent text when list item has nested children', () => {
    const markdown = `## 亮点

- **知识图谱**：简介
  - 子项 A
  - 子项 B
- **内置 Agent**：无子项
- **类 Git 版本模型**：简介
  - 引入 commit
  - 冲突发布
- **外置 Agent 接入**：闭环
`;

    const editor = new Kernel();
    editor.registerPlugins([MarkdownPlugin, CommonPlugin, ListPlugin]);
    editor.setRootElement(document.createElement('div'));
    editor.setDocument('markdown', markdown);

    const roundtrip = editor.getDocument('markdown') as unknown as string;

    expect(roundtrip).toContain('**知识图谱**');
    expect(roundtrip).toContain('**类 Git 版本模型**');
    expect(roundtrip).toMatch(/\*\*知识图谱\*\*[^\n]*\n\s+- 子项 A/);
    expect(roundtrip).toMatch(/\*\*类 Git 版本模型\*\*[^\n]*\n\s+- 引入 commit/);
    // nested items must stay under 类 Git, not under previous sibling 内置 Agent
    expect(roundtrip).not.toMatch(/\*\*内置 Agent\*\*[^\n]*\n\s+- 引入 commit/);
  });

  it('roundtrips full mdocs highlights nested list (user paste case)', () => {
    const markdown = `## 亮点

- **知识图谱**：用图结构承载概念与关系，由 Agent 自动抽取；耗时任务有资源调度与惰性更新，避免重复烧算力
  - 目录按树后序递归构建：自底向上提取知识节点与关联关系，再向上归纳
  - 自建任务资源池：多路 Agent 建图时通过时间片自动让出，保证排队任务都能拿到算力
  - 元数据 dirty 标记：文章变更按需重抽，脏标记向上传递到祖先目录，避免全量重算
- **内置 Agent**：Session + Tool 驱动，主路径操作可交给 AI，降低使用负担
- **类 Git 版本模型**：学习并采用 Git 的版本管理思路，用提交图管理文章演进，而非覆盖写盘
  - 引入 commit 图结构记录版本祖先关系，区分远端 head、本地开编基线与发布节点
  - 冲突发布按 merge-base（共同祖先）做三方对齐，支持草稿分支与合并，避免 last-write-wins
  - 本地草稿与服务端版本解耦：先基于某一 commit 开编，发布时再并回主线
- **外置 Agent 接入**：CLI Token 继承开发者权限，Cursor / Claude 等可安全读写知识库，嵌进开发闭环
- **轻量化底座**：域 + 文档双层权限；文件为内容真源、SQLite 管元数据，单进程私有部署
`;

    const editor = new Kernel();
    editor.registerPlugins([MarkdownPlugin, CommonPlugin, ListPlugin]);
    editor.setRootElement(document.createElement('div'));
    editor.setDocument('markdown', markdown);

    const { root } = editor.getDocument('json') as any;
    const list = root.children.find((c: any) => c.type === 'list');
    expect(list).toBeTruthy();
    expect(list.children.length).toBe(5);

    const texts = list.children.map((item: any) => {
      const collect = (nodes: any[]): string =>
        (nodes || [])
          .map((c: any) => {
            if (c.type === 'text') return c.text;
            if (c.type === 'paragraph') return collect(c.children || []);
            return '';
          })
          .join('');
      return collect(item.children || []);
    });
    expect(texts[0]).toContain('知识图谱');
    expect(texts[1]).toContain('内置 Agent');
    expect(texts[2]).toContain('类 Git');
    expect(texts[3]).toContain('外置 Agent');
    expect(texts[4]).toContain('轻量化底座');

    expect(list.children[0].children.some((c: any) => c.type === 'list')).toBe(true);
    expect(list.children[2].children.some((c: any) => c.type === 'list')).toBe(true);
    expect(list.children[1].children.some((c: any) => c.type === 'list')).toBe(false);

    const roundtrip = editor.getDocument('markdown') as unknown as string;
    expect(roundtrip).toMatch(/^- \*\*知识图谱\*\*[^\n]+\n\s+- 目录按树后序/m);
    expect(roundtrip).toMatch(/^- \*\*类 Git 版本模型\*\*[^\n]+\n\s+- 引入 commit/m);
    expect(roundtrip).not.toMatch(/^- 目录按树后序/m);
    expect(roundtrip).not.toMatch(/\*\*内置 Agent\*\*[^\n]*\n\s+- 引入 commit/);
  });

  it('paste INSERT_MARKDOWN_COMMAND keeps nested list parents', async () => {
    const markdown = `- **知识图谱**：简介长文
  - 目录按树后序
  - 自建任务资源池
- **内置 Agent**：无子项
- **类 Git 版本模型**：简介
  - 引入 commit
`;

    const editor = new Kernel();
    editor.registerPlugins([MarkdownPlugin, CommonPlugin, ListPlugin]);
    editor.setRootElement(document.createElement('div'));
    editor.setDocument('text', '');
    const lex = editor.getLexicalEditor()!;
    lex.dispatchCommand(INSERT_MARKDOWN_COMMAND, {
      historyState: null,
      markdown,
    });
    // INSERT_MARKDOWN_COMMAND defers insert with setTimeout(0)
    await new Promise((resolve) => setTimeout(resolve, 20));

    const roundtrip = editor.getDocument('markdown') as unknown as string;
    expect(roundtrip).toMatch(/^- \*\*知识图谱\*\*[^\n]+\n\s+- 目录按树后序/m);
    expect(roundtrip).toMatch(/^- \*\*类 Git 版本模型\*\*[^\n]+\n\s+- 引入 commit/m);
    expect(roundtrip).not.toMatch(/^- 目录按树后序/m);
    expect(roundtrip).not.toMatch(/\*\*内置 Agent\*\*[^\n]*\n\s+- 引入 commit/);
  });

  it('paste path is stable across repeated inserts (no flaky promote)', async () => {
    const markdown = `- **知识图谱**：用图结构承载概念与关系
  - 目录按树后序递归构建
  - 自建任务资源池
  - 元数据 dirty 标记
- **内置 Agent**：Session + Tool
- **类 Git 版本模型**：学习并采用 Git
  - 引入 commit 图结构
`;

    for (let i = 0; i < 5; i++) {
      const editor = new Kernel();
      editor.registerPlugins([MarkdownPlugin, CommonPlugin, ListPlugin]);
      editor.setRootElement(document.createElement('div'));
      editor.setDocument('text', '');
      editor.getLexicalEditor()!.dispatchCommand(INSERT_MARKDOWN_COMMAND, {
        historyState: null,
        markdown,
      });
      await new Promise((resolve) => setTimeout(resolve, 20));
      const roundtrip = editor.getDocument('markdown') as unknown as string;
      expect(roundtrip, `iteration ${i}`).toMatch(/^- \*\*知识图谱\*\*[^\n]+\n\s+- 目录按树后序/m);
      expect(roundtrip, `iteration ${i}`).not.toMatch(/^- 目录按树后序/m);
    }
  });
});
