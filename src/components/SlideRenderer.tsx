import type { Slide, TocEntry } from '../types'
import type { SectionInfo } from '../utils/sections'
import { TitleSlide } from './slides/TitleSlide'
import { SectionSlide, SubsectionSlide, SubsubsectionSlide } from './slides/SectionSlide'
import { TocSlide } from './slides/TocSlide'
import { ContentSlide } from './slides/ContentSlide'
import { StatementSlide } from './slides/StatementSlide'

interface Props {
  slide: Slide
  pageNum: number
  sectionNumbers: Map<string, SectionInfo>
  tocEntries: TocEntry[]
  selectedComponentId?: string
  onSelectComponent?: (id: string) => void
}

export function SlideRenderer({ slide, pageNum, sectionNumbers, tocEntries, selectedComponentId, onSelectComponent }: Props) {
  switch (slide.layout) {
    case 'title':
      return <TitleSlide slide={slide} pageNum={pageNum} />

    case 'toc':
      return <TocSlide slide={slide} entries={tocEntries} pageNum={pageNum} />

    case 'section': {
      const info = sectionNumbers.get(slide.id) ?? { num: '', label: '' }
      return <SectionSlide slide={slide} info={info} pageNum={pageNum} />
    }

    case 'subsection': {
      const info = sectionNumbers.get(slide.id) ?? { num: '', label: '' }
      return <SubsectionSlide slide={slide} info={info} pageNum={pageNum} />
    }

    case 'subsubsection': {
      const info = sectionNumbers.get(slide.id) ?? { num: '', label: '' }
      return <SubsubsectionSlide slide={slide} info={info} pageNum={pageNum} />
    }

    case 'content':
      return (
        <ContentSlide
          slide={slide}
          pageNum={pageNum}
          selectedComponentId={selectedComponentId}
          onSelectComponent={onSelectComponent}
        />
      )

    case 'statement':
      return <StatementSlide slide={slide} pageNum={pageNum} />

    default:
      return <div className="slide-canvas sc-accent"><div className="slide-inner"><p>Unknown layout</p></div></div>
  }
}
