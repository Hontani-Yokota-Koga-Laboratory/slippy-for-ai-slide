import { useCallback } from 'react'
import type { Slide, SlideComponent, OverlayComponent } from '../types'
import { PropsField } from './PropsField'
import { SLIDE_SCHEMAS, COMPONENT_SCHEMAS, OVERLAY_SCHEMAS } from './propsSchemas'

interface Props {
  slide: Slide | null
  componentId: string | null
  onChange: (componentId: string | null, newProps: Record<string, unknown>) => void
}

function findOverlay(slide: Slide, id: string): OverlayComponent | null {
  if (slide.layout !== 'content') return null
  return slide.overlays?.find(o => o.id === id) ?? null
}

function findInList(components: SlideComponent[], id: string): SlideComponent | null {
  for (const comp of components) {
    if (comp.id === id) return comp
    if (comp.type === 'cols') {
      for (const col of comp.columns) {
        const found = findInList(col, id)
        if (found) return found
      }
    }
    if (comp.type === 'vcenter') {
      const found = findInList(comp.children, id)
      if (found) return found
    }
  }
  return null
}

function findComponent(slide: Slide, id: string): SlideComponent | null {
  if (slide.layout !== 'content') return null
  return findInList(slide.children, id)
}

function flattenProps(comp: SlideComponent): Record<string, unknown> {
  const base: Record<string, unknown> = {}
  if ('props' in comp && comp.props) Object.assign(base, comp.props)
  if ('children' in comp && typeof comp.children === 'string') base.children = comp.children
  if ('items' in comp) base.items = (comp as { items: string[] }).items
  return base
}

export function PropsPanel({ slide, componentId, onChange }: Props) {
  const handleChange = useCallback((key: string, val: unknown) => {
    let processedVal = val
    if (key === 'items' && typeof val === 'string') {
      processedVal = val.split('\n').map(s => s.trim()).filter(Boolean)
    } else if (key === 'headers' && typeof val === 'string') {
      processedVal = val.split(',').map(s => s.trim()).filter(Boolean)
    } else if (key === 'rows' && typeof val === 'string') {
      processedVal = val.split('\n').filter(Boolean).map(row => row.split('|').map(s => s.trim()))
    }
    onChange(componentId, { [key]: processedVal })
  }, [componentId, onChange])

  if (!slide) return <div className="p-4 text-gray-500 text-sm">スライドを選択してください</div>

  if (componentId) {
    const overlay = findOverlay(slide, componentId)
    if (overlay) {
      const schema = OVERLAY_SCHEMAS[overlay.type] ?? []
      return (
        <div className="p-4">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">{overlay.type}</div>
          {schema.map(f => <PropsField key={f.key} field={f} value={(overlay.props as Record<string, unknown>)[f.key]} onChange={handleChange} />)}
        </div>
      )
    }

    const comp = findComponent(slide, componentId)
    if (!comp) return <div className="p-4 text-gray-500 text-sm">コンポーネントが見つかりません</div>

    const schema = COMPONENT_SCHEMAS[comp.type] ?? []
    const propsObj = flattenProps(comp)

    if (comp.type === 'ul' && Array.isArray(propsObj.items)) propsObj.items = propsObj.items.join('\n')
    if (comp.type === 'table') {
      if (Array.isArray(propsObj.headers)) propsObj.headers = propsObj.headers.join(', ')
      if (Array.isArray(propsObj.rows)) propsObj.rows = propsObj.rows.map(r => r.join(' | ')).join('\n')
    }

    return (
      <div className="p-4">
        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">{comp.type}</div>
        {schema.length === 0
          ? <p className="text-xs text-gray-500">編集可能なプロパティはありません</p>
          : schema.map(f => <PropsField key={f.key} field={f} value={propsObj[f.key]} onChange={handleChange} />)
        }
      </div>
    )
  }

  const schema = SLIDE_SCHEMAS[slide.layout] ?? []
  const propsObj = 'props' in slide ? (slide.props as Record<string, unknown>) : {}

  return (
    <div className="p-4">
      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">{slide.layout}</div>
      {schema.map(f => <PropsField key={f.key} field={f} value={propsObj[f.key]} onChange={handleChange} />)}
    </div>
  )
}
