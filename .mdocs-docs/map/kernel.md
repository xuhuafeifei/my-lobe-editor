# 编辑器内核

### Kernel 引擎

- **关键词**：`Kernel` `createEditor` `IEditor` `IEditorKernel` `setDocument` `registerPlugin`
- **定位**：
  | 路径 | 符号 | 行号（可选） |
  | ----------------------------- | ----------------------------------------- | ------ |
  | `src/editor-kernel/kernel.ts` | `Kernel` | \~65 |
  | `src/editor-kernel/index.ts` | `Editor.createEditor` | |
  | `src/types/kernel.ts` | `IEditor` `IEditorKernel` `IEditorPlugin` | \~96 |

### Plugin 基类

- **关键词**：`KernelPlugin` `register` `registerDecorator` `destroy`
- **定位**：
  | 路径 | 符号 | 行号（可选） |
  | ----------------------------- | -------------------------- | ------ |
  | `src/editor-kernel/plugin.ts` | `KernelPlugin` | |
  | `src/types/kernel.ts` | `IEditorPluginConstructor` | \~395 |

### DataSource

- **关键词**：`DataSource` `read` `write` `json` `markdown` `text`
- **定位**：
  | 路径 | 符号 | 行号（可选） |
  | ---------------------------------- | ------------ | ------ |
  | `src/editor-kernel/data-source.ts` | `DataSource` | |

### 热重载 / 快捷键 / 服务

- **关键词**：`setHotReloadMode` `enableHotReload` `registerService` `registerHotkey` `registerHighCommand`
- **定位**：
  | 路径 | 符号 | 行号（可选） |
  | ----------------------------- | ----------------------------------------------------- | ------ |
  | `src/editor-kernel/kernel.ts` | `setHotReloadMode` `registerService` `registerHotkey` | |
  | `src/index.ts` | `enableHotReload` `disableHotReload` | \~56 |
  | `src/types/hotkey.ts` | `HotkeyEnum` `HotkeyItem` | |
