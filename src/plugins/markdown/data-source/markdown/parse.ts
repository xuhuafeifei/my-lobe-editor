import type { Heading, Html, Paragraph, PhrasingContent, Root, RootContent, Text } from 'mdast';
import { remark } from 'remark';
import remarkCjkFriendly from 'remark-cjk-friendly';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

import type { IElementNode, INode, IRootNode, ITextNode } from '@/editor-kernel/inode';
import { INodeHelper } from '@/editor-kernel/inode/helper';

import { logger } from '../../utils/logger';

export type MarkdownReadNode = INode | ITextNode | IElementNode;

export type MarkdownNode = Root | RootContent | PhrasingContent;

export type MarkdownReaderFunc<K> = (
  node: Extract<MarkdownNode, { type: K }>,
  children: MarkdownReadNode[],
  index: number,
) => MarkdownReadNode | MarkdownReadNode[] | false;

// 使用条件类型确保类型匹配
export type TransformerRecord = {
  [K in MarkdownNode['type']]?: MarkdownReaderFunc<K> | Array<MarkdownReaderFunc<K>>;
};

export type TransfromerRecordArray = {
  [K in MarkdownNode['type']]?: Array<MarkdownReaderFunc<K>>;
};

const selfClosingHtmlTags = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

class MarkdownContext {
  private stack: Array<IHTMLStack> = [];
  constructor(public readonly root: Root) {}

  push(html: IHTMLStack) {
    this.stack.push(html);
  }

  get isReadingHTML() {
    return this.stack.length > 0;
  }

  get last() {
    return this.stack.at(-1);
  }

  pop() {
    return this.stack.pop();
  }
}

export interface IHTMLStack {
  children: Array<MarkdownReadNode[] | MarkdownReadNode | null>;
  index: number;
  isEndTag: boolean;
  node: Html;
  tag: string;
}

function convertMdastToLexical(
  node: Root | RootContent,
  index: number,
  ctx: MarkdownContext,
  markdownReaders: TransformerRecord = {},
): MarkdownReadNode | MarkdownReadNode[] | null {
  switch (node.type) {
    case 'text': {
      const textNode = INodeHelper.createTextNode((node as Text).value);
      return textNode;
    }

    default: {
      let children: MarkdownReadNode[] = [];
      if ('children' in node && Array.isArray(node.children)) {
        let htmlStack: Array<IHTMLStack> = []; // 当前循环是否包含 HTML 标签
        children = node.children
          .reduce(
            (ret, child, index) => {
              if (child.type === 'html') {
                const isComment = child.value.startsWith('<!--') && child.value.endsWith('-->');
                if (isComment) {
                  return ret;
                }
                const tag = child.value.replaceAll(/^<\/?|>$/g, '');
                const isEndTag = child.value.startsWith('</');
                if (selfClosingHtmlTags.has(tag)) {
                  // Self-closing tag
                  const reader = markdownReaders['html'];
                  if (Array.isArray(reader)) {
                    for (const element of reader) {
                      const inode = element(child as unknown as any, [], index);
                      if (inode) {
                        ret.push(inode);
                        return ret;
                      }
                    }
                  } else if (typeof reader === 'function') {
                    const inode = reader(child as unknown as any, [], index);
                    if (inode) {
                      ret.push(inode);
                      return ret;
                    }
                  }

                  return ret;
                }
                if (isEndTag) {
                  const top = ctx.pop();
                  htmlStack.pop();
                  if (top?.tag !== tag) {
                    logger.warn('HTML tag mismatch:', tag);
                    ret.push(...(top?.children || []));
                    return ret;
                  }
                  const reader = markdownReaders['html'];
                  const children = (top.children.flat().filter(Boolean) ||
                    []) as MarkdownReadNode[];
                  if (Array.isArray(reader)) {
                    for (const element of reader) {
                      const inode = element(top.node as unknown as any, children, index);
                      if (inode) {
                        ret.push(inode);
                        return ret;
                      }
                    }
                  } else if (typeof reader === 'function') {
                    const inode = reader(top.node as unknown as any, children, index);
                    if (inode) {
                      ret.push(inode);
                      return ret;
                    }
                  }
                  if (top) {
                    ret.push(...top.children);
                  }
                  return ret;
                }

                const htmlStackItem: IHTMLStack = {
                  children: [],
                  index,
                  isEndTag,
                  node: child,
                  tag,
                };

                htmlStack.push(htmlStackItem);
                ctx.push(htmlStackItem);
                return ret;
              }

              if (htmlStack.length > 0) {
                const top = ctx.last;
                if (top) {
                  top.children.push(
                    convertMdastToLexical(child as PhrasingContent, index, ctx, markdownReaders),
                  );
                }
                return ret;
              }

              ret.push(
                convertMdastToLexical(child as PhrasingContent, index, ctx, markdownReaders),
              );
              return ret;
            },
            [] as (MarkdownReadNode | MarkdownReadNode[] | null)[],
          )
          .filter(Boolean)
          .flat() as MarkdownReadNode[];
        while (htmlStack.length > 0) {
          const tag = htmlStack.shift();
          ctx.pop();
          // @ts-expect-error not error
          children.push(INodeHelper.createTextNode(tag?.node.value), ...tag.children.flat());
          children = children.flat();
        }
      }

      if (markdownReaders[node.type]) {
        const reader = markdownReaders[node.type];

        if (Array.isArray(reader)) {
          for (const element of reader) {
            const inode = element(node as unknown as any, children, index);
            if (inode) {
              return inode;
            }
          }
        } else if (typeof reader === 'function') {
          const inode = reader(node as unknown as any, children, index);
          if (inode) {
            return inode;
          }
        }
      }

      // Fallback for unsupported nodes
      return children || null;
    }
  }
}

