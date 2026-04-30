import type { SectionSlide as SectionType, SubsectionSlide as SubsectionType, SubsubsectionSlide as SubsubsectionType } from '../../types'
import type { SectionInfo } from '../../utils/sections'
import { MathText } from '../MathText'

interface SectionProps {
  slide: SectionType
  info: SectionInfo
  pageNum: number
}

export function SectionSlide({ slide, info, pageNum }: SectionProps) {
  return (
    <div className="slide-canvas sc-section">
      <div className="sc-section-num">{info.label}</div>
      <div className="sc-section-title"><MathText>{slide.props.title}</MathText></div>
      <div className="slide-page-number" style={{ color: 'rgba(255,255,255,0.4)' }}>{pageNum}</div>
    </div>
  )
}

interface SubsectionProps {
  slide: SubsectionType
  info: SectionInfo
  pageNum: number
}

export function SubsectionSlide({ slide, info, pageNum }: SubsectionProps) {
  return (
    <div className="slide-canvas sc-subsection">
      <div className="sc-subsection-num">{info.label}</div>
      <div className="sc-subsection-title"><MathText>{slide.props.title}</MathText></div>
      <div className="slide-page-number" style={{ color: 'rgba(255,255,255,0.4)' }}>{pageNum}</div>
    </div>
  )
}

interface SubsubsectionProps {
  slide: SubsubsectionType
  info: SectionInfo
  pageNum: number
}

export function SubsubsectionSlide({ slide, info, pageNum }: SubsubsectionProps) {
  return (
    <div className="slide-canvas sc-accent sc-subsubsection">
      <div className="sc-subsubsection-num">{info.label}</div>
      <div className="sc-subsubsection-title"><MathText>{slide.props.title}</MathText></div>
      <div className="slide-page-number">{pageNum}</div>
    </div>
  )
}
