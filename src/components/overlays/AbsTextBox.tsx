import { useRef, useEffect } from 'react'
import type { AbsTextBox as AbsTextBoxType } from '../../types'
import { useSlideInteraction } from '../../context/SlideInteractionContext'
import { MathText } from '../MathText'

const INNER_PADDING = {
  top: 52,
  left: 72,
  right: 72,
  bottom: 40
}

export function AbsTextBox({ overlay }: { overlay: AbsTextBoxType }) {
  const { selectedId, onSelect, onMoveOverlay } = useSlideInteraction()
  const isSelected = selectedId === overlay.id
  
  const { x = 0, y = 0, width, height, content, fontSize, borderColor, fitToInner } = overlay.props

  // Use a ref to keep track of the current props for the event listeners
  const propsRef = useRef(overlay.props)
  useEffect(() => {
    propsRef.current = overlay.props
  }, [overlay.props])

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation()
    onSelect(overlay.id)

    const el = e.currentTarget
    const canvas = el.closest('.slide-canvas') as HTMLElement | null
    if (!canvas) return

    const canvasRect = canvas.getBoundingClientRect()
    const scale = canvasRect.width / 1280

    const startClientX = e.clientX
    const startClientY = e.clientY
    
    // Get actual dimensions (even if width/height are auto)
    const rect = el.getBoundingClientRect()
    const actualWidth = rect.width / scale
    const actualHeight = rect.height / scale

    // Use current display position as starting point
    const currentX = propsRef.current.x ?? 0
    const currentY = propsRef.current.y ?? 0
    
    const startX = propsRef.current.fitToInner 
      ? Math.max(INNER_PADDING.left, Math.min(currentX, 1280 - INNER_PADDING.right - actualWidth))
      : currentX
    const startY = propsRef.current.fitToInner
      ? Math.max(INNER_PADDING.top, Math.min(currentY, 720 - INNER_PADDING.bottom - actualHeight))
      : currentY

    const onMouseMove = (ev: MouseEvent) => {
      const dx = (ev.clientX - startClientX) / scale
      const dy = (ev.clientY - startClientY) / scale
      
      let nextX = Math.round(startX + dx)
      let nextY = Math.round(startY + dy)

      if (propsRef.current.fitToInner) {
        // Constrain based on the dimensions we measured at the start of drag
        nextX = Math.max(INNER_PADDING.left, Math.min(nextX, 1280 - INNER_PADDING.right - actualWidth))
        nextY = Math.max(INNER_PADDING.top, Math.min(nextY, 720 - INNER_PADDING.bottom - actualHeight))
      }

      if (!isNaN(nextX) && !isNaN(nextY)) {
        onMoveOverlay(overlay.id, nextX, nextY)
      }
    }

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  // For initial display placement when fitToInner is ON:
  // If width/height are undefined (auto), we fallback to 0 for boundary calculation 
  // to prevent NaN while allowing the box to size itself automatically.
  const displayX = fitToInner 
    ? Math.max(INNER_PADDING.left, Math.min(x, 1280 - INNER_PADDING.right - (width ?? 0)))
    : x
  const displayY = fitToInner
    ? Math.max(INNER_PADDING.top, Math.min(y, 720 - INNER_PADDING.bottom - (height ?? 0)))
    : y

  return (
    <div
      className={isSelected ? 'selected-component' : ''}
      style={{
        position: 'absolute',
        left: displayX,
        top: displayY,
        width: width ?? 'auto',
        height: height ?? 'auto',
        boxSizing: 'border-box',
        border: `1.5px solid ${borderColor || '#94a3b8'}`,
        borderRadius: 4,
        background: 'white',
        padding: '8px 12px',
        fontSize: fontSize ? `${fontSize}em` : '0.9em',
        cursor: 'move',
        userSelect: 'none',
        zIndex: 100,
        overflow: 'hidden',
        color: '#111827',
        lineHeight: 1.5,
      }}
      onMouseDown={handleMouseDown}
    >
      <MathText>{content}</MathText>
    </div>
  )
}
