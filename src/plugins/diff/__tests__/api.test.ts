import type { SerializedEditorState, SerializedLexicalNode } from 'lexical';
import { describe, expect, it } from 'vitest';

import { flattenCanonicalState } from '../api';
import { makeParagraphBlock } from '../utils/sample-block';

function rootState(children: SerializedLexicalNode[]): SerializedEditorState {
  return {
    root: {
      children,
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  } as SerializedEditorState;
}

function hunk(
  kind: 'update' | 'delete' | 'insert',
  oldBlock: SerializedLexicalNode | null,
  content: SerializedLexicalNode,
): SerializedLexicalNode {
  return {
    children: [
      {
        children: [],
        kind,
        oldText: '',
        opId: 'op-1',
        type: 'diff-chrome',
        version: 1,
      },
      content,
    ],
    kind,
    oldBlock,
    opId: 'op-1',
    type: 'diff-hunk',
    version: 1,
  } as unknown as SerializedLexicalNode;
}

describe('flattenCanonicalState', () => {
  it('keep: update keeps new content', () => {
    const oldP = makeParagraphBlock('old');
    const newP = makeParagraphBlock('new');
    const state = rootState([hunk('update', oldP, newP)]);
    const flat = flattenCanonicalState(state, 'keep');
    expect(flat.root.children).toHaveLength(1);
    expect(JSON.stringify(flat.root.children[0])).toContain('new');
    expect(JSON.stringify(flat.root.children[0])).not.toContain('diff-hunk');
  });

  it('reject: update restores oldBlock', () => {
    const oldP = makeParagraphBlock('old');
    const newP = makeParagraphBlock('new');
    const state = rootState([hunk('update', oldP, newP)]);
    const flat = flattenCanonicalState(state, 'reject');
    expect(JSON.stringify(flat.root.children[0])).toContain('old');
  });

  it('keep: delete removes block', () => {
    const oldP = makeParagraphBlock('gone');
    const state = rootState([hunk('delete', oldP, oldP)]);
    const flat = flattenCanonicalState(state, 'keep');
    expect(flat.root.children).toHaveLength(0);
  });

  it('reject: insert drops hunk', () => {
    const neu = makeParagraphBlock('added');
    const state = rootState([hunk('insert', null, neu)]);
    const flat = flattenCanonicalState(state, 'reject');
    expect(flat.root.children).toHaveLength(0);
  });
});
