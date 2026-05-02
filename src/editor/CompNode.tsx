import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { SlideComponent, MoveTarget } from '../types'
import { TypePicker } from './TypePicker'

interface Props {
  comp: SlideComponent
  index: number
  listIndex: number
  listLength: number
  selectedId: string | null
  pickerAt: number | undefined
  moveState: { mode: 'idle' } | { mode: 'selecting'; sourceId: string }
  onSelect: (id: string) => void
  onRequestPicker: (index: number) => void
  onClosePicker: () => void
  onPickType: (index: number, type: SlideComponent['type']) => void
  onDelete: (id: string) => void
  onMoveUpDown: (id: string, dir: 'up' | 'down') => void
  onStartLayerMove: (id: string) => void
  onLayerMoveTo: (target: MoveTarget) => void
  depth: number
  isTopLevel: boolean
}

const COMP_BADGE: Record<string, { label: string; bg: string }> = {
  box:     { label: 'BOX',  bg: '#1d4ed8' },
  cols:    { label: 'COLS', bg: '#c2410c' },
  figure:  { label: 'FIG',  bg: '#047857' },
  image:   { label: 'IMG',  bg: '#047857' },
  text:    { label: 'TXT',  bg: '#374151' },
  h3:      { label: 'H3',   bg: '#5b21b6' },
  ul:      { label: 'LIST', bg: '#374151' },
  table:   { label: 'TBL',  bg: '#0e7490' },
  divider: { label: '─',    bg: '#374151' },
  vcenter: { label: 'VCT',  bg: '#6d28d9' },
}

function getCompLabel(comp: SlideComponent): string {
  if (comp.type === 'box')    return comp.props.label ? `— ${comp.props.label}` : comp.children.slice(0, 18)
  if (comp.type === 'h3')     return comp.children.slice(0, 20)
  if (comp.type === 'text')   return comp.children.replace(/<[^>]+>/g, '').slice(0, 20)
  if (comp.type === 'cols')   return `${comp.props.left} : ${comp.props.right}`
  if (comp.type === 'figure') return comp.props.chartId
  if (comp.type === 'image')  return comp.props.src
  return ''
}

export function CompNode(props: Props) {
  const { comp, index, listIndex, listLength, selectedId, pickerAt, moveState, depth, isTopLevel } = props
  const { onSelect, onRequestPicker, onClosePicker, onPickType, onDelete, onMoveUpDown, onStartLayerMove, onLayerMoveTo } = props

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: comp.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  }

  const isSelected = selectedId === comp.id
  const isMoveSrc = moveState.mode === 'selecting' && moveState.sourceId === comp.id
  const isSelectingMode = moveState.mode === 'selecting'
  const badge = COMP_BADGE[comp.type] ?? { label: comp.type, bg: '#374151' }
  const subLabel = getCompLabel(comp)
  const indent = 8 + depth * 14

  const rowBg = isMoveSrc ? 'bg-amber-800/50' : isSelected ? 'bg-blue-600' : 'hover:bg-gray-700'

  return (
    <div ref={setNodeRef} style={style}>
      {isTopLevel && pickerAt === index && index > 0 && (
        <TypePicker onSelect={(t) => onPickType(index, t)} onClose={onClosePicker} />
      )}

      <div className={`group flex items-center gap-1.5 py-1 pr-1 cursor-pointer select-none ${rowBg}`} style={{ paddingLeft: indent }} onClick={() => onSelect(comp.id)}>
        {/* Drag handle — all levels */}
        {!isSelectingMode && (
          <span
            className="text-gray-600 hover:text-gray-400 cursor-grab active:cursor-grabbing shrink-0 text-xs px-0.5"
            {...attributes} {...listeners}
            onClick={e => e.stopPropagation()}
          >⠿</span>
        )}
        {!isTopLevel && isSelectingMode && <span className="text-gray-600 text-xs shrink-0">└</span>}

        <span className="text-white font-bold uppercase shrink-0" style={{ background: isSelected ? '#1d4ed8' : badge.bg, fontSize: 9, padding: '1px 5px', borderRadius: 3 }}>{badge.label}</span>
        {subLabel && <span className={`text-xs truncate min-w-0 ${isSelected ? 'text-white' : 'text-gray-400'}`} style={{ flex: '0 1 auto', maxWidth: 80 }}>{subLabel}</span>}
        <span className="flex-1" />

        {isSelectingMode && !isMoveSrc && (comp.type === 'vcenter' || comp.type === 'cols') && (
          <span className="flex items-center gap-0.5 shrink-0">
            {comp.type === 'vcenter' && <button className="text-white bg-purple-600 rounded px-1.5 py-0.5 text-[9px]" onClick={(e) => { e.stopPropagation(); onLayerMoveTo({ kind: 'vcenter', id: comp.id }) }}>→ ここへ</button>}
            {comp.type === 'cols' && [0, 1].map(i => <button key={i} className="text-white bg-orange-700 rounded px-1.5 py-0.5 text-[9px]" onClick={(e) => { e.stopPropagation(); onLayerMoveTo({ kind: 'cols', id: comp.id, colIndex: i }) }}>→ 列{i+1}</button>)}
          </span>
        )}

        {!isSelectingMode && (
          <span className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 shrink-0">
            <button className="text-gray-500 hover:text-purple-400 text-xs w-4 h-4" onClick={(e) => { e.stopPropagation(); onStartLayerMove(comp.id) }}>⇄</button>
            {isTopLevel && <>
              <button className="text-gray-500 hover:text-blue-400 text-xs w-4 h-4" onClick={(e) => { e.stopPropagation(); onRequestPicker(index) }}>↑</button>
              <button className="text-gray-500 hover:text-green-400 text-xs w-4 h-4" onClick={(e) => { e.stopPropagation(); onRequestPicker(index + 1) }}>↓</button>
            </>}
            <button className="text-gray-500 hover:text-red-400 text-xs w-4 h-4" onClick={(e) => { e.stopPropagation(); onDelete(comp.id) }}>×</button>
          </span>
        )}
        {isMoveSrc && <span className="text-amber-300 text-[9px] shrink-0">移動元</span>}
      </div>

      {comp.type === 'vcenter' && (
        <SortableContext items={comp.children.map(c => c.id)} strategy={verticalListSortingStrategy}>
          {comp.children.map((child, i) => (
            <CompNode key={child.id} {...props} comp={child} index={-1} listIndex={i} listLength={comp.children.length} depth={depth + 1} isTopLevel={false} />
          ))}
        </SortableContext>
      )}

      {comp.type === 'cols' && comp.columns.map((col, colIdx) => (
        <div key={colIdx}>
          <div className="flex items-center gap-1 py-0.5 select-none" style={{ paddingLeft: indent + 14 }}>
            <span className="text-xs text-gray-700">└</span><span className="text-[9px] text-gray-500">Col {colIdx + 1}</span>
          </div>
          <SortableContext items={col.map(c => c.id)} strategy={verticalListSortingStrategy}>
            {col.map((child, i) => (
              <CompNode key={child.id} {...props} comp={child} index={-1} listIndex={i} listLength={col.length} depth={depth + 2} isTopLevel={false} />
            ))}
          </SortableContext>
        </div>
      ))}
    </div>
  )
}
