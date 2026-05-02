import { useProject } from '../../context/ProjectContext'
import type { ImageComponent } from '../../types'

interface Props {
  block: ImageComponent
  selected?: boolean
  onClick?: (e: React.MouseEvent) => void
}

export function SlideImage({ block, selected, onClick }: Props) {
  const project = useProject()
  const { src, caption, width, height, borderColor } = block.props

  // Construct image URL: /api/projects/{project}/images/{filename}
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
      {caption && <span className="slide-figure-caption">{caption}</span>}
    </div>
  )
}
