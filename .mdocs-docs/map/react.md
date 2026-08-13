# React 层与渲染

### 主编辑器组件

- **关键词**：`Editor` `EditorProvider` `useEditor` `useEditorState`
- **定位**：
  | 路径 | 符号 | 行号（可选） |
  | ----------------------------------- | ----------------------------------- | ------ |
  | `src/react/index.ts` | 公开导出 | |
  | `src/react/Editor/` | `Editor` | |
  | `src/react/EditorProvider/` | `EditorProvider` `useEditorContent` | |
  | `src/react/hooks/useEditor.ts` | `useEditor` | |
  | `src/react/hooks/useEditorState.ts` | `useEditorState` | |

### Chat 输入套件

- **关键词**：`ChatInput` `SendButton` `ChatInputActions` `SlashMenu` `FloatMenu`
- **定位**：
  | 路径 | 符号 | 行号（可选） |
  | ------------------------------- | -------------------- | ------ |
  | `src/react/ChatInput/` | `ChatInput` | |
  | `src/react/ChatInputActionBar/` | `ChatInputActionBar` | |
  | `src/react/ChatInputActions/` | `ChatInputActions` | |
  | `src/react/SendButton/` | `SendButton` | |
  | `src/react/SlashMenu/` | `SlashMenu` | |
  | `src/react/FloatMenu/` | `FloatMenu` | |
  | `src/react/FloatActions/` | `FloatActions` | |

### Renderer / Diff

- **关键词**：`LexicalRenderer` `LexicalDiff` `NodeRenderer` `createDefaultRenderers`
- **定位**：
  | 路径 | 符号 | 行号（可选） |
  | ---------------------------------- | ------------------------ | ------ |
  | `src/renderer/LexicalRenderer.tsx` | `LexicalRenderer` | |
  | `src/renderer/LexicalDiff.tsx` | `LexicalDiff` | |
  | `src/renderer/renderers/` | `createDefaultRenderers` | |
  | `src/renderer/nodes/` | `rendererNodes` | |

### Kernel ↔ React 桥

- **关键词**：`ReactEditor` `LexicalComposerContext`
- **定位**：
  | 路径 | 符号 | 行号（可选） |
  | -------------------------- | -------- | ------ |
  | `src/editor-kernel/react/` | React 集成 | |
