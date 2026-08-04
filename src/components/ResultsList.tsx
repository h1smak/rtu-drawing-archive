import * as React from 'react'
import { ProjectModal } from '@/components/ProjectModal'
import { ResultCard } from '@/components/ResultCard'
import { Skeleton } from '@/components/ui/skeleton'
import { useFiltersStore } from '@/store/filters'
import type { ArchiveCollections, Project } from '@/types/archive'
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
  const [selectedProject, setSelectedProject] = React.useState<Project | null>(null)

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

  const personById = new Map(collections.people.map((p) => [p.id, p]))
  const selectedAuthor = selectedProject ? personById.get(selectedProject.authorId) : undefined

  return (
    <div className="space-y-3">
      {results.projects.map((proj) => {
        const author = personById.get(proj.authorId)
        
        const subtitle = (
          <span className="flex flex-wrap items-center gap-1">
            {proj.category && <span>{proj.category}</span>}
            {proj.subcategory && <span>• {proj.subcategory}</span>}
            {author && (
              <>
                <span>• Author:</span>
                <span 
                  className="cursor-pointer font-medium hover:underline text-primary" 
                  onClick={(e) => { e.stopPropagation(); focusOnPerson({ kind: 'person', id: author.id }) }}
                >
                  {author.firstName} {author.lastName}
                </span>
              </>
            )}
            {(proj.year || proj.decade) && <span>• {proj.year || proj.decade}</span>}
          </span>
        )

        const tags = [proj.category, proj.subcategory].filter((x): x is string => Boolean(x))
        return (
          <ResultCard
            key={`project-${proj.id}`}
            entity={proj}
            subtitle={subtitle}
            tags={tags}
            onClick={() => setSelectedProject(proj)}
          />
        )
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

      {/* Project Multi-Image Modal Carousel Lightbox */}
      <ProjectModal
        project={selectedProject}
        author={selectedAuthor}
        onClose={() => setSelectedProject(null)}
        onAuthorClick={(authorId) => focusOnPerson({ kind: 'person', id: authorId })}
      />
    </div>
  )
}
