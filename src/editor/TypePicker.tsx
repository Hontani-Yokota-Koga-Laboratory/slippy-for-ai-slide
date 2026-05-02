import { useEffect, useRef } from 'react'
import type { SlideComponent } from '../types'

const ADDABLE: Array<{ type: SlideComponent['type']; label: string; bg: string }> = [
  { type: 'box',     label: 'BOX',  bg: '#1d4ed8' },
  { type: 'text',    label: 'TXT',  bg: '#374151' },
  { type: 'h3',      label: 'H3',   bg: '#5b21b6' },
  { type: 'ul',      label: 'LIST', bg: '#374151' },
  { type: 'cols',    label: 'COLS', bg: '#c2410c' },
  { type: 'figure',  label: 'FIG',  bg: '#047857' },
  { type: 'image',   label: 'IMG',  bg: '#047857' },
  { type: 'table',   label: 'TBL',  bg: '#0e7490' },
  { type: 'divider', label: '─',    bg: '#4b5563' },
  { type: 'vcenter', label: 'VCT',  bg: '#6d28d9' },
]

interface Props {
  onSelect: (type: SlideComponent['type']) => void
  onClose: () => void
}

export function TypePicker({ onSelect, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose()
    }
    const id = setTimeout(() => document.addEventListener('mousedown', handler), 0)
    return () => { clearTimeout(id); document.removeEventListener('mousedown', handler) }
  }, [onClose])

  return (
    <div ref={ref} className="mx-2 my-0.5 p-1.5 bg-gray-700 rounded border border-gray-600 flex flex-wrap gap-1">
      {ADDABLE.map(({ type, label, bg }) => (
        <button
          key={type}
          className="text-white font-bold uppercase rounded hover:brightness-125 transition-all"
          style={{ background: bg, fontSize: 9, padding: '3px 7px', letterSpacing: '0.05em' }}
          onClick={() => { onSelect(type); onClose() }}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
