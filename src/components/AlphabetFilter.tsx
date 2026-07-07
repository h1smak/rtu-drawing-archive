import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useFiltersStore } from '@/store/filters'

const letters = 'AĀBCČDEĒFGĢHIĪJKĶLĻMNŅOPRSŠTUŪVZŽ'.split('')

export function AlphabetFilter() {
  const entityType = useFiltersStore((s) => s.entityType)
  const alphabet = useFiltersStore((s) => s.alphabet)
  const setAlphabet = useFiltersStore((s) => s.setAlphabet)

  if (entityType !== 'students' && entityType !== 'teachers') return null

  return (
    <div className="flex flex-wrap items-center gap-1 rounded-lg border bg-card p-2">
      <Button
        type="button"
        size="sm"
        variant={alphabet === null ? 'default' : 'outline'}
        onClick={() => setAlphabet(null)}
      >
        ALL
      </Button>
      {letters.map((l) => {
        const selected = alphabet === l
        return (
          <Button
            key={l}
            type="button"
            size="sm"
            variant={selected ? 'default' : 'outline'}
            className={cn('h-8 px-2', l.length > 1 && 'px-2.5')}
            onClick={() => setAlphabet(l)}
            aria-pressed={selected}
          >
            {l}
          </Button>
        )
      })}
    </div>
  )
}

