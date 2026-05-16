# Markdown ListItem 解析 Bug 修复记录

> **tags**: [bugfix, list, markdown, parser]
> **related_modules**: [src/plugins/list/plugin/index.ts, src/plugins/markdown/data-source/markdown/parse.ts]
> **date**: 2025-05-16
> **related_commits**: [9cf75c5]

## 问题现象

当粘贴包含有序列表的 Markdown 内容时，单个 listItem 节点被错误地拆分成多个独立的 listItem 节点。

**输入**：
```markdown
1. **开关关闭时**：不查询果切任务
```

**错误输出结构**：
```
list
  ├─ listitem (value=1)
  │   └─ text ("开关关闭时")
  └─ listitem (value=2)   ← 错误！这里不应该出现第二个 listitem
      └─ text ("：不查询果切任务")
```

**期望输出结构**：
```
list
  └─ listitem (value=1)
      ├─ text ("开关关闭时", format=bold)
      └─ text ("：不查询果切任务")
```

## 根因分析

### 1. ListItem Reader 返回数组而非单个节点

**问题代码** (`src/plugins/list/plugin/index.ts`):

```typescript
markdownService.registerMarkdownReader('listItem', (node, children, index) => {
  return children.map((v) => {  // ← 返回数组！
    if (v.type === 'paragraph') {
      return INodeHelper.createElementNode('listitem', {
        children: v.children,  // 把 paragraph 的 children 直接作为 listitem 的 children
        value: index + 1,
        // ...
      });
    }
    // ...
  });
});
```

**问题**：`listItem` reader 通过 `children.map()` 返回一个**数组**，而不是**单个 `listitem` 节点**。

### 2. `.flat()` 把数组展平导致结构破坏

**问题代码** (`src/plugins/markdown/data-source/markdown/parse.ts`):

```typescript
children = node.children
  .reduce(...)
  .filter(Boolean)
  .flat();  // ← 这里把 listItem 返回的数组被展平了
```

当 `list` reader 收到 `listItem` reader 返回的 `[listitem1, listitem2]` 数组时，`.flat()` 会把数组元素直接展开，导致结构被破坏。

## 修复方案

### 修改 ListItem Reader 返回单个节点

```typescript
markdownService.registerMarkdownReader('listItem', (node, children, index) => {
  const isCheck = typeof node.checked === 'boolean';

  // 处理嵌套列表的情况：如果 children 中有 list，应该把它作为唯一子节点
  const nestedList = children.find((c) => c.type === 'list');
  if (nestedList) {
    return INodeHelper.createElementNode('listitem', {
      checked: isCheck ? node.checked : undefined,
      children: [nestedList],
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'listitem',
      value: index + 1,
      version: 1,
    });
  }

  // 普通情况：所有子节点的 children 合并到 listitem（paragraph 的 children 直接打平）
  const listItemChildren = children.flatMap((v) => {
    if (v.type === 'paragraph') {
      return v.children || [];
    }
    return v;
  });

  return INodeHelper.createElementNode('listitem', {  // ← 直接返回单个节点
    checked: isCheck ? node.checked : undefined,
    children: listItemChildren,
    direction: 'ltr',
    format: '',
    indent: 0,
    type: 'listitem',
    value: index + 1,
    version: 1,
  });
});
```

**关键点：
1. **返回单个节点**，而不是 `children.map()` 的数组
2. **处理嵌套列表**：如果 children 中有 `list`，直接把它作为唯一子节点
3. **打平 paragraph**：paragraph 的 children 直接放入 listitem 的 children

## 修复验证

### 测试用例 1：有序列表 + 加粗

```markdown
1. **开关关闭时**：不查询果切任务
```

**修复后**：
```
list
  └─ listitem (value=1)
      ├─ text ("开关关闭时", format=1: bold)
      └─ text ("：不查询果切任务")
```

### 测试用例 2：列表包含代码块

```markdown
-   Item 1
    ```js
    console.log('Hello, world!');
    ```
-   Item 2
```

**修复后**：
```
list
  ├─ listitem
  │   ├─ text ("Item 1")
  │   └─ code
  └─ listitem
      └─ text ("Item 2")
```

## 关键教训

1. **Reader 类型一致性**：所有 markdown reader 应该保持一致的返回类型约定。如果某个 reader 返回数组，调用方需要明确知道这一点，否则上游的 `.flat()` 会破坏结构。

2. **嵌套结构处理**：对于容器类节点（如 `list`、`listitem`、`blockquote` 等）应该始终返回单个节点，其 `children` 包含所有子内容。

3. **测试期望值验证**：测试用例的期望值必须反映**正确**的行为，而不是基于 bug 的行为。当修复 bug 时，需要同时更新测试用例。

## 相关文件

| 文件 | 说明 |
|------|------|
| `src/plugins/list/plugin/index.ts` | ListItem reader 修复 |
| `src/plugins/list/plugin/index.test.ts` | 测试用例更新 |
| `src/plugins/markdown/data-source/markdown/parse.test.ts` | 添加回归测试 |