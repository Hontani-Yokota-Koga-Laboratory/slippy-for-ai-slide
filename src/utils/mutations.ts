import type { Slide, SlideComponent, MoveTarget, OverlayComponent, AbsTextBox } from '../types'

// ── Slide mutation helpers ─────────────────────────────────────────────────

export function updateSlideProps(slides: Slide[], slideId: string, newProps: Record<string, unknown>): Slide[] {
  return slides.map(slide => {
    if (slide.id !== slideId) return slide
    return { ...slide, props: { ...(slide as { props: Record<string, unknown> }).props, ...newProps } } as Slide
  })
}

export function updateComponentInSlide(components: SlideComponent[], targetId: string, newProps: Record<string, unknown>): SlideComponent[] {
  return components.map(comp => {
    if (comp.id === targetId) {
      const { children, items, ...rest } = newProps as Record<string, unknown>
      const updatedComp = { ...comp }
      if (children !== undefined && 'children' in comp) (updatedComp as { children: unknown }).children = children
      if (items !== undefined && 'items' in comp) (updatedComp as { items: unknown }).items = items
      if (Object.keys(rest).length > 0) {
        (updatedComp as { props: Record<string, unknown> }).props = {
          ...(comp as { props?: Record<string, unknown> }).props,
          ...rest,
        }
      }
      return updatedComp
    }
    if (comp.type === 'cols') {
      return { ...comp, columns: comp.columns.map(col => updateComponentInSlide(col, targetId, newProps)) }
    }
    if (comp.type === 'vcenter') {
      return { ...comp, children: updateComponentInSlide(comp.children, targetId, newProps) }
    }
    return comp
  })
}

export function deleteComponentFromList(components: SlideComponent[], id: string): SlideComponent[] {
  return components
    .filter(c => c.id !== id)
    .map(c => {
      if (c.type === 'cols') return { ...c, columns: c.columns.map(col => deleteComponentFromList(col, id)) }
      if (c.type === 'vcenter') return { ...c, children: deleteComponentFromList(c.children, id) }
      return c
    })
}

export function updateSlideComponent(slides: Slide[], slideId: string, componentId: string, newProps: Record<string, unknown>): Slide[] {
  return slides.map(slide => {
    if (slide.id !== slideId || slide.layout !== 'content') return slide
    if (slide.overlays?.some(o => o.id === componentId)) {
      return {
        ...slide,
        overlays: slide.overlays.map(o =>
          o.id === componentId ? { ...o, props: { ...o.props, ...newProps } } : o
        ),
      }
    }
    return { ...slide, children: updateComponentInSlide(slide.children, componentId, newProps) }
  })
}

// ── Move helpers ──────────────────────────────────────────────────────────

export function moveInList(list: SlideComponent[], id: string, dir: 'up' | 'down'): SlideComponent[] | null {
  const i = list.findIndex(c => c.id === id)
  if (i === -1) return null
  const j = dir === 'up' ? i - 1 : i + 1
  if (j < 0 || j >= list.length) return list
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]]
  return next
}

export function moveUpDownInComponents(components: SlideComponent[], id: string, dir: 'up' | 'down'): SlideComponent[] {
  const moved = moveInList(components, id, dir)
  if (moved !== null) return moved
  return components.map(c => {
    if (c.type === 'vcenter') return { ...c, children: moveUpDownInComponents(c.children, id, dir) }
    if (c.type === 'cols') return { ...c, columns: c.columns.map(col => moveUpDownInComponents(col, id, dir)) }
    return c
  })
}

export function extractComponent(components: SlideComponent[], id: string): [SlideComponent[], SlideComponent | null] {
  const i = components.findIndex(c => c.id === id)
  if (i !== -1) return [components.filter((_, j) => j !== i), components[i]]
  let extracted: SlideComponent | null = null
  const updated = components.map(c => {
    if (extracted) return c
    if (c.type === 'vcenter') {
      const [next, ext] = extractComponent(c.children, id)
      if (ext) { extracted = ext; return { ...c, children: next } }
    }
    if (c.type === 'cols') {
      const newCols = c.columns.map(col => {
        if (extracted) return col
        const [next, ext] = extractComponent(col, id)
        if (ext) { extracted = ext; return next }
        return col
      })
      if (extracted) return { ...c, columns: newCols }
    }
    return c
  })
  return [updated, extracted]
}

export function insertAtTarget(components: SlideComponent[], target: MoveTarget, comp: SlideComponent): SlideComponent[] {
  if (target.kind === 'slide') return [...components, comp]
  return components.map(c => {
    if (target.kind === 'vcenter' && c.id === target.id && c.type === 'vcenter')
      return { ...c, children: [...c.children, comp] }
    if (target.kind === 'cols' && c.id === target.id && c.type === 'cols')
      return { ...c, columns: c.columns.map((col, i) => i === target.colIndex ? [...col, comp] : col) }
    return c
  })
}

export function reorderInTree(children: SlideComponent[], activeId: string, overId: string): SlideComponent[] {
  const from = children.findIndex(c => c.id === activeId)
  const to   = children.findIndex(c => c.id === overId)
  if (from !== -1 && to !== -1) {
    const result = [...children]
    const [item] = result.splice(from, 1)
    result.splice(to, 0, item)
    return result
  }
  return children.map(comp => {
    if (comp.type === 'vcenter') return { ...comp, children: reorderInTree(comp.children, activeId, overId) }
    if (comp.type === 'cols')    return { ...comp, columns: comp.columns.map(col => reorderInTree(col, activeId, overId)) }
    return comp
  })
}

// ── Default component factory ──────────────────────────────────────────────

export function newId() {
  return `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

export function createDefaultComponent(type: SlideComponent['type']): SlideComponent {
  const id = newId()
  switch (type) {
    case 'box':     return { type, id, props: { variant: 'blue', label: '新しいボックス' }, children: 'ここに内容を書く' }
    case 'text':    return { type, id, children: 'テキストをここに' }
    case 'h3':      return { type, id, children: '見出し' }
    case 'ul':      return { type, id, items: ['項目1', '項目2'] }
    case 'cols':    return { type, id, props: { left: 1, right: 1 }, columns: [[], []] }
    case 'vcenter': return { type, id, children: [{ type: 'text', id: newId(), children: 'テキストをここに' }] }
    case 'figure':  return { type, id, props: { chartId: '', caption: '' } }
    case 'image':   return { type, id, props: { src: '', caption: '' } }
    case 'table':   return { type, id, props: { headers: ['列1', '列2'], rows: [['', '']] } }
    case 'divider': return { type, id }
  }
}

export function createDefaultOverlay(): AbsTextBox {
  return {
    type: 'abs-textbox',
    id: newId(),
    props: { x: 200, y: 200, width: 320, height: 100, content: 'テキスト' },
  }
}
