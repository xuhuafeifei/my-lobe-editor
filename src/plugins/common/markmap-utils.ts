/**
 * Markmap 节点类型（简化版，只包含递归折叠需要的字段）
 * markmap 官方类型没有直接导出，因此定义本地接口
 */
export interface IMapNode {
  children: IMapNode[];
  payload?: { fold?: number };
}

/**
 * 递归统计节点总数
 */
export function countNodes(node: IMapNode): number {
  let count = 1;
  for (const child of node.children || []) {
    count += countNodes(child);
  }
  return count;
}

/**
 * 递归设置所有节点的折叠状态
 * @param fold true=折叠, false=展开
 */
export function setFoldAll(node: IMapNode, fold: boolean): void {
  for (const child of node.children || []) {
    child.payload = { ...(child.payload ?? {}), fold: fold ? 1 : 0 };
    setFoldAll(child, fold);
  }
}
