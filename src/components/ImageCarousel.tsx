import * as React from 'react'
import { ChevronLeft, ChevronRight, Images } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageCarouselProps {
  images: string[]
  title?: string
  initialIndex?: number
  showThumbnails?: boolean
  showCounter?: boolean
  showControlsOnHover?: boolean
  aspectRatioClass?: string
  className?: string
  onImageClick?: (index: number) => void
}

export function ImageCarousel({
  images,
  title = '',
  initialIndex = 0,
  showThumbnails = false,
  showCounter = true,
  showControlsOnHover = false,
  aspectRatioClass = 'aspect-[16/9]',
  className,
  onImageClick,
}: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex)
  const [loaded, setLoaded] = React.useState(false)

  React.useEffect(() => {
    setCurrentIndex(initialIndex)
  }, [initialIndex])

  if (!images || images.length === 0) {
    return null
  }

  const isMultiple = images.length > 1
  const currentUrl = images[currentIndex] || images[0]

  const goToPrev = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const goToNext = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  const goToIndex = (index: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setCurrentIndex(index)
  }

  return (
    <div className={cn('flex flex-col gap-2 select-none', className)}>
      {/* Main Image Viewport */}
      <div
        className={cn(
          'group/carousel relative overflow-hidden bg-black/90 text-white flex items-center justify-center rounded-lg',
          aspectRatioClass,
          onImageClick && 'cursor-pointer'
        )}
        onClick={() => onImageClick && onImageClick(currentIndex)}
      >
        <img
          key={currentUrl}
          src={currentUrl}
          alt={title ? `${title} - image ${currentIndex + 1}` : `Image ${currentIndex + 1}`}
          className={cn(
            'h-full w-full object-contain transition-opacity duration-300',
            loaded ? 'opacity-100' : 'opacity-80'
          )}
          onLoad={() => setLoaded(true)}
          onError={(e) => {
            ;(e.currentTarget as HTMLImageElement).style.display = 'none'
          }}
        />

        {/* Counter Badge */}
        {showCounter && isMultiple && (
          <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5 rounded-full bg-black/70 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-md border border-white/10">
            <Images className="size-3.5" />
            <span>
              {currentIndex + 1} / {images.length}
            </span>
          </div>
        )}

        {/* Carousel Prev / Next Buttons */}
        {isMultiple && (
          <>
            <button
              type="button"
              aria-label="Previous picture"
              className={cn(
                'absolute left-2 top-1/2 z-10 -translate-y-1/2 flex size-8 items-center justify-center rounded-full bg-black/60 text-white transition-all hover:bg-black/80 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary',
                showControlsOnHover && 'opacity-0 group-hover/carousel:opacity-100'
              )}
              onClick={goToPrev}
            >
              <ChevronLeft className="size-5" />
            </button>

            <button
              type="button"
              aria-label="Next picture"
              className={cn(
                'absolute right-2 top-1/2 z-10 -translate-y-1/2 flex size-8 items-center justify-center rounded-full bg-black/60 text-white transition-all hover:bg-black/80 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary',
                showControlsOnHover && 'opacity-0 group-hover/carousel:opacity-100'
              )}
              onClick={goToNext}
            >
              <ChevronRight className="size-5" />
            </button>
          </>
        )}

        {/* Bottom Dot Indicators for multiple images */}
        {isMultiple && !showThumbnails && (
          <div className="absolute bottom-2 inset-x-0 z-10 flex justify-center gap-1.5 px-2">
            {images.map((_, idx) => (
              <button
                key={idx}
                type="button"
                aria-label={`Go to slide ${idx + 1}`}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  idx === currentIndex
                    ? 'w-5 bg-white'
                    : 'w-1.5 bg-white/50 hover:bg-white/80'
                )}
                onClick={(e) => goToIndex(idx, e)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Optional Thumbnail Bar */}
      {showThumbnails && isMultiple && (
        <div className="flex gap-2 overflow-x-auto pb-1 pt-1 scrollbar-thin scrollbar-thumb-muted-foreground/30">
          {images.map((url, idx) => (
            <button
              key={url + idx}
              type="button"
              className={cn(
                'relative aspect-[16/9] h-14 shrink-0 overflow-hidden rounded-md border-2 bg-black transition-all',
                idx === currentIndex
                  ? 'border-primary ring-2 ring-primary/30 scale-105'
                  : 'border-transparent opacity-60 hover:opacity-100'
              )}
              onClick={(e) => goToIndex(idx, e)}
            >
              <img src={url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
