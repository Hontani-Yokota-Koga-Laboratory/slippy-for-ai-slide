import { useState, useEffect, useRef } from 'react'
import type { Slide, SlideComponent, MoveTarget, OverlayComponent } from '../types'

interface Props {
  slide: Slide | null
  selectedComponentId: string | null
  onSelectComponent: (componentId: string) => void
  onAddComponent: (index: number, type: SlideComponent['type']) => void
  onDeleteComponent: (id: string) => void
  onMoveUpDown: (id: string, dir: 'up' | 'down') => void
  onLayerMove: (sourceId: string, target: MoveTarget) => void
  onAddOverlay: (type: OverlayComponent['type']) => void
  onDeleteOverlay: (id: string) => void
}

// ── Badges ─────────────────────────────────────────────────────────────────

const COMP_BADGE: Record<string, { label: string; bg: string }> = {
  box:     { label: 'BOX',  bg: '#1d4ed8' },
  cols:    { label: 'COLS', bg: '#c2410c' },
  figure:  { label: 'FIG',  bg: '#047857' },
  text:    { label: 'TXT',  bg: '#374151' },
  h3:      { label: 'H3',   bg: '#5b21b6' },
  ul:      { label: 'LIST', bg: '#374151' },
  table:   { label: 'TBL',  bg: '#0e7490' },
  divider: { label: '─',    bg: '#374151' },
  vcenter: { label: 'VCT',  bg: '#6d28d9' },
}

const ADDABLE: Array<{ type: SlideComponent['type']; label: string; bg: string }> = [
  { type: 'box',     label: 'BOX',  bg: '#1d4ed8' },
  { type: 'text',    label: 'TXT',  bg: '#374151' },
  { type: 'h3',      label: 'H3',   bg: '#5b21b6' },
  { type: 'ul',      label: 'LIST', bg: '#374151' },
  { type: 'cols',    label: 'COLS', bg: '#c2410c' },
  { type: 'figure',  label: 'FIG',  bg: '#047857' },
  { type: 'table',   label: 'TBL',  bg: '#0e7490' },
  { type: 'divider', label: '─',    bg: '#4b5563' },
  { type: 'vcenter', label: 'VCT',  bg: '#6d28d9' },
]

function Badge({ label, bg }: { label: string; bg: string }) {
  return (
    <span
      className="text-white font-bold uppercase shrink-0"
      style={{ background: bg, fontSize: 9, padding: '1px 5px', borderRadius: 3, letterSpacing: '0.05em' }}
    >
      {label}
    </span>
  )
}

// ── Type picker ────────────────────────────────────────────────────────────

