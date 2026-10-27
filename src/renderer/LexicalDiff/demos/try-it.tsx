import { createHeadlessEditor } from '@/headless';
import { LexicalDiff } from '@/renderer';
import { Button, Flex, Input } from 'antd';
import type { SerializedEditorState } from 'lexical';
import { useCallback, useState } from 'react';

const DEFAULT_OLD = `# Welcome to the Lobe Editor Demo!

> In case you were wondering what the black box at the bottom is – it's the debug view, showing the current state of the editor. You can disable it by pressing on the settings control in the bottom-left of your screen and toggling the debug view setting.

The playground is a demo environment built with \`@lobehub/editor\`. Try typing in **some text** with *different formats*.

- Visit the [Lobe Editor website](https://editor.lobehub.com) for documentation and more information.
- Check out the code on our [GitHub repository](https://github.com/lobehub/lobe-editor).
- Playground code [Playground code](https://github.com/lobehub/lobe-editor/blob/master/src/react/Editor/demos/index.tsx) can be found here.
- Join our [Discover Server](https://discord.gg/AYFPHvv2jT) and chat with the team.

Lastly, we're constantly adding cool new features to this playground. So make sure you check back here when you next get a chance 🙂.

\`\`\`typescript
import { Editor } from '@lobehub/editor';
\`\`\`
`;

const DEFAULT_NEW = `# Welcome to the Lobe Editor Demo!

> In case you were wondering what the black box at the bottom is – it's the debug view, showing the current state of the editor. You can disable it by pressing the settings control in the bottom-left of your screen and toggling the debug view setting.

The playground is a demo environment built with \`@lobehub/editor\`. Try typing in **some text** with *different formats*.

- Visit the [Lobe Editor website](https://editor.lobehub.com) for documentation and more information.
- Check out the code on our [GitHub repository](https://github.com/lobehub/lobe-editor).
- The playground code can be found [here](https://github.com/lobehub/lobe-editor/blob/master/src/react/Editor/demos/index.tsx).
- Join our [Discord server](https://discord.gg/AYFPHvv2jT) and chat with the team.

Lastly, we're constantly adding cool new features to this playground, so make sure to check back here when you next get a chance 🙂.

\`\`\`typescript
import { Editor } from '@lobehub/editor';
\`\`\`
`;

function markdownToEditorState(markdown: string): SerializedEditorState {
  const editor = createHeadlessEditor();
  try {
    editor.hydrateMarkdown(markdown);
    return editor.export().editorData;
  } finally {
    editor.destroy();
  }
}

function buildPair(oldMarkdown: string, newMarkdown: string) {
  return {
    newValue: markdownToEditorState(newMarkdown),
    oldValue: markdownToEditorState(oldMarkdown),
  };
}

export default () => {
  const [oldMd, setOldMd] = useState(DEFAULT_OLD);
  const [newMd, setNewMd] = useState(DEFAULT_NEW);
  const [pair, setPair] = useState<{
    oldValue: SerializedEditorState;
    newValue: SerializedEditorState;
  } | null>(() => {
    try {
      return buildPair(DEFAULT_OLD, DEFAULT_NEW);
    } catch {
      return null;
    }
  });
  const [error, setError] = useState<string | null>(null);

  const compare = useCallback(() => {
    try {
      setError(null);
      setPair(buildPair(oldMd, newMd));
    } catch (e) {
      setPair(null);
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [newMd, oldMd]);

  return (
    <Flex gap={16} style={{ maxWidth: 1100 }} vertical>
      <Flex gap={12} wrap="wrap">
        <div style={{ flex: 1, minWidth: 280 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>OLD（Markdown）</div>
          <Input.TextArea
            onChange={(e) => setOldMd(e.target.value)}
            rows={14}
            style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 12 }}
            value={oldMd}
          />
        </div>
        <div style={{ flex: 1, minWidth: 280 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>NEW（Markdown）</div>
          <Input.TextArea
            onChange={(e) => setNewMd(e.target.value)}
            rows={14}
            style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 12 }}
            value={newMd}
          />
        </div>
      </Flex>

      <Flex align="center" gap={12}>
        <Button onClick={compare} type="primary">
          比对
        </Button>
        {error ? <span style={{ color: 'var(--ant-color-error)' }}>{error}</span> : null}
      </Flex>

      {pair ? (
        <LexicalDiff
          labels={{ new: 'NEW', old: 'OLD' }}
          newValue={pair.newValue}
          oldValue={pair.oldValue}
          style={{ fontFamily: 'system-ui, sans-serif', lineHeight: 1.8 }}
        />
      ) : null}
    </Flex>
  );
};
