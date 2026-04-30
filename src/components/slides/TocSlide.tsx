import type { TocSlide as TocSlideType, TocEntry } from '../../types'

interface Props {
  slide: TocSlideType
  entries: TocEntry[]
  pageNum: number
}

export function TocSlide({ slide, entries, pageNum }: Props) {
  const heading = slide.props?.heading ?? '目次'

  return (
    <div className="slide-canvas sc-accent">
      <div className="slide-inner">
        <h2>{heading}</h2>
        <ul className="toc-list">
          {entries.map((entry, i) => (
            <li key={i} className={`toc-item toc-item-${entry.level}`}>
              <span className="toc-num">{entry.num}.</span>
              {entry.text}
            </li>
          ))}
        </ul>
      </div>
      <div className="slide-page-number">{pageNum}</div>
    </div>
  )
}
