import * as React from 'react'

import { AlphabetFilter } from '@/components/AlphabetFilter'
import { ArchiveHeader } from '@/components/ArchiveHeader'
import { FilterPanel } from '@/components/FilterPanel'
import { ResultsList } from '@/components/ResultsList'
import { SearchBar } from '@/components/SearchBar'
import { Timeline } from '@/components/Timeline'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { archiveApi } from '@/data'
import { useFiltersStore } from '@/store/filters'
import type { ArchiveCollections, Keywords } from '@/types/archive'
import { filterCollections } from '@/utils/filter'

function applyDarkModeClass(enabled: boolean) {
  const root = document.documentElement
  if (enabled) root.classList.add('dark')
  else root.classList.remove('dark')
}

export function ArchivePage() {
  const [loading, setLoading] = React.useState(true)
  const [collections, setCollections] = React.useState<ArchiveCollections | null>(null)

  const entityType = useFiltersStore((s) => s.entityType)
  const timeline = useFiltersStore((s) => s.timeline)
  const query = useFiltersStore((s) => s.query)
  const alphabet = useFiltersStore((s) => s.alphabet)
  const keywordsArr = useFiltersStore((s) => s.keywords)
  const selectedStudyTaskNodeIdsArr = useFiltersStore((s) => s.selectedStudyTaskNodeIds)
  const teacherCategory = useFiltersStore((s) => s.teacherCategory)
  const studentCategory = useFiltersStore((s) => s.studentCategory)
  const darkMode = useFiltersStore((s) => s.darkMode)
  const focusPerson = useFiltersStore((s) => s.focusPerson)
  const clearFocusPerson = useFiltersStore((s) => s.clearFocusPerson)

  React.useEffect(() => {
    applyDarkModeClass(darkMode)
  }, [darkMode])

  React.useEffect(() => {
    let active = true
    setLoading(true)
    archiveApi
      .getCollections()
      .then((c) => {
        if (!active) return
        setCollections(c)
        setLoading(false)
      })
      .catch(() => {
        if (!active) return
        setCollections(null)
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const results = React.useMemo(() => {
    if (!collections) return null
    return filterCollections(collections, {
      entityType,
      timeline,
      query,
      alphabet,
      keywords: new Set(keywordsArr as Keywords[]),
      selectedStudyTaskNodeIds: new Set(selectedStudyTaskNodeIdsArr),
      teacherCategory,
      studentCategory,
      focusPerson,
    })
  }, [
    collections,
    entityType,
    timeline,
    query,
    alphabet,
    keywordsArr,
    selectedStudyTaskNodeIdsArr,
    teacherCategory,
    studentCategory,
    focusPerson,
  ])

  const focusLabel = React.useMemo(() => {
    if (!collections || !focusPerson) return null
    if (focusPerson.kind === 'student') {
      const s = collections.students.find((x) => x.id === focusPerson.id)
      return s ? `${s.firstName} ${s.lastName}` : null
    }
    const t = collections.teachers.find((x) => x.id === focusPerson.id)
    return t ? `${t.firstName} ${t.lastName}` : null
  }, [collections, focusPerson])

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <Timeline />

      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="space-y-4">
          <ArchiveHeader />
          <SearchBar />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
            <div className="lg:sticky lg:top-6 lg:self-start">
              {collections ? <FilterPanel tree={collections.studyTasksTree} /> : null}
            </div>

            <div className="space-y-4">
              {focusPerson && focusLabel ? (
                <div className="rounded-xl border bg-card p-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm">
                      <span className="font-medium">Showing works for:</span>{' '}
                      <span className="text-muted-foreground">{focusLabel}</span>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={clearFocusPerson}>
                      Back to all results
                    </Button>
                  </div>
                  <Separator className="my-3" />
                  <div className="text-xs text-muted-foreground">
                    Tip: other filters still apply (timeline, search, keywords, study task tree).
                  </div>
                </div>
              ) : null}

              <AlphabetFilter />

              <div className="flex items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2 text-sm">
                <div className="text-muted-foreground">
                  {loading ? 'Loading…' : `${results?.total ?? 0} results`}
                </div>
                <div className="text-muted-foreground">
                  {entityType === 'all'
                    ? 'All collections'
                    : entityType === 'students'
                      ? 'Students'
                      : 'Teachers'}
                </div>
              </div>

              <ResultsList loading={loading} collections={collections} results={results} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

