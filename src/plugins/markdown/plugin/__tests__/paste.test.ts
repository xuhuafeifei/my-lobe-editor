import { describe, expect, it, vi } from 'vitest';

import { MarkdownPlugin } from '../index';

const createKernelMock = () =>
  ({
    registerDataSource: vi.fn(),
    registerService: vi.fn(),
  }) as any;

const createClipboardDataMock = (payload: Record<string, string>) =>
  ({
    getData: (type: string) => payload[type] || '',
  }) as DataTransfer;

describe('Markdown paste', () => {
  it('should disable paste markdown handling when autoFormatMarkdown is false', () => {
    const plugin = new MarkdownPlugin(createKernelMock(), {
      autoFormatMarkdown: false,
    }) as any;

    expect(plugin.shouldHandlePasteMarkdown()).toBe(false);
  });

  it('should skip markdown detection when rich HTML content is present', () => {
    const plugin = new MarkdownPlugin(createKernelMock()) as any;

    const result = plugin.hasRichHTML(
      createClipboardDataMock({
        'text/html': '<p><strong>Bold</strong> text</p>',
      }),
    );

    expect(result).toBe(true);
  });

  it('should treat Qwen-style heading/list HTML as rich HTML', () => {
    const plugin = new MarkdownPlugin(createKernelMock()) as any;

    const result = plugin.hasRichHTML(
      createClipboardDataMock({
        'text/html':
          '<h3><strong>标题</strong></h3><ul><li><strong>地点：</strong>听瀑楼</li></ul>',
        'text/plain': '标题\n地点：听瀑楼\n门外匍匐着**项庄主**的尸体',
      }),
    );

    expect(result).toBe(true);
  });

  it('should not treat VS Code HTML markers as rich HTML for markdown bypass', () => {
    const plugin = new MarkdownPlugin(createKernelMock()) as any;

    const result = plugin.hasRichHTML(
      createClipboardDataMock({
        'text/html': '<div data-vscode="true"><strong>Bold</strong></div>',
      }),
    );

    expect(result).toBe(false);
  });
});
