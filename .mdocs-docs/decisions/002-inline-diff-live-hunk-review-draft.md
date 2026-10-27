# 002 — Inline Diff：live DiffHunk + review draft 持久化

- **状态**：accepted（对话对齐 2026-10-27；实现细节以需求设计契约为准）
- **上下文**：Agent 改文需要可裁决的 inline 红绿；曾考虑 mdocs base/propose 双树 + 只读 LexicalDiff。
- **决策**：
  1. 提案物化为 **同一 Editor live 树上的 `DiffHunk` 真节点**，不维护平行 propose 树。
  2. **自动保存**可序列化含 `diff-hunk` 的 JSON（review draft），用于恢复裁决 UI。
  3. **发布**只允许 canonical；存在未决断 hunk 时 **拦截**，不做隐式 Keep All。
  4. Agent 全文重写用 **overwrite_all + 块级 LCS → 多 hunk（做法 B）**；slot API 入参为 md。
- **后果**：
  - mdocs 不再需要 base/propose 双文档渲染态；需区分 review vs canonical 存盘与发布门禁。
  - 打开 review draft 的客户端必须注册 DiffPlugin。
  - 逻辑 slot 与物理下标必须分离，避免 pending 打乱 Agent 寻址。
