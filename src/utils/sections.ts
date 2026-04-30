import type { Slide, TocEntry } from '../types'

export interface SectionInfo {
  num: string
  label: string
}

export function computeSectionNumbers(slides: Slide[]): Map<string, SectionInfo> {
  const map = new Map<string, SectionInfo>()
  let sec = 0, sub = 0, subsub = 0

  for (const slide of slides) {
    if (slide.layout === 'section') {
      sec++; sub = 0; subsub = 0
      map.set(slide.id, { num: String(sec), label: `Section ${sec}` })
    } else if (slide.layout === 'subsection') {
      sub++; subsub = 0
      map.set(slide.id, { num: `${sec}.${sub}`, label: `${sec}.${sub}` })
    } else if (slide.layout === 'subsubsection') {
      subsub++
      map.set(slide.id, { num: `${sec}.${sub}.${subsub}`, label: `${sec}.${sub}.${subsub}` })
    }
  }

  return map
}

export function computeTocEntries(slides: Slide[]): TocEntry[] {
  const entries: TocEntry[] = []
  let sec = 0, sub = 0, subsub = 0

  for (const slide of slides) {
    if (slide.layout === 'section') {
      sec++; sub = 0; subsub = 0
      entries.push({ level: 1, num: String(sec), text: slide.props.title })
    } else if (slide.layout === 'subsection') {
      sub++; subsub = 0
      entries.push({ level: 2, num: `${sec}.${sub}`, text: slide.props.title })
    } else if (slide.layout === 'subsubsection') {
      subsub++
      entries.push({ level: 3, num: `${sec}.${sub}.${subsub}`, text: slide.props.title })
    }
  }

  return entries
}
