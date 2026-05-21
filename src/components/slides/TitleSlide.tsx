import type { TitleSlide as TitleSlideType } from '../../types'
import { MathText } from '../MathText'

interface Props {
  slide: TitleSlideType
  pageNum: number
  lang?: string
}

export function TitleSlide({ slide, pageNum, lang = 'ja' }: Props) {
  const { tag, heading, author, date } = slide.props

  const dateStr = !date || date === 'auto'
    ? (() => {
        const d = new Date()
        if (lang === 'en') {
          return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        }
        return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
      })()
    : date

  const authorLabel = lang === 'en' ? 'Presented by: ' : '発表：'

  return (
    <div className="slide-canvas sc-title">
      {tag && <span className="sc-title-tag">{tag}</span>}
      <h1><MathText>{heading}</MathText></h1>
      <hr className="sc-title-divider" />
      <div className="sc-title-meta">
        {author && <div>{authorLabel}<strong><MathText>{author}</MathText></strong></div>}
        <div>{dateStr}</div>
      </div>
      <div className="slide-page-number">{pageNum}</div>
    </div>
  )
}
