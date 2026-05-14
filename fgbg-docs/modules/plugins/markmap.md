# Markmap 思维导图插件

> **tags**: [plugin, markmap, mindmap, codemirror]
> **related_modules**: [src/plugins/codemirror-block, src/plugins/common/react/MarkmapWithErrorBoundary.tsx]
> **updated**: 2026-05-14

## 定位

Markmap 支持不是一个独立插件，而是**集成在 `codemirror-block` 代码块功能中。用户通过 ` ```markmap ` 语法创建可交互的思维导图，与 Mermaid 流程图使用方式完全一致。

## 核心文件

| 文件 | 类型 | 核心内容 |
|------|------|----------|
| `src/plugins/codemirror-block/lib/mode.ts` | 语言注册 | 注册 `markmap` 为支持的语言类型 |
| `src/plugins/codemirror-block/react/CodemirrorNode.tsx` | 渲染逻辑 | 添加 markmap 预览渲染、状态管理 |
| `src/plugins/common/react/MarkmapWithErrorBoundary.tsx` | 渲染组件 | 带错误边界的 Markmap 渲染组件 |
| `src/plugins/common/react/index.ts` | 导出 | 统一导出 MarkmapWithErrorBoundary |

## 功能特性

### 1. 语法方式

与 Mermaid 一致，使用 fenced code block 语法：

````markdown
```markmap
# 根节点
## 分支 1
### 子节点 1.1
### 子节点 1.2
## 分支 2
### 子节点 2.1
```
````

### 2. 实时预览

- 编辑 Markdown 内容时，下方实时渲染思维导图
- 使用 `markmap-lib` 解析 Markdown 为树形数据结构
- 使用 `markmap-view` 渲染为交互式 SVG

### 3. 交互行为（与 Mermaid 一致）

| 操作 | 行为 |
|------|------|
| 点击代码块内部 | 显示源码编辑器 |
| 点击代码块外部区域 | 隐藏源码，只显示思维导图 |
| 点击图表区域 | 切换全屏放大预览 |

### 4. 全屏预览浮层

支持的交互：
- **缩放**：鼠标滚轮 / 工具栏按钮
- **拖拽**：按住鼠标左键拖拽移动
- **还原**：点击重置按钮 / ESC 键关闭

### 5. 错误处理

- Markdown 解析失败时显示红色错误提示框
- 包含错误信息和具体位置
- React ErrorBoundary 兜底渲染异常

## 数据流向

```
用户输入 Markdown 内容
    ↓
CodeMirror onChange 事件
    ↓
防抖 220ms 更新 markmapSource 状态
    ↓
MarkmapWithErrorBoundary 组件检测到 markdown 变化
    ↓
transformer.transform(markdown) 解析为树形结构
    ↓
new Markmap(svgElement) 创建实例
    ↓
markmap.setData(root) 设置数据
    ↓
markmap.fit() 自适应视口
    ↓
渲染完成，捕获 SVG outerHTML
```

## 状态管理

### CodemirrorNode 中新增状态：

```typescript
// markmap 预览数据源（防抖后的值）
const [markmapSource, setMarkmapSource] = useState(node.code);

// 是否显示 markmap 源码编辑器
const [markmapShowSource, setMarkmapShowSource] = useState(false);

// 是否全屏展开
const [markmapExpanded, setMarkmapExpanded] = useState(false);

// 预览更新定时器
const markmapPreviewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
```

### 关键计算属性：

```typescript
const showCodeMirror = useMemo(
  () =>
    expand &&
    ((selectedLang !== 'mermaid' && selectedLang !== 'markmap') ||
      (selectedLang === 'mermaid' && mermaidShowSource) ||
      (selectedLang === 'markmap' && markmapShowSource),
  [expand, mermaidShowSource, markmapShowSource, selectedLang],
);
```

## MarkmapWithErrorBoundary 组件 API

### Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `children` | `string` | 必填 | Markdown 格式的思维导图内容 |
| `enableImagePreview` | `boolean` | `true` | 是否启用点击放大预览 |

### 内部实现

1. **Transformer**：`markmap-lib` 的核心类，将 Markdown 转为 markmap 数据
2. **Markmap**：`markmap-view` 的渲染类，负责 SVG 渲染
3. **ErrorBoundary**：捕获渲染期间异常
4. **SvgPreviewOverlay**：复用 Mermaid 相同的全屏预览浮层

### 渲染流程

```typescript
// 1. 创建 SVG 元素
const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
container.append(svgElement);

// 2. 创建 Markmap 实例
const markmap = new Markmap(svgElement);

// 3. 解析 Markdown
const transformer = new Transformer();
const { root } = transformer.transform(markdown);

// 4. 渲染
markmap.setData(root);
markmap.fit();
```

## 新增依赖

| 包名 | 版本 | 用途 |
|------|------|------|
| `markmap-lib` | `^0.18.12` | Markdown 转思维导图数据结构 |
| `markmap-view` | `^0.18.12` | 渲染思维导图为交互式 SVG |

## 与 Mermaid 复用的组件

- ✅ `SvgPreviewOverlay` - 全屏预览浮层（完全复用）
- ✅ ErrorBoundary 模式（相同的错误处理架构）
- ✅ CodeMirror 编辑器交互逻辑（模式判断不同）
- ✅ Toolbar 工具栏（完全复用）

## 测试要点

1. **新建 markmap 代码块是否能正常输入
2. **输入 Markdown 是否实时渲染思维导图
3. **点击内部/外部是否正确切换源码显示/隐藏
4. **点击图表是否进入全屏预览
5. **全屏下缩放、拖拽是否正常
6. **语法错误是否显示友好的错误提示
7. **切换语言为 markmap 时行为是否正确
8. **export JSON 后再次编辑是否正常
9. **import JSON 后是否正确渲染

## 版本历史

- **v1.0.0-fork.6** - 新增 markmap 思维导图支持
