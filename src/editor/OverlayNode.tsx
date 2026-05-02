import type { OverlayComponent } from '../types'

interface Props {
  overlay: OverlayComponent
  isSelected: boolean
  onSelect: (id: string) => void
  onDelete: (id: string) => void
}

export function OverlayNode({ overlay, isSelected, onSelect, onDelete }: Props) {
  return (
    <div
      className={`group flex items-center gap-1.5 py-1 pr-1 cursor-pointer select-none
        ${isSelected ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
      style={{ paddingLeft: 22 }}
      onClick={() => onSelect(overlay.id)}
    >
      <span className="text-gray-600 text-xs shrink-0">└</span>
      <span
        className="text-white font-bold uppercase shrink-0"
        style={{ background: '#0369a1', fontSize: 9, padding: '1px 5px', borderRadius: 3, letterSpacing: '0.05em' }}
      >ABS</span>
      <span className={`text-xs truncate min-w-0 flex-1 ${isSelected ? 'text-white' : 'text-gray-400'}`}>
        {overlay.props.content.slice(0, 20)}
      </span>
      <span className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          title="削除"
          className="text-gray-500 hover:text-red-400 text-xs w-4 h-4 flex items-center justify-center rounded hover:bg-gray-600 transition-colors"
          onClick={(e) => { e.stopPropagation(); onDelete(overlay.id) }}
        >×</button>
      </span>
    </div>
  )
}
