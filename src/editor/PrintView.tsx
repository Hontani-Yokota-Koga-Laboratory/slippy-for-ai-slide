import { useEffect, useState } from 'react'
import type { Slide, TocEntry } from '../types'
import { SlideRenderer } from '../components/SlideRenderer'
import { computeSectionNumbers, computeTocEntries } from '../utils/sections'
import type { SectionInfo } from '../utils/sections'

interface Props {
  project: string
}

export function PrintView({ project }: Props) {
  const [slides, setSlides] = useState<Slide[]>([])
  const [sectionNumbers, setSectionNumbers] = useState<Map<string, SectionInfo>>(new Map())
  const [tocEntries, setTocEntries] = useState<TocEntry[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    fetch(`/api/projects/${project}/slides`)
      .then(r => r.json())
      .then((data: Slide[]) => {
        setSlides(data)
        setSectionNumbers(computeSectionNumbers(data))
        setTocEntries(computeTocEntries(data))
        setReady(true)
      })
  }, [project])

  if (!ready) return <div id="print-loading">Loading...</div>

  return (
    <div id="print-ready">
      {slides.map((slide, i) => (
        <div key={slide.id} className="print-slide-wrapper">
          <SlideRenderer
            slide={slide}
            pageNum={i + 1}
            sectionNumbers={sectionNumbers}
            tocEntries={tocEntries}
          />
        </div>
      ))}
    </div>
  )
}
