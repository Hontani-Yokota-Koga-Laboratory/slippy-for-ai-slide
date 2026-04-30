import type { TitleSlide as TitleSlideType } from '../../types'
import { MathText } from '../MathText'

interface Props {
  slide: TitleSlideType
  pageNum: number
}

export function TitleSlide({ slide, pageNum }: Props) {
  const { tag, heading, author, date } = slide.props

  const dateStr = !date || date === 'auto'
    ? (() => { const d = new Date(); return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日` })()
    : date

  return (
    <div className="slide-canvas sc-title">
      {tag && <span className="sc-title-tag">{tag}</span>}
      <h1><MathText>{heading}</MathText></h1>
      <hr className="sc-title-divider" />
      <div className="sc-title-meta">
        {author && <div>発表：<strong><MathText>{author}</MathText></strong></div>}
        <div>{dateStr}</div>
      </div>
      <div className="slide-page-number">{pageNum}</div>
    </div>
  )
}
