# .mdocs-docs — Lobe Editor 开发契约

> 包名：`@fgbg/lobe-editor`（fork of `@lobehub/editor`）\
> 自 `fgbg-docs/` 迁入，结构遵循 **mdocs-dev** skill。\
> Agent 先查 `map/`；人读长文看 `archive/`；修复个案看 `bug-fixes/`。

## 文档地图

| 我想了解……                     | 读这里                             |
| ------------------------------ | ---------------------------------- |
| 关键词 → 代码坐标              | [`map/`](./map/)                   |
| 架构 / 模块 / 插件长文（人读） | [`archive/`](./archive/)           |
| 技术决策 ADR                   | [`decisions/`](./decisions/)       |
| Bug 修复记录                   | [`bug-fixes/`](./bug-fixes/)       |
| 已落地功能设计                 | [`requirements/`](./requirements/) |
| Mermaid 图册                   | [`diagrams/`](./diagrams/)         |

### archive 速查

| 主题              | 文件                                                                                                         |
| ----------------- | ------------------------------------------------------------------------------------------------------------ |
| 架构总览          | [`archive/architecture-overview.md`](./archive/architecture-overview.md)                                     |
| 数据流            | [`archive/data-flow.md`](./archive/data-flow.md)                                                             |
| Editor Kernel     | [`archive/editor-kernel.md`](./archive/editor-kernel.md)                                                     |
| 插件系统          | [`archive/plugin-system.md`](./archive/plugin-system.md)                                                     |
| React 层          | [`archive/react-layer.md`](./archive/react-layer.md)                                                         |
| Renderer          | [`archive/renderer.md`](./archive/renderer.md)                                                               |
| Headless          | [`archive/headless.md`](./archive/headless.md)                                                               |
| 插件分册          | [`archive/plugins/`](./archive/plugins/)                                                                     |
| 代码路径索引表    | [`archive/code-index.md`](./archive/code-index.md)                                                           |
| i18n              | [`archive/i18n-system.md`](./archive/i18n-system.md)                                                         |
| Markdown 快捷转换 | [`archive/markdown-shortcut-transformation-system.md`](./archive/markdown-shortcut-transformation-system.md) |
| Meta2d 实现笔记   | [`archive/meta2d-plugin-implementation-notes.md`](./archive/meta2d-plugin-implementation-notes.md)           |
| Mermaid 预览浮层  | [`archive/mermaid-preview-overlay.md`](./archive/mermaid-preview-overlay.md)                                 |
| Known Issues      | [`archive/known-issues.md`](./archive/known-issues.md)                                                       |

### requirements 状态

| 需求                       | 状态                            | 路径                                                                                   |
| -------------------------- | ------------------------------- | -------------------------------------------------------------------------------------- |
| 文件上传增强（zip / 音频） | 已同意，已实现                  | [requirements/file-upload-zip-audio/](./requirements/file-upload-zip-audio/)           |
| Markdown ↔ 颜色往返        | 已同意，已实现（1.0.0-fork.20） | [requirements/md-color-roundtrip/](./requirements/md-color-roundtrip/)                 |
| Markdown 粘贴确认          | 已同意（历史迁入）              | [requirements/markdown-paste-confirm/](./requirements/markdown-paste-confirm/)         |
| Markdown 图片 transformer  | 已同意（历史迁入）              | [requirements/markdown-image-transformer/](./requirements/markdown-image-transformer/) |

## 快速定位（map）

- 内核：`map/kernel.md` → 人读 [`archive/editor-kernel.md`](./archive/editor-kernel.md)
- 插件：`map/plugins.md` → 人读 [`archive/plugin-system.md`](./archive/plugin-system.md) / [`archive/plugins/`](./archive/plugins/)
- React / Chat UI：`map/react.md` → 人读 [`archive/react-layer.md`](./archive/react-layer.md)
- 包入口：`map/packages.md`
