import type { Slide } from '../types'
import type { SectionInfo } from '../utils/sections'

interface Props {
  slides: Slide[]
  sectionNumbers: Map<string, SectionInfo>
  selectedSlideId: string | null
  onSelectSlide: (id: string) => void
}

const LAYOUT_BADGE: Record<string, { label: string; bg: string }> = {
  title:         { label: 'TITLE', bg: '#1d4ed8' },
  toc:           { label: 'TOC',   bg: '#0e7490' },
  section:       { label: 'SEC',   bg: '#3730a3' },
  subsection:    { label: 'SUB',   bg: '#5b21b6' },
  subsubsection: { label: 'S3',    bg: '#6d28d9' },
  content:       { label: 'PAGE',  bg: '#374151' },
  statement:     { label: 'STM',   bg: '#9d174d' },
}

function Badge({ label, bg }: { label: string; bg: string }) {
  return (
    <span
      className="text-white font-bold uppercase shrink-0"
      style={{ background: bg, fontSize: 9, padding: '1px 5px', borderRadius: 3, letterSpacing: '0.05em' }}
    >
      {label}
    </span>
  )
}

function getSlideLabel(slide: Slide, info?: SectionInfo): string {
  if (slide.layout === 'section' || slide.layout === 'subsection' || slide.layout === 'subsubsection') {
    return `${info?.num ? info.num + ' ' : ''}${slide.props.title}`
  }
  if (slide.layout === 'title') return slide.props.heading
  if (slide.layout === 'content') return slide.props.heading
  if (slide.layout === 'statement') return slide.props.children.replace(/\\n/g, ' ').slice(0, 24) + '…'
  return slide.layout
}

export function SlideList({ slides, sectionNumbers, selectedSlideId, onSelectSlide }: Props) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-700 shrink-0">
        Pages — {slides.length}
      </div>

      <div className="flex-1 overflow-y-auto thin-scroll py-1">
        {slides.map((slide, i) => {
          const info = sectionNumbers.get(slide.id)
          const label = getSlideLabel(slide, info)
          const isSelected = selectedSlideId === slide.id
          const badge = LAYOUT_BADGE[slide.layout] ?? LAYOUT_BADGE.content

          return (
            <div
              key={slide.id}
              className={`flex items-center gap-1.5 px-2 py-1 cursor-pointer select-none
                ${isSelected ? 'bg-blue-700' : 'hover:bg-gray-700/60'}`}
              onClick={() => onSelectSlide(slide.id)}
            >
              <span className="text-xs text-gray-600 w-5 text-right shrink-0">{i + 1}</span>
              <Badge label={badge.label} bg={badge.bg} />
              <span className={`text-xs truncate ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                {label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
