# 插件地图

插件约定目录：`plugin/`（核心）・`react/` · `command/` · `node/` · `service/` · `index.ts`

### 核心插件

- **关键词**：`CommonPlugin` `MarkdownPlugin` `UploadPlugin`
- **定位**：
  | 路径 | 符号 | 行号（可选） |
  | -------------------------------------- | ---------------- | ------ |
  | `src/plugins/common/plugin/index.ts` | `CommonPlugin` | |
  | `src/plugins/markdown/plugin/index.ts` | `MarkdownPlugin` | |
  | `src/plugins/upload/plugin/index.ts` | `UploadPlugin` | |

### 内容插件

- **关键词**：`SlashPlugin` `MentionPlugin` `CodeblockPlugin` `ImagePlugin` `TablePlugin` `ListPlugin` `FilePlugin` `isAllowedUploadFile`
- **定位**：
  | 路径 | 符号 | 行号（可选） |
  | ------------------------------------------------- | --------------------- | ------ |
  | `src/plugins/slash/plugin/index.ts` | `SlashPlugin` | |
  | `src/plugins/mention/plugin/index.ts` | `MentionPlugin` | |
  | `src/plugins/codeblock/plugin/index.ts` | `CodeblockPlugin` | |
  | `src/plugins/codemirror-block/plugin/index.ts` | `CodemirrorPlugin` | |
  | `src/plugins/code/plugin/index.ts` | `CodePlugin` | |
  | `src/plugins/image/plugin/index.ts` | `ImagePlugin` | |
  | `src/plugins/table/plugin/index.ts` | `TablePlugin` | |
  | `src/plugins/list/plugin/index.ts` | `ListPlugin` | |
  | `src/plugins/file/plugin/index.ts` | `FilePlugin` | |
  | `src/plugins/file/utils/matchFile.ts` | `isAllowedUploadFile` | |
  | `src/plugins/file/react/components/ReactFile.tsx` | `ReactFile` | |
  | `src/plugins/link/plugin/index.ts` | `LinkPlugin` | |
  | `src/plugins/link-highlight/plugin/index.ts` | `LinkHighlightPlugin` | |
  | `src/plugins/hr/plugin/index.ts` | `HRPlugin` | |
  | `src/plugins/math/plugin/index.ts` | `MathPlugin` | |
  | `src/plugins/markmap/plugin/index.ts` | `MarkmapPlugin` | |
  | `src/plugins/meta2d/plugin/index.ts` | `Meta2dPlugin` | |
  | `src/plugins/inode/plugin/index.ts` | `INodePlugin` | |
  | `src/plugins/auto-complete/plugin/index.ts` | `AutoCompletePlugin` | |

### UI-only / 无 KernelPlugin 类

- **关键词**：`toolbar` `outline` `FloatMenu` `SlashMenu`
- **定位**：
  | 路径 | 符号 | 行号（可选） |
  | ------------------------------ | ------------------------------- | ------ |
  | `src/plugins/toolbar/index.ts` | toolbar React + command | |
  | `src/plugins/outline/index.ts` | `OutlinePanel` `OutlineToolbar` | |

### Headless 侧插件变体

- **关键词**：`HeadlessCodeblockPlugin` `HeadlessEditor`
- **定位**：
  | 路径 | 符号 | 行号（可选） |
  | -------------------------------- | ------------------------- | ------ |
  | `src/headless/index.ts` | `HeadlessEditor` | |
  | `src/headless/plugins/codeblock` | `HeadlessCodeblockPlugin` | |
