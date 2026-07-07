import { Calendar, GraduationCap, User2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Exhibition, HistoricalEvent, Student, StudyTaskItem, Teacher } from '@/types/archive'

type CardEntity = Student | Teacher | StudyTaskItem | HistoricalEvent | Exhibition

function fallbackInitials(title: string) {
  const parts = title.trim().split(/\s+/).slice(0, 2)
  return parts.map((p) => p[0]?.toUpperCase()).join('')
}

export function ResultCard({
  entity,
  subtitle,
  tags,
  onClick,
}: {
  entity: CardEntity
  subtitle?: string
  tags?: string[]
  onClick?: () => void
}) {
  const isPerson = entity.type === 'student' || entity.type === 'teacher'
  const title =
    entity.type === 'student' || entity.type === 'teacher'
      ? `${entity.firstName} ${entity.lastName}`
      : entity.title

  const image = 'image' in entity ? entity.image : undefined

  return (
    <article
      className={cn(
        'group overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus-within:shadow-md',
        onClick && 'cursor-pointer',
      )}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? 'button' : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (!onClick) return
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
    >
      <div className="relative aspect-[16/9] w-full bg-muted">
        {image ? (
          <img
            src={image}
            alt=""
            className="h-full w-full object-cover"
            onError={(e) => {
              ;(e.currentTarget as HTMLImageElement).style.display = 'none'
            }}
          />
        ) : null}
        <div className="absolute inset-0 flex items-center justify-center text-lg font-semibold text-muted-foreground/70">
          {fallbackInitials(title)}
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold leading-6">{title}</h3>
            {subtitle ? <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p> : null}
          </div>
          {entity.type === 'student' ? (
            <Badge className="shrink-0" variant="muted">
              <GraduationCap className="mr-1 size-3.5" aria-hidden="true" />
              {entity.graduatedYear}
            </Badge>
          ) : entity.type === 'teacher' ? (
            <Badge className="shrink-0" variant="muted">
              <User2 className="mr-1 size-3.5" aria-hidden="true" />
              {entity.position}
            </Badge>
          ) : 'year' in entity ? (
            <Badge className="shrink-0" variant="muted">
              <Calendar className="mr-1 size-3.5" aria-hidden="true" />
              {entity.year}
            </Badge>
          ) : null}
        </div>

        <p className="mt-2 line-clamp-3 text-sm text-foreground/90">{entity.description}</p>

        {isPerson ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {'keywords' in entity
              ? entity.keywords.map((t) => (
                  <Badge key={t} variant="secondary">
                    {t}
                  </Badge>
                ))
              : null}
          </div>
        ) : tags?.length ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <Badge key={t} variant="secondary">
                {t}
              </Badge>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  )
}

