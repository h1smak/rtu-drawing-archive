import * as React from 'react'
import { Calendar, User2, X, Images } from 'lucide-react'
import { ImageCarousel } from '@/components/ImageCarousel'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Person, Project } from '@/types/archive'

interface ProjectModalProps {
  project: Project | null
  author?: Person
  onClose: () => void
  onAuthorClick?: (authorId: string) => void
  onStudyTaskClick?: (taskTitle: string) => void
}

export function ProjectModal({ project, author, onClose, onAuthorClick, onStudyTaskClick }: ProjectModalProps) {
  const [activeImageIndex, setActiveImageIndex] = React.useState(0)

  React.useEffect(() => {
    setActiveImageIndex(0)
  }, [project])

  // Lock body scroll when modal is open
  React.useEffect(() => {
    if (!project) return
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [project])

  // Keyboard navigation (ArrowLeft, ArrowRight, Escape)
  React.useEffect(() => {
    if (!project) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft' && project.images.length > 1) {
        setActiveImageIndex((prev) => (prev === 0 ? project.images.length - 1 : prev - 1))
      } else if (e.key === 'ArrowRight' && project.images.length > 1) {
        setActiveImageIndex((prev) => (prev === project.images.length - 1 ? 0 : prev + 1))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [project, onClose])

  if (!project) return null

  const isMulti = project.images.length > 1

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col max-h-[90dvh] w-full max-w-5xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4 bg-card/90">
          <div className="min-w-0 pr-4">
            <h2 className="text-xl font-bold leading-tight truncate">{project.title}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {project.category && (
                <button
                  type="button"
                  className="font-medium text-foreground/90 hover:text-primary hover:underline transition-colors"
                  onClick={() => {
                    onClose()
                    if (onStudyTaskClick) onStudyTaskClick(project.category!)
                  }}
                >
                  {project.category}
                </button>
              )}
              {project.subcategory && (
                <button
                  type="button"
                  className="font-medium text-muted-foreground hover:text-primary hover:underline transition-colors"
                  onClick={() => {
                    onClose()
                    if (onStudyTaskClick) onStudyTaskClick(project.subcategory!)
                  }}
                >
                  • {project.subcategory}
                </button>
              )}
              {project.year && (
                <span className="flex items-center gap-1">
                  • <Calendar className="size-3" /> {project.year}
                </span>
              )}
              {isMulti && (
                <Badge variant="secondary" className="ml-2 gap-1">
                  <Images className="size-3" />
                  {project.images.length} pictures
                </Badge>
              )}
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-muted shrink-0"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X className="size-5" />
          </Button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Main Image Carousel */}
          <ImageCarousel
            images={project.images}
            title={project.title}
            initialIndex={activeImageIndex}
            showThumbnails={isMulti}
            showCounter={isMulti}
            showZoomControls={true}
            aspectRatioClass="aspect-[16/10] max-h-[60vh]"
          />

          {/* Description & Author info */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-6 border-t pt-4">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Description
              </h3>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{project.description}</p>
            </div>

            <div className="space-y-4 rounded-xl border bg-muted/40 p-4 text-sm">
              {author && (
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Author
                  </div>
                  <button
                    type="button"
                    className="flex items-center gap-2 font-medium text-primary hover:underline focus:outline-none"
                    onClick={() => {
                      onClose()
                      if (onAuthorClick) onAuthorClick(author.id)
                    }}
                  >
                    <User2 className="size-4" />
                    <span>
                      {author.firstName} {author.lastName}
                    </span>
                  </button>
                </div>
              )}

              {project.category && (
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Category
                  </div>
                  <button
                    type="button"
                    className="text-sm font-medium text-foreground hover:text-primary hover:underline transition-colors block text-left"
                    onClick={() => {
                      onClose()
                      if (onStudyTaskClick) onStudyTaskClick(project.category!)
                    }}
                  >
                    {project.category}
                  </button>
                  {project.subcategory && (
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-primary hover:underline transition-colors block text-left"
                      onClick={() => {
                        onClose()
                        if (onStudyTaskClick) onStudyTaskClick(project.subcategory!)
                      }}
                    >
                      {project.subcategory}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
