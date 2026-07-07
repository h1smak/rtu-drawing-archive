import { ChevronDown, ChevronRight } from 'lucide-react'
import * as React from 'react'

import { Checkbox } from '@/components/ui/checkbox'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import { useFiltersStore } from '@/store/filters'
import type { StudyTaskTreeNode } from '@/types/archive'

function TreeNode({
  node,
  depth,
}: {
  node: StudyTaskTreeNode
  depth: number
}) {
  const selectedIds = useFiltersStore((s) => s.selectedStudyTaskNodeIds)
  const toggle = useFiltersStore((s) => s.toggleStudyTaskNode)
  const [open, setOpen] = React.useState(depth < 1)

  const checked = selectedIds.includes(node.id)
  const hasChildren = Boolean(node.children?.length)

  return (
    <div className="space-y-1">
      <div
        className={cn(
          'flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent',
          depth === 0 && 'font-medium',
        )}
        style={{ paddingLeft: 8 + depth * 12 }}
      >
        {hasChildren ? (
          <Collapsible open={open} onOpenChange={setOpen}>
            <div className="flex w-full items-center gap-2">
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="inline-flex h-6 w-6 items-center justify-center rounded hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={open ? 'Collapse' : 'Expand'}
                >
                  {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                </button>
              </CollapsibleTrigger>

              <Checkbox
                id={`st-${node.id}`}
                checked={checked}
                onCheckedChange={() => toggle(node.id)}
              />
              <label
                htmlFor={`st-${node.id}`}
                className="flex-1 cursor-pointer select-none text-sm leading-5"
              >
                {node.title}
              </label>
            </div>

            <CollapsibleContent className="data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
              <div className="mt-1 space-y-1">
                {node.children?.map((c) => (
                  <TreeNode key={c.id} node={c} depth={depth + 1} />
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        ) : (
          <>
            <span className="inline-flex h-6 w-6" aria-hidden="true" />
            <Checkbox
              id={`st-${node.id}`}
              checked={checked}
              onCheckedChange={() => toggle(node.id)}
            />
            <label
              htmlFor={`st-${node.id}`}
              className="flex-1 cursor-pointer select-none text-sm leading-5"
            >
              {node.title}
            </label>
          </>
        )}
      </div>
    </div>
  )
}

export function StudyTaskTree({ root }: { root: StudyTaskTreeNode }) {
  return (
    <div className="space-y-1">
      {root.children?.map((c) => (
        <TreeNode key={c.id} node={c} depth={0} />
      ))}
    </div>
  )
}

