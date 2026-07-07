import type { StudyTaskTreeNode } from '@/types/archive'

export function flattenTree(root: StudyTaskTreeNode): StudyTaskTreeNode[] {
  const out: StudyTaskTreeNode[] = []
  const stack: StudyTaskTreeNode[] = [root]
  while (stack.length) {
    const node = stack.pop()!
    out.push(node)
    if (node.children) {
      for (let i = node.children.length - 1; i >= 0; i--) stack.push(node.children[i])
    }
  }
  return out
}

export function findNodeById(
  root: StudyTaskTreeNode,
  id: string,
): StudyTaskTreeNode | null {
  if (root.id === id) return root
  if (!root.children) return null
  for (const child of root.children) {
    const found = findNodeById(child, id)
    if (found) return found
  }
  return null
}

export function collectDescendantTitles(node: StudyTaskTreeNode): string[] {
  const titles: string[] = []
  const stack: StudyTaskTreeNode[] = [node]
  while (stack.length) {
    const cur = stack.pop()!
    titles.push(cur.title)
    if (cur.children) for (const c of cur.children) stack.push(c)
  }
  return titles
}

