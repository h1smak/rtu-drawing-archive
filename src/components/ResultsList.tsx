import { ResultCard } from '@/components/ResultCard'
import { Skeleton } from '@/components/ui/skeleton'
import { useFiltersStore } from '@/store/filters'
import type { ArchiveCollections } from '@/types/archive'
import type { FilteredResults } from '@/utils/filter'

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <Skeleton className="aspect-[16/9] w-full" />
      <div className="space-y-2 p-4">
        <Skeleton className="h-4 w-2/5" />
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>
    </div>
  )
}

export function ResultsList({
  loading,
  collections,
  results,
}: {
  loading: boolean
  collections: ArchiveCollections | null
  results: FilteredResults | null
}) {
  const focusOnPerson = useFiltersStore((s) => s.focusOnPerson)

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }

  if (!collections || !results) return null

  if (results.total === 0) {
    return (
      <div className="rounded-xl border bg-card p-10 text-center">
        <div className="text-base font-semibold">No results</div>
        <div className="mt-1 text-sm text-muted-foreground">
          Try adjusting the decade, removing filters, or refining the search query.
        </div>
      </div>
    )
  }

  const teacherById = new Map(collections.teachers.map((t) => [t.id, t]))
  const studentById = new Map(collections.students.map((s) => [s.id, s]))

  return (
    <div className="space-y-3">
      {results.students.map((s) => (
        <ResultCard
          key={`student-${s.id}`}
          entity={s}
          subtitle={`${s.lifeYears} • ${s.studyPeriod} • ${s.status === 'graduated' ? 'Graduated' : 'Undergraduate'}`}
          onClick={() => focusOnPerson({ kind: 'student', id: s.id })}
        />
      ))}

      {results.teachers.map((t) => (
        <ResultCard
          key={`teacher-${t.id}`}
          entity={t}
          subtitle={`${t.lifeYears} • Appointed ${t.appointedYear} • ${t.specialization}`}
          onClick={() => focusOnPerson({ kind: 'teacher', id: t.id })}
        />
      ))}

      {results.studyTasks.map((st) => {
        const teacher = teacherById.get(st.teacherId)
        const student = studentById.get(st.studentId)
        const subtitle = [
          st.category,
          st.subcategory ?? null,
          student ? `${student.firstName} ${student.lastName}` : null,
          teacher ? `${teacher.firstName} ${teacher.lastName}` : null,
          st.decade ? String(st.decade) : null,
        ]
          .filter(Boolean)
          .join(' • ')

        const tags = [st.category, st.subcategory].filter((x): x is string => Boolean(x))
        return <ResultCard key={`task-${st.id}`} entity={st} subtitle={subtitle} tags={tags} />
      })}

      {results.events.map((e) => (
        <ResultCard
          key={`event-${e.id}`}
          entity={e}
          subtitle={`${e.year} • Historical Event`}
          tags={['Historical event']}
        />
      ))}

      {results.exhibitions.map((ex) => (
        <ResultCard
          key={`exhibition-${ex.id}`}
          entity={ex}
          subtitle={`${ex.year} • Exhibition`}
          tags={['Exhibitions']}
        />
      ))}
    </div>
  )
}

