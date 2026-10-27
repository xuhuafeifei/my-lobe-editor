import {
  APPLY_DIFF_OP_COMMAND,
  ReactDiffPlugin,
  makeParagraphBlock,
} from '@/plugins/diff';
import { ReactListPlugin, ReactMarkdownPlugin, type IEditor } from '@/index';
import { Editor, useEditor } from '@/react';
import { Button, Text } from '@lobehub/ui';
import { createStaticStyles } from 'antd-style';
import { type FC, useCallback, useState } from 'react';

const styles = createStaticStyles(({ css }) => ({
  editor: css`
    position: relative;
    min-height: 280px;
    padding: 16px;
    border: 1px solid #e8e8e8;
    border-radius: 8px;
  `,
  shell: css`
    position: relative;
  `,
  toolbar: css`
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  `,
  wrap: css`
    display: flex;
    flex-direction: column;
    gap: 12px;
  `,
}));

const INITIAL = JSON.stringify({
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: '第一段：把光标放在这一段，点下面的按钮试 Diff。',
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
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: '第二段：也可以点这里再 Update / Delete / Insert after。',
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
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: '第三段：接受或拒绝会写回同一 Editor，不会换编辑器。',
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

const Demo: FC = () => {
  const editor = useEditor();
  const [hint, setHint] = useState('把光标放进某一段，再点按钮（点按钮不会抢走光标）。');

  const runOp = useCallback(
    (payload: Parameters<IEditor['dispatchCommand']>[1], okMsg: string) => {
      const lexical = editor.getLexicalEditor();
      if (!lexical) {
        setHint('编辑器未就绪');
        return;
      }
      try {
        // Prefer selection; if lost, fall back to slot 1
        let ok = editor.dispatchCommand(APPLY_DIFF_OP_COMMAND, payload as never);
        if (!ok) {
          ok = editor.dispatchCommand(APPLY_DIFF_OP_COMMAND, {
            ...(payload as object),
            afterSlot: 1,
            slot: 1,
          } as never);
        }
        setHint(ok ? okMsg : '操作失败：选区无效或该段已是 Diff hunk。点进正文后再试。');
      } catch (e) {
        console.error(e);
        setHint(`异常：${e instanceof Error ? e.message : String(e)}`);
      }
    },
    [editor],
  );

  return (
    <div className={styles.wrap}>
      <div className={styles.toolbar}>
        <Button
          onClick={() =>
            runOp(
              {
                kind: 'update',
                newBlock: makeParagraphBlock('【提案】这段已被 Update 成新内容（可直接改字）。'),
              },
              'Update：上方红旧文，下方新文可编辑',
            )
          }
          onMouseDown={(e) => e.preventDefault()}
        >
          Update 当前段
        </Button>
        <Button
          danger
          onClick={() =>
            runOp({ kind: 'delete' }, 'Delete：当前段标红，接受删除 / 拒绝保留')
          }
          onMouseDown={(e) => e.preventDefault()}
        >
          Delete 当前段
        </Button>
        <Button
          onClick={() =>
            runOp(
              {
                kind: 'insert_after',
                newBlock: makeParagraphBlock('【提案】新建段落（可直接改字）。'),
              },
              'Insert：新段落可编辑，接受写入 / 拒绝丢弃',
            )
          }
          onMouseDown={(e) => e.preventDefault()}
          type="primary"
        >
          Insert after 当前段
        </Button>
      </div>
      <Text type="secondary">{hint}</Text>
      <div className={styles.shell}>
        <Editor
          className={styles.editor}
          content={INITIAL}
          editor={editor}
          plugins={[ReactMarkdownPlugin, ReactListPlugin, ReactDiffPlugin]}
          type="json"
        />
      </div>
    </div>
  );
};

export default Demo;
