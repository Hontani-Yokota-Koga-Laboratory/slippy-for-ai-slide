import { useEffect, useState } from 'react'
import type { Slide, TocEntry } from '../types'
import { SlideRenderer } from '../components/SlideRenderer'
import { computeSectionNumbers, computeTocEntries } from '../utils/sections'
import type { SectionInfo } from '../utils/sections'
import { ProjectContext } from '../context/ProjectContext'

interface Props {
  project: string
  theme?: string
}

export function PrintView({ project, theme }: Props) {
  const [slides, setSlides] = useState<Slide[]>([])
  const [sectionNumbers, setSectionNumbers] = useState<Map<string, SectionInfo>>(new Map())
  const [tocEntries, setTocEntries] = useState<TocEntry[]>([])
  const [lang, setLang] = useState('ja')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    fetch(`/api/projects/${project}/config`)
      .then(r => r.json())
      .then(data => { if (data.lang) setLang(data.lang) })
  }, [project])

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
    <ProjectContext.Provider value={project}>
      <link rel="stylesheet" href={`/api/projects/${project}/style.css`} />
      <div id="print-ready" className={`theme-${theme}`}>
        {slides.map((slide, i) => (
          <div key={slide.id} className="print-slide-wrapper">
            <SlideRenderer
              slide={slide}
              pageNum={i + 1}
              sectionNumbers={sectionNumbers}
              tocEntries={tocEntries}
              lang={lang}
            />
          </div>
        ))}
      </div>
    </ProjectContext.Provider>
  )
}
