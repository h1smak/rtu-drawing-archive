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
  id: string
): StudyTaskTreeNode | null {
  if (root.id === id) return root
  if (!root.children) return null
  for (const child of root.children) {
    const found = findNodeById(child, id)
    if (found) return found
  }
  return null
}

export function findNodeByTitle(
  root: StudyTaskTreeNode,
  targetTitle: string
): StudyTaskTreeNode | null {
  if (!targetTitle) return null
  const cleanTarget = targetTitle.trim().toLowerCase()
  if (root.title && root.title.trim().toLowerCase() === cleanTarget) {
    return root
  }
  if (root.children) {
    for (const child of root.children) {
      const found = findNodeByTitle(child, targetTitle)
      if (found) return found
    }
  }
  return null
}

export function findNodeForProject(
  root: StudyTaskTreeNode,
  targetTitle: string,
  projectContext?: { keyword?: string; category?: string; subcategory?: string | null }
): StudyTaskTreeNode | null {
  if (!targetTitle) return null

  if (projectContext) {
    let startNode: StudyTaskTreeNode = root

    // 1. Find keyword branch (e.g. Architecture, Art, Exhibitions)
    if (projectContext.keyword && root.children) {
      const kwMatch = root.children.find(
        (c) =>
          (c.keyword && c.keyword.toLowerCase() === projectContext.keyword!.toLowerCase()) ||
          (c.title && c.title.toLowerCase() === projectContext.keyword!.toLowerCase())
      )
      if (kwMatch) {
        startNode = kwMatch
      }
    }

    // 2. If target is subcategory and category is present, search inside category node first
    if (
      projectContext.subcategory &&
      targetTitle.trim().toLowerCase() === projectContext.subcategory.trim().toLowerCase() &&
      projectContext.category
    ) {
      const catNode = findNodeByTitle(startNode, projectContext.category)
      if (catNode) {
        const subNode = findNodeByTitle(catNode, targetTitle)
        if (subNode) return subNode
      }
    }

    // 3. Search targetTitle inside keyword branch
    const nodeInBranch = findNodeByTitle(startNode, targetTitle)
    if (nodeInBranch) return nodeInBranch
  }

  // Fallback: search entire tree
  return findNodeByTitle(root, targetTitle)
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
