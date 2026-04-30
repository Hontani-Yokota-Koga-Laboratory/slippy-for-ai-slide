import type { ContentSlide as ContentSlideType } from '../../types'
import { ComponentRenderer } from '../blocks/ComponentRenderer'
import { AbsTextBox } from '../overlays/AbsTextBox'
import { MathText } from '../MathText'

interface Props {
  slide: ContentSlideType
  pageNum: number
  selectedComponentId?: string
  onSelectComponent?: (id: string) => void
}

export function ContentSlide({ slide, pageNum, selectedComponentId, onSelectComponent }: Props) {
  return (
    <div className="slide-canvas sc-accent">
      <div className="slide-inner">
        <h2><MathText>{slide.props.heading}</MathText></h2>
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          {slide.children.map(block => (
            <ComponentRenderer
              key={block.id}
              block={block}
              selectedId={selectedComponentId}
              onSelect={onSelectComponent}
            />
          ))}
        </div>
      </div>
      {slide.overlays?.map(overlay => (
        <AbsTextBox key={overlay.id} overlay={overlay} />
      ))}
      <div className="slide-page-number">{pageNum}</div>
    </div>
  )
}
