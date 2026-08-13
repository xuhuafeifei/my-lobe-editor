# 包入口与构建

### 四包入口

- **关键词**：`exports` `@lobehub/editor` `headless` `react` `renderer`
- **定位**：
  | 路径 | 符号 | 行号（可选） |
  | ----------------------- | ------------------------------- | ------ |
  | `package.json` | `exports` | \~25 |
  | `src/index.ts` | 主包 re-export | |
  | `src/headless/index.ts` | `HeadlessEditor` | |
  | `src/react/index.ts` | `Editor` `ChatInput` … | |
  | `src/renderer/index.ts` | `LexicalRenderer` `LexicalDiff` | |

### 构建与脚本

- **关键词**：`tsdown` `vitest` `dumi` `pnpm build`
- **定位**：
  | 路径 | 符号 | 行号（可选） |
  | ------------------ | --------- | ------ |
  | `package.json` | `scripts` | \~51 |
  | `vitest.config.ts` | 测试配置 | |
