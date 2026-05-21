import { useProject } from '../../context/ProjectContext'
import type { ImageComponent } from '../../types'
import { MathText } from '../MathText'

interface Props {
  block: ImageComponent
  selected?: boolean
  onClick?: (e: React.MouseEvent) => void
}

export function SlideImage({ block, selected, onClick }: Props) {
  const project = useProject()
  const { src, caption, width, height, borderColor } = block.props

  const isPlaceholder = !src || src === '_placeholder'

  if (isPlaceholder) {
    return (
      <div
        className={`slide-figure${selected ? ' selected-component' : ''}`}
        onClick={onClick}
        style={{
          cursor: onClick ? 'pointer' : undefined,
          width: width ? `${width}px` : '100%',
          height: height ? `${height}px` : '200px',
          border: '2px dashed #94a3b8',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          color: '#94a3b8',
          backgroundColor: '#f8fafc',
          margin: '0 auto',
        }}
      >
        <span style={{ fontSize: '2em' }}>🖼️</span>
        {caption && (
          <span style={{ fontSize: '0.85em', textAlign: 'center', padding: '0 16px' }}>
            {caption}
          </span>
        )}
      </div>
    )
  }

  const imageUrl = `/api/projects/${project}/images/${src}`

  return (
    <div
      className={`slide-figure${selected ? ' selected-component' : ''}`}
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : undefined}
    >
      <img
        src={imageUrl}
        alt={caption || 'slide image'}
        style={{
          width: width ? `${width}px` : 'auto',
          height: height ? `${height}px` : 'auto',
          maxWidth: '100%',
          display: 'block',
          margin: '0 auto',
          borderRadius: '4px',
          border: borderColor ? `2px solid ${borderColor}` : 'none'
        }}
      />
      {caption && <MathText className="slide-figure-caption">{caption}</MathText>}
    </div>
  )
}
