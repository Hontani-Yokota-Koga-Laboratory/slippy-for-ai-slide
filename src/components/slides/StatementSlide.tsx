import type { StatementSlide as StatementSlideType } from '../../types'
import { MathText } from '../MathText'

interface Props {
  slide: StatementSlideType
  pageNum: number
}

export function StatementSlide({ slide, pageNum }: Props) {
  return (
    <div className="slide-canvas sc-accent sc-statement">
      <div className="sc-statement-text">
        <MathText>{slide.props.children}</MathText>
      </div>
      <div className="slide-page-number">{pageNum}</div>
    </div>
  )
}
