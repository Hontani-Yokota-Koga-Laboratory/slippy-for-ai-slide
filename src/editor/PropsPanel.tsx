import { useCallback } from 'react'
import type { Slide, SlideComponent, PropField, OverlayComponent } from '../types'

interface Props {
  slide: Slide | null
  componentId: string | null
  onChange: (componentId: string | null, newProps: Record<string, unknown>) => void
}

// ── Schemas ────────────────────────────────────────────────────────────────

const SLIDE_SCHEMAS: Record<string, PropField[]> = {
  title: [
    { key: 'tag',     label: 'タグ',   type: 'text',   placeholder: 'ゼミ | 3班' },
    { key: 'heading', label: '見出し', type: 'text' },
    { key: 'author',  label: '著者',   type: 'text' },
    { key: 'date',    label: '日付',   type: 'text',   placeholder: 'auto または YYYY-MM-DD' },
  ],
  toc:          [{ key: 'heading', label: '見出し',   type: 'text', placeholder: '目次' }],
  section:      [{ key: 'title',   label: 'タイトル', type: 'text' }],
  subsection:   [{ key: 'title',   label: 'タイトル', type: 'text' }],
  subsubsection:[{ key: 'title',   label: 'タイトル', type: 'text' }],
  content:      [{ key: 'heading', label: '見出し',   type: 'text' }],
  statement:    [{ key: 'children',label: 'テキスト', type: 'textarea' }],
}

const COMPONENT_SCHEMAS: Record<string, PropField[]> = {
  box: [
    { key: 'variant',       label: 'タイプ',           type: 'select',
      options: ['blue', 'violet', 'cyan', 'green', 'amber', 'red'] },
    { key: 'label',         label: 'ラベル',           type: 'text' },
    { key: 'children',      label: '内容',             type: 'textarea' },
    { key: 'labelFontSize', label: 'ラベルサイズ (em)', type: 'number', min: 0.5, max: 2, step: 0.05, placeholder: '0.9' },
    { key: 'bodyFontSize',  label: '本文サイズ (em)',  type: 'number', min: 0.5, max: 2, step: 0.05, placeholder: '0.9' },
    { key: 'width',         label: '幅 (px)',          type: 'number', min: 100, step: 10 },
  ],
  cols: [
    { key: 'left',  label: '左の比率', type: 'number', min: 1, max: 9, step: 1 },
    { key: 'right', label: '右の比率', type: 'number', min: 1, max: 9, step: 1 },
    { key: 'gap',   label: 'Gap (px)', type: 'number', min: 0, step: 4, placeholder: '24' },
  ],
  figure: [
    { key: 'caption', label: 'キャプション', type: 'text' },
    { key: 'chartId', label: 'チャートID',   type: 'text' },
    { key: 'width',   label: '幅 (px)',       type: 'number', min: 100, step: 10, placeholder: '520' },
    { key: 'height',  label: '高さ (px)',     type: 'number', min: 50,  step: 10, placeholder: '240' },
  ],
  text: [
    { key: 'children', label: 'テキスト',   type: 'textarea' },
    { key: 'fontSize', label: 'フォントサイズ (em)', type: 'number', min: 0.5, max: 2, step: 0.05 },
  ],
  h3: [
    { key: 'children', label: '見出し',     type: 'text' },
    { key: 'fontSize', label: 'フォントサイズ (em)', type: 'number', min: 0.5, max: 2, step: 0.05 },
  ],
  ul: [
    { key: 'items',    label: '項目 (1行1項目)', type: 'textarea' },
    { key: 'fontSize', label: 'フォントサイズ (em)', type: 'number', min: 0.5, max: 2, step: 0.05 },
  ],
  table: [
    { key: 'headers',  label: 'ヘッダー (カンマ区切り)', type: 'text' },
    { key: 'rows',     label: 'データ (1行1行、セルは | 区切り)', type: 'textarea' },
    { key: 'fontSize', label: 'フォントサイズ (em)', type: 'number', min: 0.5, max: 2, step: 0.05 },
  ],
  divider: [],
  vcenter: [],
}

const OVERLAY_SCHEMAS: Record<string, PropField[]> = {
  'abs-textbox': [
    { key: 'content',  label: '内容',             type: 'textarea' },
    { key: 'x',        label: 'X (px)',           type: 'number', min: 0, max: 1280, step: 1 },
    { key: 'y',        label: 'Y (px)',           type: 'number', min: 0, max: 720,  step: 1 },
    { key: 'width',    label: '幅 (px)',           type: 'number', min: 50, step: 10 },
    { key: 'height',   label: '高さ (px)',         type: 'number', min: 30, step: 10 },
    { key: 'fontSize', label: 'フォントサイズ (em)', type: 'number', min: 0.5, max: 3, step: 0.05 },
    { key: 'borderColor', label: '枠の色',         type: 'text', placeholder: '#94a3b8' },
    { key: 'fitToInner', label: '内枠に収める',     type: 'boolean' },
  ],
}

