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

  // Extract markmap blocks - support both:
  // - ---markmap---\ncontent\n---/markmap--- (with newlines)
  // - ---markmap---content---/markmap--- (no newlines)
  const markmapRegex = /---markmap---(\n?)([\s\S]*?)\n?---\/markmap---/g;
  let match: RegExpExecArray | null;
  let counter = 0;
  while ((match = markmapRegex.exec(markdown)) !== null) {
    const placeholder = `|||MARKMAP_BLOCK_${counter}|||`;
    extractedBlocks.push({
      type: 'markmap',
      content: match[2] || '',  // match[1] is optional newline, match[2] is actual content
      placeholder,
    });
    processedMarkdown = processedMarkdown.replace(match[0], placeholder);
    counter++;
  }

  // Extract meta2d blocks - support both:
  // - ---meta2d---\ncontent\n---/meta2d--- (with newlines)
  // - ---meta2d---content---/meta2d--- (no newlines)
  const meta2dRegex = /---meta2d---(\n?)([\s\S]*?)\n?---\/meta2d---/g;
  while ((match = meta2dRegex.exec(markdown)) !== null) {
    const placeholder = `|||META2D_BLOCK_${counter}|||`;
    extractedBlocks.push({
      type: 'meta2d',
      content: match[2] || '',  // match[1] is optional newline, match[2] is actual content
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
    const replacePlaceholders = (node: any): any[] | any => {
      // Handle text nodes that may contain placeholders
      if (node.type === 'text' && typeof node.text === 'string') {
        const result: any[] = [];
        let text = node.text;
        let matched = false;

        for (const block of extractedBlocks) {
          const index = text.indexOf(block.placeholder);
          if (index !== -1) {
            matched = true;
            // Text before placeholder
            if (index > 0) {
              result.push({ ...node, text: text.substring(0, index) });
            }
            // The block node
            result.push({
              type: block.type,
              [block.type === 'markmap' ? 'markdown' : 'diagram']: block.content,
              version: 1,
            });
            // Remaining text after placeholder (recursively process)
            const remaining = text.substring(index + block.placeholder.length);
            if (remaining) {
              const remainingResult = replacePlaceholders({ ...node, text: remaining });
              if (Array.isArray(remainingResult)) {
                result.push(...remainingResult);
              } else {
                result.push(remainingResult);
              }
            }
            break;
          }
        }

        if (matched) {
          return result;
        }
        return node;
      }

      // Recursively process children
      if (node.children && Array.isArray(node.children)) {
        const newChildren: any[] = [];
        for (const child of node.children) {
          const replaced = replacePlaceholders(child);
          if (Array.isArray(replaced)) {
            newChildren.push(...replaced);
          } else {
            newChildren.push(replaced);
          }
        }
        node.children = newChildren.filter(Boolean);

        // If paragraph only contains a block, lift the block up
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

    const resultChildren: any[] = [];
    for (const child of result.children) {
      const replaced = replacePlaceholders(child);
      if (Array.isArray(replaced)) {
        resultChildren.push(...replaced);
      } else {
        resultChildren.push(replaced);
      }
    }
    result.children = resultChildren.filter(Boolean);
  }

  return result;
}
