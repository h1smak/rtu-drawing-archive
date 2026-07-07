import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { useFiltersStore } from '@/store/filters'

type TimelineItem =
  | { kind: 'all'; label: string }
  | { kind: 'decade'; decade: number; label: string }
  | { kind: 'year'; year: number; label: string }

function buildTimeline(): TimelineItem[] {
  const items: TimelineItem[] = [{ kind: 'all', label: 'ALL' }]
  items.push({ kind: 'year', year: 1867, label: '1867' })
  for (let d = 1870; d <= 2020; d += 10) items.push({ kind: 'decade', decade: d, label: String(d) })
  items.push({ kind: 'year', year: 2026, label: '2026' })
  return items
}

export function Timeline() {
  const items = buildTimeline()
  const timeline = useFiltersStore((s) => s.timeline)
  const setTimeline = useFiltersStore((s) => s.setTimeline)

  return (
    <div className="w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 py-3">
        <ScrollArea className="w-full">
          <div className="flex items-center gap-2 pr-2">
            {items.map((it) => {
              const selected =
                (it.kind === 'all' && timeline.kind === 'all') ||
                (it.kind === 'decade' &&
                  timeline.kind === 'decade' &&
                  timeline.decade === it.decade) ||
                (it.kind === 'year' && timeline.kind === 'year' && timeline.year === it.year)

              return (
                <Button
                  key={it.label}
                  type="button"
                  size="sm"
                  variant={selected ? 'default' : 'outline'}
                  className={cn('shrink-0', selected && 'shadow-sm')}
                  onClick={() => {
                    if (it.kind === 'all') setTimeline({ kind: 'all' })
                    if (it.kind === 'decade') setTimeline({ kind: 'decade', decade: it.decade })
                    if (it.kind === 'year') setTimeline({ kind: 'year', year: it.year })
                  }}
                >
                  {it.label}
                </Button>
              )
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}

