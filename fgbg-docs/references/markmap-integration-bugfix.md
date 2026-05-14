# Markmap 集成 Bug 修复记录

> **tags**: [bugfix, markmap, codemirror-block, css, runtime]
> **related_commits**: [862ad48], [ac80579], [7673d44]
> **date**: 2026-05-14

## 问题背景

commit `862ad48` 引入了 markmap 思维导图支持，但存在以下问题：
1. `---markmap---` 回车无效果
2. ` ```markmap` 回车 UI 渲染异常
3. 整体页面 CSS 异常（选择器漂移、selection 颜色奇怪）

## 根因分析

### 1. CodemirrorNode.tsx markmap 代码被本地 revert

commit `862ad48` 在 `CodemirrorNode.tsx` 中正确添加了 markmap 预览逻辑，但工作树中这些代码被意外删除。代码块使用 ` ```markmap` 语法时，`CodemirrorNode` 缺少 markmap 相关的状态管理和渲染逻辑。

**修复**：`git checkout HEAD -- src/plugins/codemirror-block/react/CodemirrorNode.tsx`

### 2. CodemirrorBlock style.ts 缺少 markmap CSS 类

`CodemirrorNode.tsx` 渲染的 JSX 使用了 `.cm-markmap-preview`、`.cm-markmap-chart-area`、`.cm-markmap-render` 等 CSS 类名，但 `style.ts` 中没有对应的样式定义，导致 markmap 预览区域无样式、布局异常。

**修复**：在 `style.ts` 中镜像 mermaid 的 CSS 结构，新增：
- `&:has(.cm-markmap-preview) { overflow: visible; }` — 容器 overflow 适配
- `.cm-markmap-preview` — 预览区域样式
- `.cm-markmap-chart-area` — 图表区域样式
- `.cm-markmap-render` / `.cm-markmap-render-expanded` — SVG 渲染容器样式

### 3. MarkmapPlugin 缺少 import

`src/plugins/markmap/plugin/index.ts` 使用了 `KernelPlugin`、`IMarkdownShortCutService`、`$createMarkmapNode` 等多个外部符号，但文件头部完全没有对应的 import 语句。

**修复**：补全所有缺失的 import。

### 4. IMarkdownShortCutService 异步 chunk 引用错误

`IMarkdownShortCutService` 使用 TypeScript 声明合并模式（同名 `interface` + `const`）。dumi 将 markmap 插件打包到独立异步 chunk 中，该 chunk 加载时定义 `const` 值的模块尚未就绪，导致运行时 `ReferenceError: IMarkdownShortCutService is not defined`。

**修复**：将 `import { IMarkdownShortCutService }` 拆分为 `import type`（仅类型） + 字符串 key 直接调用 `kernel.requireService('MarkdownShortCutService' as any)`。

### 5. 暗色模式 selection 颜色异常

commit `7673d44` 中将暗色模式 selection 背景色从蓝色 `rgba(145, 213, 255, 12%)` 误改为绿色 `rgba(82, 196, 26, 18%)`，选中文时背景变绿不符合设计预期。

**修复**：改回蓝色系 `rgba(64, 169, 255, 24%)`。

### 6. CodemirrorBlock 外层 CSS `align-items: center` 导致选择器漂移

外层的 `align-items: center` 在 `flex-direction: column` 布局中让子元素水平居中 + 按内容收缩，导致代码块 toolbar 中的 action buttons 没有贴到右侧。

⚠️ **注意**：此 bug 非本 session 引入，是在调试过程中反复修改 CSS 又恢复导致的。最终通过恢复原始 CSS（`overflow: hidden; display: flex; flex-direction: column; align-items: center;`）解决，确认该 CSS 在 5月12日早上仍是正常工作的。

### 7. Demo 缺少 ConfigProvider

Toolbar 组件使用了 antd motion 组件（`CollapsedActions`），需要 `ConfigProvider` 上下文。Demo 页面缺少该 provider。

**修复**：在 `src/react/Editor/demos/Container.tsx` 中包裹 `<ConfigProvider>`。

### 8. Demo 未注册 ReactMarkmapPlugin

Demo 的 plugins 列表中没有 `ReactMarkmapPlugin`，导致 `---markmap---` 快捷语法无效。

**修复**：
- `src/plugins/markmap/index.ts` 中新增 `export { ReactMarkmapPlugin } from './react'`
- Demo 中导入并注册 `ReactMarkmapPlugin`

## 关键教训

1. **CSS `overflow: hidden` + flex `align-items` 组合敏感**：在 codemirror-block 中不要随意修改原始 CSS 布局，这些值之间相互依赖（BFC 创建、stretch 行为、圆角裁剪）
2. **untracked 插件文件会被 dumi 打入独立异步 chunk**：此时模块加载顺序不可靠，不能直接依赖跨 chunk 的运行时值引用
3. **TypeScript 声明合并的 `const` 值在异步模块加载时可能为 undefined**：跨 chunk 引用时用 `import type` + 字符串 key 绕过

---

## 2026-05-14 增补：MarkmapNode、`---markmap---`、悬浮按钮、嵌套粘贴（AI 检索摘要）

> **tags**: [bugfix, markmap, markdown, paste, lexical]

### 遇到的问题

1. **`---markmap---` 回车无效**（对比 `---meta2d---` 正常）：快捷方式未注册。
2. **Markmap 编辑区里粘贴**：内容被当正文 Markdown 粘贴处理，不进左侧 `textarea`。
3. **预览区「编辑 / 删除」按钮位置**：需求改到**右下角**。

### 涉及文件与处理

| 文件 | 做了什么 |
|------|----------|
| `src/plugins/markmap/plugin/index.ts` | 使用 `kernel.requireService(IMarkdownShortCutService)` 取 Markdown 快捷服务（与 `Meta2dPlugin` 一致）；**勿**误用裸露字符串当 service id，`requireService` 用 Map key 会得到 `null`，shortcut 整段不配。Markdown 读写/shortcut 保持在 `onInit` 里注册。可选：`&markmap&` 等额外 shortcut。 |
| `src/plugins/markmap/react/index.tsx` | 悬浮按钮：`position: absolute` 改为 `bottom: + right`（原为 `top`）。插件注册可与 `ReactMeta2dPlugin` 类似用语义清晰的生命周期写法。 |
| `src/plugins/common/plugin/paste-handler.ts` | 新增 `isPasteTargetNativeFormControl(event)`：`event.target` 落在 `textarea` / `input`（非 hidden）/ `select` 内则视为外链原生控件粘贴。 |
| `src/plugins/common/plugin/index.ts` | `PASTE_COMMAND` 最前：若 `isPasteTargetNativeFormControl` → `return false`，避免 VS Code / 纯文本链路抢粘贴。 |
| `src/plugins/markdown/plugin/index.ts` | `PASTE_COMMAND` 同样在入口判断：不向嵌套表单做 Markdown 自动解析/插入。 |

### 根因一句话

- **快捷方式**：服务端实例 id 必须由 `IMarkdownShortCutService` 符号传入，不能与 Map 内存 key 想当然混用。
- **粘贴**：Lexical `PASTE_COMMAND` 会跑全局处理器；嵌在编辑器外壳里的 **`textarea` 必须用 target 判定提前放行**，交给浏览器默认行为。
