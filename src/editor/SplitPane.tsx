import { useState, useRef, useCallback, type ReactNode } from 'react'

interface Props {
  top: ReactNode
  bottom: ReactNode
  defaultTopPercent?: number
  minTopPercent?: number
  maxTopPercent?: number
}

export function SplitPane({ top, bottom, defaultTopPercent = 60, minTopPercent = 20, maxTopPercent = 85 }: Props) {
  const [topPercent, setTopPercent] = useState(defaultTopPercent)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragging.current = true

    const onMouseMove = (ev: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const pct = ((ev.clientY - rect.top) / rect.height) * 100
      setTopPercent(Math.max(minTopPercent, Math.min(maxTopPercent, pct)))
    }

    const onMouseUp = () => {
      dragging.current = false
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }, [minTopPercent, maxTopPercent])

  return (
    <div ref={containerRef} className="flex flex-col h-full overflow-hidden">
      {/* Top pane */}
      <div style={{ height: `${topPercent}%` }} className="overflow-hidden">
        {top}
      </div>

      {/* Drag handle */}
      <div
        className="shrink-0 h-1.5 bg-gray-700 hover:bg-blue-600 cursor-row-resize transition-colors relative group"
        onMouseDown={onMouseDown}
      >
        {/* visual dots hint */}
        <div className="absolute inset-0 flex items-center justify-center gap-0.5 pointer-events-none">
          <div className="w-4 h-px bg-gray-500 group-hover:bg-blue-300" />
        </div>
      </div>

      {/* Bottom pane */}
      <div className="flex-1 overflow-hidden min-h-0">
        {bottom}
      </div>
    </div>
  )
}
