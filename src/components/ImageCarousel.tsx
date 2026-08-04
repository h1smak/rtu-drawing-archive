import * as React from 'react'
import { ChevronLeft, ChevronRight, Images, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageCarouselProps {
  images: string[]
  title?: string
  initialIndex?: number
  showThumbnails?: boolean
  showCounter?: boolean
  showZoomControls?: boolean
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
  showZoomControls = false,
  showControlsOnHover = false,
  aspectRatioClass = 'aspect-[16/9]',
  className,
  onImageClick,
}: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex)
  const [loaded, setLoaded] = React.useState(false)

  // Viewport DOM Ref for non-passive event listeners
  const viewportRef = React.useRef<HTMLDivElement>(null)

  // Zoom & Pan state inside carousel
  const [zoomScale, setZoomScale] = React.useState(1)
  const [pan, setPan] = React.useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = React.useState(false)
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 })

  React.useEffect(() => {
    setCurrentIndex(initialIndex)
  }, [initialIndex])

  // Reset zoom & pan whenever active slide changes
  React.useEffect(() => {
    setZoomScale(1)
    setPan({ x: 0, y: 0 })
    setIsDragging(false)
    setLoaded(false)
  }, [currentIndex])

  // Attach non-passive native wheel listener to intercept Ctrl+Wheel and prevent Chrome browser page zoom
  React.useEffect(() => {
    const element = viewportRef.current
    if (!element || !showZoomControls) return

    const handleWheelNative = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        // Prevent Chrome's native browser zoom
        e.preventDefault()
        e.stopPropagation()

        if (e.deltaY < 0) {
          setZoomScale((prev) => Math.min(prev + 0.25, 4))
        } else {
          setZoomScale((prev) => {
            const next = Math.max(prev - 0.25, 1)
            if (next === 1) setPan({ x: 0, y: 0 })
            return next
          })
        }
      }
    }

    element.addEventListener('wheel', handleWheelNative, { passive: false })
    return () => {
      element.removeEventListener('wheel', handleWheelNative)
    }
  }, [showZoomControls])

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

  // Zoom Control Handlers
  const handleZoomIn = (e?: React.MouseEvent) => {
    if (!showZoomControls) return
    if (e) e.stopPropagation()
    setZoomScale((prev) => Math.min(prev + 0.5, 4))
  }

  const handleZoomOut = (e?: React.MouseEvent) => {
    if (!showZoomControls) return
    if (e) e.stopPropagation()
    setZoomScale((prev) => {
      const next = Math.max(prev - 0.5, 1)
      if (next === 1) setPan({ x: 0, y: 0 })
      return next
    })
  }

  const handleResetZoom = (e?: React.MouseEvent) => {
    if (!showZoomControls) return
    if (e) e.stopPropagation()
    setZoomScale(1)
    setPan({ x: 0, y: 0 })
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (!showZoomControls) return
    e.stopPropagation()
    if (zoomScale > 1) {
      handleResetZoom()
    } else {
      setZoomScale(2.5)
    }
  }

  // Mouse Pan Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (showZoomControls && zoomScale > 1) {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(true)
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (showZoomControls && isDragging && zoomScale > 1) {
      e.preventDefault()
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  return (
    <div className={cn('flex flex-col gap-2 select-none h-full w-full', className)}>
      {/* Main Image Viewport */}
      <div
        ref={viewportRef}
        className={cn(
          'group/carousel relative overflow-hidden bg-black/95 text-white flex items-center justify-center rounded-lg h-full w-full',
          aspectRatioClass,
          showZoomControls && zoomScale > 1
            ? (isDragging ? 'cursor-grabbing' : 'cursor-grab')
            : onImageClick && 'cursor-pointer'
        )}
        onClick={() => {
          if (zoomScale === 1 && onImageClick) {
            onImageClick(currentIndex)
          }
        }}
        onDoubleClick={handleDoubleClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          className="h-full w-full flex items-center justify-center transition-transform duration-100 ease-out"
          style={{
            transform: showZoomControls ? `translate(${pan.x}px, ${pan.y}px) scale(${zoomScale})` : 'none',
            transformOrigin: 'center center',
          }}
        >
          <img
            key={currentUrl}
            src={currentUrl}
            alt={title ? `${title} - image ${currentIndex + 1}` : `Image ${currentIndex + 1}`}
            className={cn(
              'h-full w-full object-contain pointer-events-none transition-opacity duration-300',
              loaded ? 'opacity-100' : 'opacity-80'
            )}
            onLoad={() => setLoaded(true)}
            onError={(e) => {
              ;(e.currentTarget as HTMLImageElement).style.display = 'none'
            }}
          />
        </div>

        {/* Counter Badge */}
        {showCounter && isMultiple && (
          <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5 rounded-full bg-black/75 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-md border border-white/10 shadow-md">
            <Images className="size-3.5" />
            <span>
              {currentIndex + 1} / {images.length}
            </span>
          </div>
        )}

        {/* Zoom Controls Toolbar & Guide Hint (Fullscreen Modal View Only) */}
        {showZoomControls && (
          <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-2">
            <div
              className={cn(
                'flex items-center gap-1 rounded-full bg-black/75 p-1 text-white backdrop-blur-md border border-white/10 shadow-lg transition-opacity duration-200',
                showControlsOnHover && 'opacity-0 group-hover/carousel:opacity-100'
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                aria-label="Zoom in"
                title="Zoom in (+)"
                className="flex size-7 items-center justify-center rounded-full transition-colors hover:bg-white/20 focus:outline-none"
                onClick={handleZoomIn}
              >
                <ZoomIn className="size-4" />
              </button>

              <span className="px-1 text-xs font-mono font-medium text-white/90">
                {Math.round(zoomScale * 100)}%
              </span>

              <button
                type="button"
                aria-label="Zoom out"
                title="Zoom out (-)"
                className="flex size-7 items-center justify-center rounded-full transition-colors hover:bg-white/20 focus:outline-none"
                onClick={handleZoomOut}
              >
                <ZoomOut className="size-4" />
              </button>

              {zoomScale !== 1 && (
                <button
                  type="button"
                  aria-label="Reset zoom"
                  title="Reset zoom (0)"
                  className="flex size-7 items-center justify-center rounded-full transition-colors hover:bg-white/20 focus:outline-none border-l border-white/20 ml-0.5 pl-1"
                  onClick={handleResetZoom}
                >
                  <RotateCcw className="size-3.5" />
                </button>
              )}
            </div>

            {/* User Guide Hint Pill */}
            <div className="hidden sm:flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white/80 backdrop-blur-md border border-white/10 shadow-sm">
              <span>Hold <kbd className="rounded bg-white/20 px-1 py-0.5 font-mono text-[10px] text-white">Ctrl</kbd> + Scroll to zoom</span>
            </div>
          </div>
        )}

        {/* Carousel Prev / Next Buttons */}
        {isMultiple && (
          <>
            <button
              type="button"
              aria-label="Previous picture"
              className={cn(
                'absolute left-2 top-1/2 z-10 -translate-y-1/2 flex size-9 items-center justify-center rounded-full bg-black/75 text-white transition-all hover:bg-black/95 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary shadow-lg border border-white/10',
                showControlsOnHover && 'opacity-0 group-hover/carousel:opacity-100'
              )}
              onClick={goToPrev}
            >
              <ChevronLeft className="size-6" />
            </button>

            <button
              type="button"
              aria-label="Next picture"
              className={cn(
                'absolute right-2 top-1/2 z-10 -translate-y-1/2 flex size-9 items-center justify-center rounded-full bg-black/75 text-white transition-all hover:bg-black/95 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary shadow-lg border border-white/10',
                showControlsOnHover && 'opacity-0 group-hover/carousel:opacity-100'
              )}
              onClick={goToNext}
            >
              <ChevronRight className="size-6" />
            </button>
          </>
        )}

        {/* Bottom Dot Indicators */}
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

      {/* Thumbnail Bar with Padding */}
      {showThumbnails && isMultiple && (
        <div className="flex gap-2.5 overflow-x-auto px-3 py-2 scrollbar-thin scrollbar-thumb-muted-foreground/30 shrink-0 max-h-24">
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
