# LobeHub Editor — 开发契约索引

> 包名：`@fgbg/lobe-editor`（fork of `@lobehub/editor`）\
> 基于 Meta Lexical 的可扩展富文本编辑器，面向 AI / Chat 场景。

## 文档地图

| 目录                             | 用途                                     |
| -------------------------------- | ---------------------------------------- |
| [map/](./map/)                   | Agent 主索引：关键词 → 文件 / 符号       |
| [diagrams/](./diagrams/)         | 给人读的 Mermaid 图                      |
| [decisions/](./decisions/)       | 设计决策记录                             |
| [bug-fixes/](./bug-fixes/)       | 事后缺陷修复记录                         |
| [requirements/](./requirements/) | 需求三件套（分析 / 设计契约 / 代码索引） |

## 需求状态

| 需求                       | 状态                            | 路径                                                                         |
| -------------------------- | ------------------------------- | ---------------------------------------------------------------------------- |
| 文件上传增强（zip / 音频） | 已同意，已实现                  | [requirements/file-upload-zip-audio/](./requirements/file-upload-zip-audio/) |
| Markdown ↔ 颜色往返        | 已同意，已实现（1.0.0-fork.20） | [requirements/md-color-roundtrip/](./requirements/md-color-roundtrip/)       |

## 快速定位

- 内核：`map/kernel.md`
- 插件：`map/plugins.md`
- React / Chat UI：`map/react.md`
- 包入口：`map/packages.md`
