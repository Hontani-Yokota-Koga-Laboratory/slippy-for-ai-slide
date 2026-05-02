import { useState } from 'react'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { Slide, SlideComponent, MoveTarget, OverlayComponent } from '../types'
import { TypePicker } from './TypePicker'
import { OverlayNode } from './OverlayNode'
import { CompNode } from './CompNode'

interface Props {
  slide: Slide | null
  selectedComponentId: string | null
  onSelectComponent: (componentId: string) => void
  onAddComponent: (index: number, type: SlideComponent['type']) => void
  onDeleteComponent: (id: string) => void
  onMoveUpDown: (id: string, dir: 'up' | 'down') => void
  onLayerMove: (sourceId: string, target: MoveTarget) => void
  onReorder: (activeId: string, overId: string) => void
  onAddOverlay: (type: OverlayComponent['type']) => void
  onDeleteOverlay: (id: string) => void
}

type MoveState = { mode: 'idle' } | { mode: 'selecting'; sourceId: string }

export function ComponentTree(props: Props) {
  const { slide, selectedComponentId, onSelectComponent, onAddComponent, onDeleteComponent, onMoveUpDown, onLayerMove, onReorder, onAddOverlay, onDeleteOverlay } = props
  const [pickerAt, setPickerAt] = useState<number | undefined>(undefined)
  const [moveState, setMoveState] = useState<MoveState>({ mode: 'idle' })
  const [draggingId, setDraggingId] = useState<string | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const handlePickType = (index: number, type: SlideComponent['type']) => {
    onAddComponent(index, type); setPickerAt(undefined)
  }
  const handleStartLayerMove = (id: string) => {
    setMoveState({ mode: 'selecting', sourceId: id }); setPickerAt(undefined)
  }
  const handleLayerMoveTo = (target: MoveTarget) => {
    if (moveState.mode !== 'selecting') return
    onLayerMove(moveState.sourceId, target); setMoveState({ mode: 'idle' })
  }
  const handleDragStart = (e: DragStartEvent) => {
    setDraggingId(e.active.id as string)
    setPickerAt(undefined)
  }
  const handleDragEnd = (e: DragEndEvent) => {
    setDraggingId(null)
    if (e.over && e.active.id !== e.over.id) {
      onReorder(e.active.id as string, e.over.id as string)
    }
  }

  const children = slide?.layout === 'content' ? slide.children : []
  const isContentSlide = slide?.layout === 'content'
  const draggingComp = draggingId ? children.find(c => c.id === draggingId) ?? null : null

  const sharedNodeProps = {
    selectedId: selectedComponentId,
    pickerAt,
    moveState,
    onSelect: onSelectComponent,
    onRequestPicker: setPickerAt,
    onClosePicker: () => setPickerAt(undefined),
    onPickType: handlePickType,
    onDelete: onDeleteComponent,
    onMoveUpDown,
    onStartLayerMove: handleStartLayerMove,
    onLayerMoveTo: handleLayerMoveTo,
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-700 shrink-0">
        Components {isContentSlide && <span className="ml-1 font-normal text-gray-600">— {children.length}</span>}
      </div>

      {moveState.mode === 'selecting' && (
        <div className="px-3 py-2 bg-amber-900/40 border-b border-amber-700/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-amber-300 text-[10px]">移動先を選択</span>
            <button className="text-white bg-gray-700 rounded px-1.5 py-0.5 text-[9px]" onClick={() => handleLayerMoveTo({ kind: 'slide' })}>→ Top Level</button>
          </div>
          <button className="text-gray-400 hover:text-white text-[10px]" onClick={() => setMoveState({ mode: 'idle' })}>キャンセル</button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto thin-scroll py-1">
        {!slide && <div className="px-3 py-2 text-xs text-gray-600">スライドを選択してください</div>}
        {slide && !isContentSlide && <div className="px-3 py-2 text-xs text-gray-600">このレイアウトにはコンポーネントがありません</div>}
        {isContentSlide && (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <SortableContext items={children.map(c => c.id)} strategy={verticalListSortingStrategy}>
              {pickerAt === 0 && <TypePicker onSelect={(t) => handlePickType(0, t)} onClose={() => setPickerAt(undefined)} />}
              {children.length === 0 && pickerAt !== 0 && <div className="px-3 py-2 text-xs text-gray-600">コンポーネントがありません</div>}
              {children.map((comp, i) => (
                <CompNode key={comp.id} comp={comp} index={i} listIndex={i} listLength={children.length} {...sharedNodeProps} depth={0} isTopLevel={true} />
              ))}
              {pickerAt === children.length && children.length > 0 && <TypePicker onSelect={(t) => handlePickType(children.length, t)} onClose={() => setPickerAt(undefined)} />}
              {moveState.mode === 'idle' && <button className="w-full mt-1 py-1.5 text-xs text-gray-600 hover:text-blue-400 hover:bg-gray-700/50 transition-colors flex items-center justify-center gap-1" onClick={() => setPickerAt(children.length)}><span>+</span><span>コンポーネントを追加</span></button>}
            </SortableContext>
            <DragOverlay>
              {draggingComp && (
                <div className="opacity-80 bg-gray-700 rounded px-2 py-1 text-xs text-white shadow-xl border border-blue-500">
                  {draggingComp.type}
                </div>
              )}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {isContentSlide && (
        <div className="border-t border-gray-700 shrink-0">
          <div className="px-3 py-1.5 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Overlays {(slide.overlays?.length ?? 0) > 0 && <span className="ml-1 font-normal text-gray-600">— {slide.overlays!.length}</span>}</span>
            <button className="text-gray-500 hover:text-blue-400 text-[10px]" title="テキストボックスを追加" onClick={() => onAddOverlay('abs-textbox')}>+ ABS</button>
          </div>
          {(slide.overlays ?? []).map(overlay => (
            <OverlayNode key={overlay.id} overlay={overlay} isSelected={selectedComponentId === overlay.id} onSelect={onSelectComponent} onDelete={onDeleteOverlay} />
          ))}
        </div>
      )}
    </div>
  )
}