function registerDefaultReaders(markdownReaders: TransformerRecord) {
  if (!markdownReaders['root']) {
    markdownReaders['root'] = (node: Root, children: MarkdownReadNode[]) => {
      return {
        ...INodeHelper.createRootNode(),
        children,
      };
    };
  }
  if (!markdownReaders['paragraph']) {
    markdownReaders['paragraph'] = (node: Paragraph, children: MarkdownReadNode[]) => {
      return {
        ...INodeHelper.createParagraph(),
        children,
      };
    };
  }
  if (!markdownReaders['heading']) {
    markdownReaders['heading'] = (node: Heading, children: MarkdownReadNode[]) => {
      const headingType = `h${Math.min(Math.max(node.depth, 1), 6)}`;
      return INodeHelper.createElementNode('heading', {
        children: children,
        direction: 'ltr',
        format: '',
        indent: 0,
        tag: headingType,
      });
    };
  }
}

export function parseMarkdownToLexical(
  markdown: string,
  markdownReaders: TransformerRecord = {},
): IRootNode {
  // Step 1: Extract markmap and meta2d blocks from markdown
  const extractedBlocks: Array<{
    type: 'markmap' | 'meta2d';
    content: string;
    placeholder: string;
  }> = [];

  let processedMarkdown = markdown;

  // Extract markmap blocks - use placeholder that won't be parsed as markdown
  const markmapRegex = /^---markmap---$\n([\s\S]*?)\n^---\/markmap---$/gm;
  let match: RegExpExecArray | null;
  let counter = 0;
  while ((match = markmapRegex.exec(markdown)) !== null) {
    const placeholder = `|||MARKMAP_BLOCK_${counter}|||`;
    extractedBlocks.push({
      type: 'markmap',
      content: match[1] || '',
      placeholder,
    });
    processedMarkdown = processedMarkdown.replace(match[0], placeholder);
    counter++;
  }

  // Extract meta2d blocks
  const meta2dRegex = /^---meta2d---$\n([\s\S]*?)\n^---\/meta2d---$/gm;
  while ((match = meta2dRegex.exec(markdown)) !== null) {
    const placeholder = `|||META2D_BLOCK_${counter}|||`;
    extractedBlocks.push({
      type: 'meta2d',
      content: match[1] || '',
      placeholder,
    });
    processedMarkdown = processedMarkdown.replace(match[0], placeholder);
    counter++;
  }

  const ast = remark()
    .use(remarkCjkFriendly)
    .use(remarkMath)
    .use([[remarkGfm, { singleTilde: false }]])
    .parse(processedMarkdown);
  logger.debug('Parsed MDAST:', ast);

  const ctx = new MarkdownContext(ast);
  registerDefaultReaders(markdownReaders);

  const result = convertMdastToLexical(ast, 0, ctx, markdownReaders) as IRootNode;

  // Step 2: Replace placeholders with actual block nodes
  if (extractedBlocks.length > 0) {
    const replacePlaceholders = (node: any): any => {
      if (node.type === 'text' && typeof node.text === 'string') {
        for (const block of extractedBlocks) {
          if (node.text === block.placeholder) {
            return {
              type: block.type,
              [block.type === 'markmap' ? 'markdown' : 'diagram']: block.content,
              version: 1,
            };
          }
        }
      }
      if (node.children && Array.isArray(node.children)) {
        node.children = node.children.map(replacePlaceholders).filter(Boolean);
        // If paragraph only contains a placeholder, replace the paragraph itself
        if (
          node.type === 'paragraph' &&
          node.children.length === 1 &&
          (node.children[0].type === 'markmap' || node.children[0].type === 'meta2d')
        ) {
          return node.children[0];
        }
      }
      return node;
    };

    result.children = result.children.map(replacePlaceholders).filter(Boolean);
  }

  return result;
}
