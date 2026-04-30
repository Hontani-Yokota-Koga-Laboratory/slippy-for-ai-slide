import { useRef, useState, useEffect } from 'react'
import type { Slide, TocEntry } from '../types'
import type { SectionInfo } from '../utils/sections'
import { SlideRenderer } from '../components/SlideRenderer'
import { SlideInteractionContext } from '../context/SlideInteractionContext'

interface Props {
  slide: Slide | null
  slides: Slide[]
  slideIndex: number
  sectionNumbers: Map<string, SectionInfo>
  tocEntries: TocEntry[]
  selectedComponentId: string | null
  onSelectComponent: (id: string) => void
  onMoveOverlay: (id: string, x: number, y: number) => void
  onNavigate: (delta: number) => void
}

export function SlidePreview({ slide, slides, slideIndex, sectionNumbers, tocEntries, selectedComponentId, onSelectComponent, onMoveOverlay, onNavigate }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const update = () => {
      if (!containerRef.current) return
      const { width, height } = containerRef.current.getBoundingClientRect()
      const padding = 48
      const scaleX = (width - padding) / 1280
      const scaleY = (height - padding) / 720
      setScale(Math.min(scaleX, scaleY))
    }
    update()
    const ro = new ResizeObserver(update)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  return (
    <div className="flex flex-col h-full">
      {/* Preview area */}
      <div ref={containerRef} className="flex-1 flex items-center justify-center bg-gray-950 overflow-hidden">
        {slide ? (
          <div
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'center center',
              width: 1280,
              height: 720,
              flexShrink: 0,
            }}
          >
            <SlideInteractionContext.Provider value={{
              selectedId: selectedComponentId ?? undefined,
              onSelect: onSelectComponent,
              onMoveOverlay,
            }}>
              <SlideRenderer
                slide={slide}
                pageNum={slideIndex + 1}
                sectionNumbers={sectionNumbers}
                tocEntries={tocEntries}
                selectedComponentId={selectedComponentId ?? undefined}
                onSelectComponent={onSelectComponent}
              />
            </SlideInteractionContext.Provider>
          </div>
        ) : (
          <p className="text-gray-600 text-sm">スライドを選択してください</p>
        )}
      </div>

      {/* Navigation bar */}
      <div className="flex items-center justify-center gap-4 py-2 bg-gray-900 border-t border-gray-700 shrink-0">
        <button
          onClick={() => onNavigate(-1)}
          disabled={slideIndex <= 0}
          className="text-gray-400 hover:text-white disabled:opacity-30 text-lg px-2"
        >
          ←
        </button>
        <span className="text-gray-400 text-sm">
          {slideIndex + 1} / {slides.length}
        </span>
        <button
          onClick={() => onNavigate(1)}
          disabled={slideIndex >= slides.length - 1}
          className="text-gray-400 hover:text-white disabled:opacity-30 text-lg px-2"
        >
          →
        </button>
      </div>
    </div>
  )
}
