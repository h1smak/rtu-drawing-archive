import { Search, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useFiltersStore } from '@/store/filters'

export function SearchBar() {
  const query = useFiltersStore((s) => s.query)
  const setQuery = useFiltersStore((s) => s.setQuery)

  return (
    <div className="w-full">
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search names, titles, descriptions, study themes, teachers, keywords, years…"
          className="pl-9 pr-10"
          aria-label="Search archive"
        />
        {query ? (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
            onClick={() => setQuery('')}
            aria-label="Clear search"
          >
            <X />
          </Button>
        ) : null}
      </div>
    </div>
  )
}

