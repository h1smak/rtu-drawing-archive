import { BookOpen, Palette, Users } from 'lucide-react'

import { StudyTaskTree } from '@/components/StudyTaskTree'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useFiltersStore } from '@/store/filters'
import type { Keywords, StudyTaskTreeNode } from '@/types/archive'

const keywordDefs: { key: Keywords; icon: React.ReactNode }[] = [
  { key: 'Architecture', icon: <Users className="size-4" aria-hidden="true" /> },
  { key: 'Art', icon: <Palette className="size-4" aria-hidden="true" /> },
  { key: 'Historical events', icon: <BookOpen className="size-4" aria-hidden="true" /> },
  { key: 'Exhibitions', icon: <BookOpen className="size-4" aria-hidden="true" /> },
]

export function FilterPanel({ tree }: { tree: StudyTaskTreeNode }) {
  const keywords = useFiltersStore((s) => s.keywords)
  const toggleKeyword = useFiltersStore((s) => s.toggleKeyword)
  const selectedStudyTaskNodeIds = useFiltersStore((s) => s.selectedStudyTaskNodeIds)
  const resetAll = useFiltersStore((s) => s.resetAll)

  return (
    <aside className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Filters</div>
        <Button type="button" variant="ghost" size="sm" onClick={resetAll}>
          Reset
        </Button>
      </div>

      <div className="rounded-xl border bg-card p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="text-sm font-medium">Keywords</div>
          <Badge variant="muted">{keywords.length}</Badge>
        </div>
        <div className="space-y-2">
          {keywordDefs.map((t) => {
            const checked = keywords.includes(t.key)
            return (
              <div key={t.key} className="flex items-center gap-2">
                <Checkbox
                  id={`keyword-${t.key}`}
                  checked={checked}
                  onCheckedChange={() => toggleKeyword(t.key)}
                />
                <label
                  htmlFor={`keyword-${t.key}`}
                  className="flex cursor-pointer select-none items-center gap-2 text-sm"
                >
                  <span className="text-muted-foreground">{t.icon}</span>
                  {t.key}
                </label>
              </div>
            )
          })}
        </div>
      </div>

      <div className="rounded-xl border bg-card p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="text-sm font-medium">Study Themes</div>
          <Badge variant="muted">{selectedStudyTaskNodeIds.length}</Badge>
        </div>
        <ScrollArea className="h-[42vh] pr-2">
          <StudyTaskTree root={tree} />
        </ScrollArea>
      </div>
    </aside>
  )
}

