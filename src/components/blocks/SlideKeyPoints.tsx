import type { KeyPointsComponent } from '../../types'
import { MathText } from '../MathText'

interface Props {
  block: KeyPointsComponent
  selected?: boolean
  onClick?: (e: React.MouseEvent) => void
}

export function SlideKeyPoints({ block, selected, onClick }: Props) {
  const variant = block.props?.variant ?? 'green'
  const fs = block.props?.fontSize

  return (
    <div
      className={`slide-key-points kp-${variant}${selected ? ' selected-component' : ''}`}
      style={fs ? { fontSize: `${fs}em` } : undefined}
      onClick={onClick}
    >
      {block.items.map((item, i) => (
        <div key={i} className="kp-item">
          <span className="kp-label"><MathText>{item.label}</MathText></span>
          <span className="kp-body"><MathText>{item.body}</MathText></span>
        </div>
      ))}
    </div>
  )
}