function TypePicker({ onSelect, onClose }: {
  onSelect: (type: SlideComponent['type']) => void
  onClose: () => void
}) {
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

// ── Helpers ────────────────────────────────────────────────────────────────

function getCompLabel(comp: SlideComponent): string {
  if (comp.type === 'box')    return comp.props.label ? `— ${comp.props.label}` : comp.children.slice(0, 18)
  if (comp.type === 'h3')     return comp.children.slice(0, 20)
  if (comp.type === 'text')   return comp.children.replace(/<[^>]+>/g, '').slice(0, 20)
  if (comp.type === 'cols')   return `${comp.props.left} : ${comp.props.right}`
  if (comp.type === 'figure') return comp.props.chartId
  return ''
}

type MoveState = { mode: 'idle' } | { mode: 'selecting'; sourceId: string }

// ── Component node ─────────────────────────────────────────────────────────

interface CompNodeProps {
  comp: SlideComponent
  index: number
  listIndex: number
  listLength: number
  selectedId: string | null
  pickerAt: number | undefined
  moveState: MoveState
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

function CompNode({
  comp, index, listIndex, listLength, selectedId, pickerAt, moveState,
  onSelect, onRequestPicker, onClosePicker, onPickType, onDelete,
  onMoveUpDown, onStartLayerMove, onLayerMoveTo,
  depth, isTopLevel,
}: CompNodeProps) {
  const isSelected = selectedId === comp.id
  const isMoveSrc = moveState.mode === 'selecting' && moveState.sourceId === comp.id
  const isSelectingMode = moveState.mode === 'selecting'
  const badge = COMP_BADGE[comp.type] ?? { label: comp.type, bg: '#374151' }
  const subLabel = getCompLabel(comp)
  const indent = 8 + depth * 14

  const rowBg = isMoveSrc
    ? 'bg-amber-800/50'
    : isSelected
      ? 'bg-blue-600'
      : 'hover:bg-gray-700'

  return (
    <>
      {/* Insert-before picker: index > 0 only; index=0 is handled by the outer block */}
      {isTopLevel && pickerAt === index && index > 0 && (
        <TypePicker
          onSelect={(t) => onPickType(index, t)}
          onClose={onClosePicker}
        />
      )}

      {/* Component row */}
      <div
        className={`group flex items-center gap-1.5 py-1 pr-1 cursor-pointer select-none ${rowBg}`}
        style={{ paddingLeft: indent }}
        onClick={() => onSelect(comp.id)}
      >
        <span className="text-gray-600 text-xs shrink-0">└</span>
        <Badge label={badge.label} bg={isSelected ? '#1d4ed8' : badge.bg} />
        {subLabel && (
          <span className={`text-xs truncate min-w-0 ${isSelected ? 'text-white' : 'text-gray-400'}`}
            style={{ flex: '0 1 auto', maxWidth: 80 }}>
            {subLabel}
          </span>
        )}
        <span className="flex-1" />

        {/* Move-here buttons — visible when this component is a valid target in selecting mode */}
        {isSelectingMode && !isMoveSrc && (comp.type === 'vcenter' || comp.type === 'cols') && (
          <span className="flex items-center gap-0.5 shrink-0">
            {comp.type === 'vcenter' && (
              <button
                className="text-white rounded hover:brightness-125 transition-colors"
                style={{ background: '#7c3aed', fontSize: 9, padding: '2px 5px', borderRadius: 3 }}
                onClick={(e) => { e.stopPropagation(); onLayerMoveTo({ kind: 'vcenter', id: comp.id }) }}
              >→ ここへ</button>
            )}
            {comp.type === 'cols' && (
              <>
                <button
                  className="text-white rounded hover:brightness-125 transition-colors"
                  style={{ background: '#c2410c', fontSize: 9, padding: '2px 5px', borderRadius: 3 }}
                  onClick={(e) => { e.stopPropagation(); onLayerMoveTo({ kind: 'cols', id: comp.id, colIndex: 0 }) }}
                >→ 列1</button>
                <button
                  className="text-white rounded hover:brightness-125 transition-colors"
                  style={{ background: '#c2410c', fontSize: 9, padding: '2px 5px', borderRadius: 3 }}
                  onClick={(e) => { e.stopPropagation(); onLayerMoveTo({ kind: 'cols', id: comp.id, colIndex: 1 }) }}
                >→ 列2</button>
              </>
            )}
          </span>
        )}

        {/* Normal action buttons — hover only, hidden in selecting mode */}
        {!isSelectingMode && (
          <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 shrink-0">
            {/* Same-layer move */}
            <button
              title="上に移動"
              className={`text-xs w-4 h-4 flex items-center justify-center rounded transition-colors
                ${listIndex === 0 ? 'text-gray-700 cursor-not-allowed' : 'text-gray-500 hover:text-blue-400 hover:bg-gray-600'}`}
              onClick={(e) => { e.stopPropagation(); if (listIndex > 0) onMoveUpDown(comp.id, 'up') }}
            >▲</button>
            <button
              title="下に移動"
              className={`text-xs w-4 h-4 flex items-center justify-center rounded transition-colors
                ${listIndex === listLength - 1 ? 'text-gray-700 cursor-not-allowed' : 'text-gray-500 hover:text-blue-400 hover:bg-gray-600'}`}
              onClick={(e) => { e.stopPropagation(); if (listIndex < listLength - 1) onMoveUpDown(comp.id, 'down') }}
            >▼</button>
            {/* Layer move */}
            <button
              title="レイヤー移動"
              className="text-gray-500 hover:text-purple-400 text-xs w-4 h-4 flex items-center justify-center rounded hover:bg-gray-600 transition-colors"
              onClick={(e) => { e.stopPropagation(); onStartLayerMove(comp.id) }}
            >⇄</button>
            {/* Insert before/after — top-level only */}
            {isTopLevel && (
              <>
                <button
                  title="この前に追加"
                  className="text-gray-500 hover:text-blue-400 text-xs w-4 h-4 flex items-center justify-center rounded hover:bg-gray-600 transition-colors"
                  onClick={(e) => { e.stopPropagation(); onRequestPicker(index) }}
                >↑</button>
                <button
                  title="この後に追加"
                  className="text-gray-500 hover:text-green-400 text-xs w-4 h-4 flex items-center justify-center rounded hover:bg-gray-600 transition-colors"
                  onClick={(e) => { e.stopPropagation(); onRequestPicker(index + 1) }}
                >↓</button>
              </>
            )}
            {/* Delete */}
            <button
              title="削除"
              className="text-gray-500 hover:text-red-400 text-xs w-4 h-4 flex items-center justify-center rounded hover:bg-gray-600 transition-colors"
              onClick={(e) => { e.stopPropagation(); onDelete(comp.id) }}
            >×</button>
          </span>
        )}

        {isMoveSrc && (
          <span className="text-amber-300 shrink-0" style={{ fontSize: 9 }}>移動元</span>
        )}
      </div>

      {/* VCenter children */}
      {comp.type === 'vcenter' && comp.children.map((child, i) => (
        <CompNode
          key={child.id}
          comp={child}
          index={-1}
          listIndex={i}
          listLength={comp.children.length}
          selectedId={selectedId}
          pickerAt={undefined}
          moveState={moveState}
          onSelect={onSelect}
          onRequestPicker={() => {}}
          onClosePicker={onClosePicker}
          onPickType={() => {}}
          onDelete={onDelete}
          onMoveUpDown={onMoveUpDown}
          onStartLayerMove={onStartLayerMove}
          onLayerMoveTo={onLayerMoveTo}
          depth={depth + 1}
          isTopLevel={false}
        />
      ))}

      {/* Cols */}
      {comp.type === 'cols' && comp.columns.map((col, colIdx) => (
        <div key={colIdx}>
          <div
            className="flex items-center gap-1 py-0.5 select-none"
            style={{ paddingLeft: indent + 14 }}
          >
            <span className="text-xs text-gray-700">└</span>
            <span style={{ fontSize: 9, color: '#4b5563' }}>Col {colIdx + 1}</span>
          </div>
          {col.map((child, i) => (
            <CompNode
              key={child.id}
              comp={child}
              index={-1}
              listIndex={i}
              listLength={col.length}
              selectedId={selectedId}
              pickerAt={undefined}
              moveState={moveState}
              onSelect={onSelect}
              onRequestPicker={() => {}}
              onClosePicker={onClosePicker}
              onPickType={() => {}}
              onDelete={onDelete}
              onMoveUpDown={onMoveUpDown}
              onStartLayerMove={onStartLayerMove}
              onLayerMoveTo={onLayerMoveTo}
              depth={depth + 2}
              isTopLevel={false}
            />
          ))}
        </div>
      ))}
    </>
  )
}

// ── Main tree ──────────────────────────────────────────────────────────────

// ── Overlay node ───────────────────────────────────────────────────────────

function OverlayNode({ overlay, isSelected, onSelect, onDelete }: {
  overlay: OverlayComponent
  isSelected: boolean
  onSelect: (id: string) => void
  onDelete: (id: string) => void
}) {
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

// ── Main tree ──────────────────────────────────────────────────────────────

export function ComponentTree({
  slide, selectedComponentId, onSelectComponent,
  onAddComponent, onDeleteComponent, onMoveUpDown, onLayerMove,
  onAddOverlay, onDeleteOverlay,
}: Props) {
  const [pickerAt, setPickerAt] = useState<number | undefined>(undefined)
  const [moveState, setMoveState] = useState<MoveState>({ mode: 'idle' })

  const handlePickType = (index: number, type: SlideComponent['type']) => {
    onAddComponent(index, type)
    setPickerAt(undefined)
  }

  const handleStartLayerMove = (id: string) => {
    setMoveState({ mode: 'selecting', sourceId: id })
    setPickerAt(undefined)
  }

  const handleLayerMoveTo = (target: MoveTarget) => {
    if (moveState.mode !== 'selecting') return
    onLayerMove(moveState.sourceId, target)
    setMoveState({ mode: 'idle' })
  }

  const children = slide?.layout === 'content' ? slide.children : []
  const isContentSlide = slide?.layout === 'content'

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-700 shrink-0">
        Components
        {isContentSlide && <span className="ml-1 font-normal text-gray-600">— {children.length}</span>}
      </div>

      {/* Layer-move mode banner */}
      {moveState.mode === 'selecting' && (
        <div className="px-3 py-2 bg-amber-900/40 border-b border-amber-700/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-amber-300" style={{ fontSize: 10 }}>移動先を選択</span>
            <button
              className="text-white rounded hover:brightness-125 transition-colors"
              style={{ background: '#374151', fontSize: 9, padding: '2px 6px', borderRadius: 3 }}
              onClick={() => handleLayerMoveTo({ kind: 'slide' })}
            >→ Top Level</button>
          </div>
          <button
            className="text-gray-400 hover:text-white transition-colors"
            style={{ fontSize: 10 }}
            onClick={() => setMoveState({ mode: 'idle' })}
          >キャンセル</button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto thin-scroll py-1">
        {!slide && (
          <div className="px-3 py-2 text-xs text-gray-600">スライドを選択してください</div>
        )}

        {slide && !isContentSlide && (
          <div className="px-3 py-2 text-xs text-gray-600">このレイアウトにはコンポーネントがありません</div>
        )}

        {isContentSlide && (
          <>
            {/* Picker at position 0 (insert before first component, or when list is empty) */}
            {pickerAt === 0 && (
              <TypePicker
                onSelect={(t) => handlePickType(0, t)}
                onClose={() => setPickerAt(undefined)}
              />
            )}

            {children.length === 0 && pickerAt !== 0 && (
              <div className="px-3 py-2 text-xs text-gray-600">コンポーネントがありません</div>
            )}

            {children.map((comp, i) => (
              <CompNode
                key={comp.id}
                comp={comp}
                index={i}
                listIndex={i}
                listLength={children.length}
                selectedId={selectedComponentId}
                pickerAt={pickerAt}
                moveState={moveState}
                onSelect={onSelectComponent}
                onRequestPicker={setPickerAt}
                onClosePicker={() => setPickerAt(undefined)}
                onPickType={handlePickType}
                onDelete={onDeleteComponent}
                onMoveUpDown={onMoveUpDown}
                onStartLayerMove={handleStartLayerMove}
                onLayerMoveTo={handleLayerMoveTo}
                depth={0}
                isTopLevel={true}
              />
            ))}

            {pickerAt === children.length && children.length > 0 && (
              <TypePicker
                onSelect={(t) => handlePickType(children.length, t)}
                onClose={() => setPickerAt(undefined)}
              />
            )}

            {moveState.mode === 'idle' && (
              <button
                className="w-full mt-1 py-1.5 text-xs text-gray-600 hover:text-blue-400 hover:bg-gray-700/50 transition-colors flex items-center justify-center gap-1"
                onClick={() => setPickerAt(children.length)}
              >
                <span>+</span>
                <span>コンポーネントを追加</span>
              </button>
            )}
          </>
        )}
      </div>

      {/* Overlays section */}
      {isContentSlide && (
        <div className="border-t border-gray-700 shrink-0">
          <div className="px-3 py-1.5 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
              Overlays
              {(slide?.layout === 'content' && (slide.overlays?.length ?? 0) > 0) && (
                <span className="ml-1 font-normal text-gray-600">— {slide.overlays!.length}</span>
              )}
            </span>
            <button
              className="text-gray-500 hover:text-blue-400 transition-colors"
              style={{ fontSize: 10 }}
              title="テキストボックスを追加"
              onClick={() => onAddOverlay('abs-textbox')}
            >+ ABS</button>
          </div>
          {slide?.layout === 'content' && (slide.overlays ?? []).map(overlay => (
            <OverlayNode
              key={overlay.id}
              overlay={overlay}
              isSelected={selectedComponentId === overlay.id}
              onSelect={onSelectComponent}
              onDelete={onDeleteOverlay}
            />
          ))}
        </div>
      )}
    </div>
  )
}
