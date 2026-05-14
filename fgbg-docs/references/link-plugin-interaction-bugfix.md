# 链接插件：编辑面板 / 跳转 / Lexical 异步状态（AI 检索）

> **tags**: [bugfix, link, lexical, markmap, paste]
> **date**: 2026-05-14

## 现象

1. **链接编辑面板只出现一次**：关闭后光标仍在同一 `LinkNode` 内时，`LinkToolbar` 里 `isLink === state.ref` 一直是 `true`，不再派发 `EDIT_LINK_COMMAND`。
2. **期望单击出现编辑**：在 `LinkNode` 的 `<a>` 上派发 `EDIT_LINK_COMMAND`。
3. **粘贴抢主编辑器**：嵌入的 `textarea`（如 Markmap）粘贴触发 MarkdownPlugin `PASTE_COMMAND`。
4. **运行时报错**：在 `queueMicrotask` 里调用 `this.getLatest()` → `Unable to find an active editor state`（须在 `editorState.read` / `editor.update` 同步回调内访问节点）。

## 修改文件（摘要）

| 文件 | 说明 |
|------|------|
| `src/plugins/link/node/LinkNode.ts` | 导出 `EDIT_LINK_COMMAND`；左键单击用 `getKey()` + `editor.getEditorState().read` + `$getNodeByKey` + `$isLinkNode` 取节点后再 `dispatchCommand`（禁止异步里 `getLatest`）；⌘/Ctrl/中键打开新标签；可编辑态 `title` 提示 |
| `src/plugins/link/react/components/LinkEdit.tsx` | 从 `LinkNode` 引入 `EDIT_LINK_COMMAND`；`linkDomRef` 去重打开，避免连点清空未提交输入 |
| `src/plugins/link/react/components/LinkToolbar.tsx` | `updateListener` 不再在「进入链接」时自动打开编辑面板；仅「离开链接」时派发关闭；`EDIT_LINK_COMMAND` 从 `LinkNode` 引入 |
| `src/plugins/common/plugin/paste-handler.ts` | `isPasteTargetNativeFormControl` |
| `src/plugins/common/plugin/index.ts` | `PASTE_COMMAND` 优先放行原生表单控件 |
| `src/plugins/markdown/plugin/index.ts` | 同上，避免嵌套 textarea 走 Markdown 粘贴转换 |
| `src/locale/index.ts`、`src/locale/zh-CN.ts` | `link.editableInteractiveHint` |

## 结论（检索用关键词）

- `getLatest` / `$getNodeByKey`：异步帧或 microtask 中不要读 Lexical 节点；用 **nodeKey + `read()`**。
- 链接 UI：**单击 `<a>`** 打开编辑；**⌘/Ctrl+单击 / 中键** 打开 URL。
- Markmap：**`IMarkdownShortCutService`** 应用 branded id `requireService`，勿误用字符串导致 `null`。
