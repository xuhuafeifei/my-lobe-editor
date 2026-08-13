# Markdown 导出流程

> 一句话：`getDocument('markdown')` 如何从 Lexical 树变成 MD 字符串，以及颜色（style）在哪一步丢掉。

## 全量导出主流程

```mermaid
flowchart TD
  A["editor.getDocument('markdown')"] --> B["Kernel 取 MarkdownDataSource"]
  B --> C["MarkdownDataSource.write(editor)"]
  C --> D["read: $getRoot()"]
  D --> E["new MarkdownWriterContext"]
  E --> F["对 root 每个 child: processChild"]
  F --> G{"节点类型?"}
  G -->|Element<br/>paragraph / heading / …| H["newChild 上下文"]
  H --> I["查 markdownWriters[type]<br/>通常只 wrap 前后缀"]
  I --> J["递归处理 children"]
  J --> F
  G -->|非 Element<br/>text / linebreak / …| K["查 markdownWriters[type]"]
  K --> L["Common text writer"]
  L --> M{"看什么?"}
  M -->|format 位<br/>bold / italic / …| N["包 ** _ ~~ ins 等"]
  M -->|style<br/>color / background| O["当前：完全忽略"]
  N --> P["appendLine 纯文本"]
  O --> P
  J --> Q["rootCtx.toString()"]
  P --> Q
  Q --> R["formatMarkdown<br/>remark + GFM"]
  R --> S["返回 MD 字符串"]
```

## 以「123，2 变红」为例

```mermaid
flowchart LR
  subgraph lexical["Lexical 树"]
    P["paragraph"]
    T1["text '1'<br/>style=''"]
    T2["text '2'<br/>style='color: rgb(220,38,38)'"]
    T3["text '3'<br/>style=''"]
    P --> T1
    P --> T2
    P --> T3
  end

  subgraph writers["text writer 三次"]
    W1["写出 '1'"]
    W2["写出 '2'<br/>style 丢弃"]
    W3["写出 '3'"]
  end

  T1 --> W1
  T2 --> W2
  T3 --> W3

  W1 --> OUT["MD: 123"]
  W2 --> OUT
  W3 --> OUT
```

## 关键缺口

颜色只活在 `TextNode.style`；导出 text writer 只读 `format`，所以红「2」和普通「2」写出一样。