// ── Field ──────────────────────────────────────────────────────────────────

const inputCls = 'w-full bg-gray-700 text-gray-100 text-xs rounded px-2 py-1.5 border border-gray-600 focus:outline-none focus:border-blue-400'

function Field({ field, value, onChange }: {
  field: PropField
  value: unknown
  onChange: (key: string, val: unknown) => void
}) {
  const strVal = value === undefined || value === null ? '' : String(value)

  return (
    <div className="mb-3">
      <label className="block text-xs text-gray-400 mb-1">{field.label}</label>
      {field.type === 'select' ? (
        <select value={strVal} onChange={e => onChange(field.key, e.target.value)} className={inputCls}>
          {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      ) : field.type === 'boolean' ? (
        <label className="flex items-center gap-2 cursor-pointer py-1">
          <input
            type="checkbox"
            checked={!!value}
            onChange={e => onChange(field.key, e.target.checked)}
            className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-400 focus:ring-offset-gray-800"
          />
          <span className="text-xs text-gray-200">{value ? 'ON' : 'OFF'}</span>
        </label>
      ) : field.type === 'textarea' ? (
        <textarea
          value={strVal}
          onChange={e => onChange(field.key, e.target.value)}
          rows={4}
          placeholder={field.placeholder}
          className={`${inputCls} resize-y font-mono`}
        />
      ) : field.type === 'number' ? (
        <input
          type="number"
          value={strVal}
          onChange={e => {
            const v = e.target.value
            onChange(field.key, v === '' ? undefined : Number(v))
          }}
          min={field.min}
          max={field.max}
          step={field.step ?? 1}
          placeholder={field.placeholder}
          className={inputCls}
        />
      ) : (
        <input
          type="text"
          value={strVal}
          onChange={e => onChange(field.key, e.target.value)}
          placeholder={field.placeholder}
          className={inputCls}
        />
      )}
    </div>
  )
}

// ── Find component ─────────────────────────────────────────────────────────

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

// ── Flatten component props for editing ───────────────────────────────────

function flattenProps(comp: SlideComponent): Record<string, unknown> {
  const base: Record<string, unknown> = {}
  if ('props' in comp && comp.props) Object.assign(base, comp.props)
  if ('children' in comp && typeof comp.children === 'string') base.children = comp.children
  if ('items' in comp) base.items = (comp as { items: string[] }).items
  return base
}

// ── Panel ──────────────────────────────────────────────────────────────────

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

  if (!slide) {
    return <div className="p-4 text-gray-500 text-sm">スライドを選択してください</div>
  }

  if (componentId) {
    // Check overlays first
    const overlay = findOverlay(slide, componentId)
    if (overlay) {
      const schema = OVERLAY_SCHEMAS[overlay.type] ?? []
      const propsObj = overlay.props as Record<string, unknown>
      return (
        <div className="p-4">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">{overlay.type}</div>
          {schema.map(f => <Field key={f.key} field={f} value={propsObj[f.key]} onChange={handleChange} />)}
        </div>
      )
    }

    const comp = findComponent(slide, componentId)
    if (!comp) return <div className="p-4 text-gray-500 text-sm">コンポーネントが見つかりません</div>

    const schema = COMPONENT_SCHEMAS[comp.type] ?? []
    const propsObj = flattenProps(comp)

    // Convert arrays to editable strings for the UI
    if (comp.type === 'ul' && Array.isArray(propsObj.items)) {
      propsObj.items = propsObj.items.join('\n')
    }
    if (comp.type === 'table') {
      if (Array.isArray(propsObj.headers)) {
        propsObj.headers = propsObj.headers.join(', ')
      }
      if (Array.isArray(propsObj.rows)) {
        propsObj.rows = propsObj.rows.map(r => r.join(' | ')).join('\n')
      }
    }

    return (
      <div className="p-4">
        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">{comp.type}</div>
        {schema.length === 0
          ? <p className="text-xs text-gray-500">編集可能なプロパティはありません</p>
          : schema.map(f => <Field key={f.key} field={f} value={propsObj[f.key]} onChange={handleChange} />)
        }
      </div>
    )
  }

  const schema = SLIDE_SCHEMAS[slide.layout] ?? []
  const propsObj = 'props' in slide ? (slide.props as Record<string, unknown>) : {}

  return (
    <div className="p-4">
      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">{slide.layout}</div>
      {schema.map(f => <Field key={f.key} field={f} value={propsObj[f.key]} onChange={handleChange} />)}
    </div>
  )
}
