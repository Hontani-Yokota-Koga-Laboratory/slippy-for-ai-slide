import type { BoxComponent } from '../../types'
import { MathText } from '../MathText'

interface Props {
  block: BoxComponent
  selected?: boolean
  onClick?: (e: React.MouseEvent) => void
}

export function SlideBox({ block, selected, onClick }: Props) {
  const { variant, label, labelFontSize, bodyFontSize, width } = block.props

  const boxStyle: React.CSSProperties = {}
  if (width) boxStyle.width = width

  return (
    <div
      className={`slide-box box-${variant}${selected ? ' selected-component' : ''}`}
      style={Object.keys(boxStyle).length ? boxStyle : undefined}
      onClick={onClick}
    >
      {label && (
        <div
          className="slide-box-label"
          style={labelFontSize ? { fontSize: `${labelFontSize}em` } : undefined}
        >
          <MathText>{label}</MathText>
        </div>
      )}
      <div
        className="slide-box-body"
        style={bodyFontSize ? { fontSize: `${bodyFontSize}em` } : undefined}
      >
        <MathText>{block.children}</MathText>
      </div>
    </div>
  )
}
