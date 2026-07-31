import * as React from 'react'
import { Search } from 'lucide-react'

import { StudyTaskTree } from '@/components/StudyTaskTree'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useFiltersStore } from '@/store/filters'
import type { StudyTaskTreeNode } from '@/types/archive'

function filterTree(node: StudyTaskTreeNode, query: string): StudyTaskTreeNode | null {
  if (!query.trim()) return node

  const q = query.trim().toLowerCase()
  const isMatch = node.title.toLowerCase().includes(q)
  if (isMatch) return node

  const filteredChildren = (node.children || [])
    .map(c => filterTree(c, query))
    .filter(Boolean) as StudyTaskTreeNode[]

  if (filteredChildren.length > 0) {
    return {
      ...node,
      children: filteredChildren
    }
  }
  return null
}

export function FilterPanel({ tree }: { tree: StudyTaskTreeNode }) {
  const selectedStudyTaskNodeIds = useFiltersStore((s) => s.selectedStudyTaskNodeIds)
  const resetAll = useFiltersStore((s) => s.resetAll)

  const [themeSearch, setThemeSearch] = React.useState('')

  const filteredTree = React.useMemo(() => {
    // tree is the dummy root containing Architecture, Art, Exhibitions
    const result = filterTree(tree, themeSearch)
    // If the root is filtered out entirely, return an empty root
    return result || { id: 'empty-root', title: 'Study Themes', children: [] }
  }, [tree, themeSearch])

  return (
    <aside className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Filters</div>
        <Button type="button" variant="ghost" size="sm" onClick={resetAll}>
          Reset
        </Button>
      </div>

      <div className="rounded-xl border bg-card p-3">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="text-sm font-medium">Study Themes</div>
          <Badge variant="muted">{selectedStudyTaskNodeIds.length}</Badge>
        </div>
        
        <div className="relative mb-3">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search themes..."
            className="w-full pl-9"
            value={themeSearch}
            onChange={(e) => setThemeSearch(e.target.value)}
          />
        </div>

        <ScrollArea className="h-[42vh] pr-2">
          {filteredTree.children && filteredTree.children.length > 0 ? (
             <StudyTaskTree root={filteredTree as StudyTaskTreeNode} isSearching={themeSearch.trim().length > 0} />
          ) : (
             <div className="text-sm text-muted-foreground py-4 text-center">
               No themes found
             </div>
          )}
        </ScrollArea>
      </div>
    </aside>
  )
}
