import { useState, useEffect, useCallback, useRef } from 'react'
import type { Slide, TocEntry, SlideComponent, MoveTarget, AbsTextBox, OverlayComponent } from './types'
import type { SectionInfo } from './utils/sections'
import { computeSectionNumbers, computeTocEntries } from './utils/sections'
import { SlideList } from './editor/SlideList'
import { ComponentTree } from './editor/ComponentTree'
import { SplitPane } from './editor/SplitPane'
import { SlidePreview } from './editor/SlidePreview'
import { PropsPanel } from './editor/PropsPanel'
import { PrintView } from './editor/PrintView'

// ── Slide mutation helpers ─────────────────────────────────────────────────

function updateSlideProps(slides: Slide[], slideId: string, newProps: Record<string, unknown>): Slide[] {
  return slides.map(slide => {
    if (slide.id !== slideId) return slide
    return { ...slide, props: { ...(slide as { props: Record<string, unknown> }).props, ...newProps } } as Slide
  })
}

function updateComponentInSlide(components: SlideComponent[], targetId: string, newProps: Record<string, unknown>): SlideComponent[] {
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

function deleteComponentFromList(components: SlideComponent[], id: string): SlideComponent[] {
  return components
    .filter(c => c.id !== id)
    .map(c => {
      if (c.type === 'cols') return { ...c, columns: c.columns.map(col => deleteComponentFromList(col, id)) }
      if (c.type === 'vcenter') return { ...c, children: deleteComponentFromList(c.children, id) }
      return c
    })
}

function updateSlideComponent(slides: Slide[], slideId: string, componentId: string, newProps: Record<string, unknown>): Slide[] {
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

function moveInList(list: SlideComponent[], id: string, dir: 'up' | 'down'): SlideComponent[] | null {
  const i = list.findIndex(c => c.id === id)
  if (i === -1) return null
  const j = dir === 'up' ? i - 1 : i + 1
  if (j < 0 || j >= list.length) return list
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]]
  return next
}

function moveUpDownInComponents(components: SlideComponent[], id: string, dir: 'up' | 'down'): SlideComponent[] {
  const moved = moveInList(components, id, dir)
  if (moved !== null) return moved
  return components.map(c => {
    if (c.type === 'vcenter') return { ...c, children: moveUpDownInComponents(c.children, id, dir) }
    if (c.type === 'cols') return { ...c, columns: c.columns.map(col => moveUpDownInComponents(col, id, dir)) }
    return c
  })
}

function extractComponent(components: SlideComponent[], id: string): [SlideComponent[], SlideComponent | null] {
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

function insertAtTarget(components: SlideComponent[], target: MoveTarget, comp: SlideComponent): SlideComponent[] {
  if (target.kind === 'slide') return [...components, comp]
  return components.map(c => {
    if (target.kind === 'vcenter' && c.id === target.id && c.type === 'vcenter')
      return { ...c, children: [...c.children, comp] }
    if (target.kind === 'cols' && c.id === target.id && c.type === 'cols')
      return { ...c, columns: c.columns.map((col, i) => i === target.colIndex ? [...col, comp] : col) }
    return c
  })
}

// ── Default component factory ──────────────────────────────────────────────

function newId() {
  return `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

function createDefaultComponent(type: SlideComponent['type']): SlideComponent {
  const id = newId()
  switch (type) {
    case 'box':     return { type, id, props: { variant: 'blue', label: '新しいボックス' }, children: 'ここに内容を書く' }
    case 'text':    return { type, id, children: 'テキストをここに' }
    case 'h3':      return { type, id, children: '見出し' }
    case 'ul':      return { type, id, items: ['項目1', '項目2'] }
    case 'cols':    return { type, id, props: { left: 1, right: 1 }, columns: [[], []] }
    case 'vcenter': return { type, id, children: [{ type: 'text', id: newId(), children: 'テキストをここに' }] }
    case 'figure':  return { type, id, props: { chartId: '', caption: '' } }
    case 'table':   return { type, id, props: { headers: ['列1', '列2'], rows: [['', '']] } }
    case 'divider': return { type, id }
  }
}

// ── URL helpers ────────────────────────────────────────────────────────────

function getUrlParams() {
  const p = new URLSearchParams(location.search)
  return {
    project: p.get('project') ?? 'example',
    slide:   p.get('slide') ?? null,
    print:   p.get('print') === '1',
  }
}

function pushUrlState(project: string, slideId: string | null) {
  const p = new URLSearchParams(location.search)
  p.set('project', project)
  if (slideId) p.set('slide', slideId)
  else p.delete('slide')
  history.replaceState(null, '', `?${p.toString()}`)
}

// ── App ────────────────────────────────────────────────────────────────────

type MobileTab = 'slides' | 'tree' | 'props'

export default function App() {
  const { project: initialProject, slide: initialSlide, print: isPrint } = getUrlParams()

  const [project, setProject] = useState(initialProject)
  const [projects, setProjects] = useState<string[]>([])
  const [slides, setSlides] = useState<Slide[]>([])
  const [sectionNumbers, setSectionNumbers] = useState<Map<string, SectionInfo>>(new Map())
  const [tocEntries, setTocEntries] = useState<TocEntry[]>([])
  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(initialSlide)
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [generatingPdf, setGeneratingPdf] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle')
  const [leftWidth, setLeftWidth] = useState(224)
  const [rightWidth, setRightWidth] = useState(288)
  const [mobileTab, setMobileTab] = useState<MobileTab>('slides')
  const draggingLeft = useRef(false)
  const draggingRight = useRef(false)

  // Track saved state for unsaved-changes detection
  const savedSlidesRef = useRef<string>('')
  const hasUnsavedChanges = savedSlidesRef.current !== '' && savedSlidesRef.current !== JSON.stringify(slides)

  // Warn on page unload when there are unsaved changes
  useEffect(() => {
    if (!hasUnsavedChanges) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [hasUnsavedChanges])

  useEffect(() => {
    fetch('/api/projects').then(r => r.json()).then(setProjects)
  }, [])

  useEffect(() => {
    fetch(`/api/projects/${project}/slides`)
      .then(r => r.json())
      .then((data: Slide[]) => {
        setSlides(data)
        setSectionNumbers(computeSectionNumbers(data))
        setTocEntries(computeTocEntries(data))
        savedSlidesRef.current = JSON.stringify(data)

        // Restore last selected slide from URL, or fall back to first slide
        setSelectedSlideId(prev => {
          const target = prev ?? initialSlide
          return data.find(s => s.id === target) ? (target ?? data[0]?.id ?? null) : (data[0]?.id ?? null)
        })
        setSelectedComponentId(null)
      })
  }, [project]) // eslint-disable-line react-hooks/exhaustive-deps

  // Keep section numbers / TOC in sync
  useEffect(() => {
    setSectionNumbers(computeSectionNumbers(slides))
    setTocEntries(computeTocEntries(slides))
  }, [slides])

  // Persist selected slide in URL
  useEffect(() => {
    pushUrlState(project, selectedSlideId)
  }, [project, selectedSlideId])

  const selectedSlideIndex = slides.findIndex(s => s.id === selectedSlideId)
  const selectedSlide = selectedSlideIndex >= 0 ? slides[selectedSlideIndex] : null

  const handleSelectSlide = useCallback((id: string) => {
    setSelectedSlideId(id)
    setSelectedComponentId(null)
  }, [])

  const handleSelectComponent = useCallback((slideId: string, compId: string) => {
    setSelectedSlideId(slideId)
    setSelectedComponentId(compId)
    setMobileTab('props')
  }, [])

  const handleNavigate = useCallback((delta: number) => {
    const idx = slides.findIndex(s => s.id === selectedSlideId)
    const next = slides[idx + delta]
    if (next) { setSelectedSlideId(next.id); setSelectedComponentId(null) }
  }, [slides, selectedSlideId])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't navigate if user is typing in an input or textarea
      const active = document.activeElement
      if (active?.tagName === 'INPUT' || active?.tagName === 'TEXTAREA') return

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        handleNavigate(1)
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        handleNavigate(-1)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleNavigate])

  const startLeftDrag = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    draggingLeft.current = true
    const startX = e.clientX
    const startW = leftWidth

    const onMove = (ev: MouseEvent) => {
      if (!draggingLeft.current) return
      const delta = ev.clientX - startX
      setLeftWidth(Math.max(150, Math.min(500, startW + delta)))
    }
    const onUp = () => {
      draggingLeft.current = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [leftWidth])

  const startRightDrag = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    draggingRight.current = true
    const startX = e.clientX
    const startW = rightWidth

    const onMove = (ev: MouseEvent) => {
      if (!draggingRight.current) return
      const delta = startX - ev.clientX
      setRightWidth(Math.max(200, Math.min(600, startW + delta)))
    }
    const onUp = () => {
      draggingRight.current = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [rightWidth])

  const handleAddComponent = useCallback((index: number, type: SlideComponent['type']) => {
    if (!selectedSlideId) return
    const newComp = createDefaultComponent(type)
    setSlides(prev => prev.map(slide => {
      if (slide.id !== selectedSlideId || slide.layout !== 'content') return slide
      const children = [...slide.children]
      children.splice(index, 0, newComp)
      return { ...slide, children }
    }))
    setSelectedComponentId(newComp.id)
  }, [selectedSlideId])

  const handleDeleteComponent = useCallback((id: string) => {
    if (!selectedSlideId) return
    setSlides(prev => prev.map(slide => {
      if (slide.id !== selectedSlideId || slide.layout !== 'content') return slide
      return { ...slide, children: deleteComponentFromList(slide.children, id) }
    }))
    if (selectedComponentId === id) setSelectedComponentId(null)
  }, [selectedSlideId, selectedComponentId])

  const handleMoveUpDown = useCallback((id: string, dir: 'up' | 'down') => {
    if (!selectedSlideId) return
    setSlides(prev => prev.map(slide => {
      if (slide.id !== selectedSlideId || slide.layout !== 'content') return slide
      return { ...slide, children: moveUpDownInComponents(slide.children, id, dir) }
    }))
  }, [selectedSlideId])

  const handleLayerMove = useCallback((sourceId: string, target: MoveTarget) => {
    if (!selectedSlideId) return
    setSlides(prev => prev.map(slide => {
      if (slide.id !== selectedSlideId || slide.layout !== 'content') return slide
      const [without, extracted] = extractComponent(slide.children, sourceId)
      if (!extracted) return slide
      return { ...slide, children: insertAtTarget(without, target, extracted) }
    }))
  }, [selectedSlideId])

  const handleAddOverlay = useCallback((type: OverlayComponent['type']) => {
    if (!selectedSlideId) return
    const overlay: AbsTextBox = {
      type: 'abs-textbox',
      id: newId(),
      props: { x: 200, y: 200, width: 320, height: 100, content: 'テキスト' },
    }
    setSlides(prev => prev.map(slide => {
      if (slide.id !== selectedSlideId || slide.layout !== 'content') return slide
      return { ...slide, overlays: [...(slide.overlays ?? []), overlay] }
    }))
    setSelectedComponentId(overlay.id)
  }, [selectedSlideId])

  const handleDeleteOverlay = useCallback((id: string) => {
    if (!selectedSlideId) return
    setSlides(prev => prev.map(slide => {
      if (slide.id !== selectedSlideId || slide.layout !== 'content') return slide
      return { ...slide, overlays: (slide.overlays ?? []).filter(o => o.id !== id) }
    }))
    if (selectedComponentId === id) setSelectedComponentId(null)
  }, [selectedSlideId, selectedComponentId])

  const handleMoveOverlay = useCallback((id: string, x: number, y: number) => {
    if (!selectedSlideId) return
    setSlides(prev => prev.map(slide => {
      if (slide.id !== selectedSlideId || slide.layout !== 'content') return slide
      return {
        ...slide,
        overlays: (slide.overlays ?? []).map(o =>
          o.id === id ? { ...o, props: { ...o.props, x, y } } : o
        ),
      }
    }))
  }, [selectedSlideId])

  const handlePropsChange = useCallback((componentId: string | null, newProps: Record<string, unknown>) => {
    if (!selectedSlideId) return
    setSlides(prev =>
      componentId
        ? updateSlideComponent(prev, selectedSlideId, componentId, newProps)
        : updateSlideProps(prev, selectedSlideId, newProps)
    )
  }, [selectedSlideId])

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/projects/${project}/slides`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slides, null, 2),
      })
      if (res.ok) {
        savedSlidesRef.current = JSON.stringify(slides)
        setSaveStatus('saved')
      } else {
        setSaveStatus('error')
      }
    } catch {
      setSaveStatus('error')
    } finally {
      setSaving(false)
      setTimeout(() => setSaveStatus('idle'), 2000)
    }
  }

  const generatePdf = async () => {
    setGeneratingPdf(true)
    try {
      const res = await fetch(`/api/projects/${project}/pdf`, { method: 'POST' })
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${project}.pdf`
        a.click()
        URL.revokeObjectURL(url)
      }
    } finally {
      setGeneratingPdf(false)
    }
  }

  if (isPrint) {
    return <PrintView project={initialProject} />
  }

  const slideListPanel = (
    <SlideList
      slides={slides}
      sectionNumbers={sectionNumbers}
      selectedSlideId={selectedSlideId}
      onSelectSlide={handleSelectSlide}
    />
  )

  const componentTreePanel = (
    <ComponentTree
      slide={selectedSlide}
      selectedComponentId={selectedComponentId}
      onSelectComponent={(id) => selectedSlideId && handleSelectComponent(selectedSlideId, id)}
      onAddComponent={handleAddComponent}
      onDeleteComponent={handleDeleteComponent}
      onMoveUpDown={handleMoveUpDown}
      onLayerMove={handleLayerMove}
      onAddOverlay={handleAddOverlay}
      onDeleteOverlay={handleDeleteOverlay}
    />
  )

  const previewPanel = (
    <SlidePreview
      slide={selectedSlide}
      slides={slides}
      slideIndex={selectedSlideIndex >= 0 ? selectedSlideIndex : 0}
      sectionNumbers={sectionNumbers}
      tocEntries={tocEntries}
      selectedComponentId={selectedComponentId}
      onSelectComponent={(id) => selectedSlideId && handleSelectComponent(selectedSlideId, id)}
      onMoveOverlay={handleMoveOverlay}
      onNavigate={handleNavigate}
    />
  )

  const propsPanel = (
    <PropsPanel
      slide={selectedSlide}
      componentId={selectedComponentId}
      onChange={handlePropsChange}
    />
  )

  const MOBILE_TABS: { id: MobileTab; label: string; icon: string }[] = [
    { id: 'slides', label: 'スライド', icon: '≡' },
    { id: 'tree',   label: 'ツリー',   icon: '⊞' },
    { id: 'props',  label: '設定',     icon: '⚙' },
  ]

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      {/* Header */}
      <header className="flex items-center gap-2 px-3 md:px-4 py-2 bg-gray-800 border-b border-gray-700 shrink-0">
        <span className="font-bold text-sm text-gray-200">AI Slide</span>
        <div className="w-px h-4 bg-gray-600 hidden sm:block" />
        <select
          value={project}
          onChange={e => { location.href = `?project=${e.target.value}` }}
          className="bg-gray-700 text-white text-sm px-2 py-1 rounded border border-gray-600 max-w-[8rem] sm:max-w-none"
        >
          {projects.map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        {hasUnsavedChanges && (
          <span className="text-xs text-amber-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
            <span className="hidden sm:inline">未保存</span>
          </span>
        )}

        <div className="flex-1" />
        {saveStatus === 'saved' && <span className="text-xs text-green-400 hidden sm:inline">保存しました</span>}
        {saveStatus === 'error' && <span className="text-xs text-red-400 hidden sm:inline">保存に失敗しました</span>}
        <button
          onClick={save}
          disabled={saving}
          className="text-sm px-2 sm:px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded disabled:opacity-50 transition-colors"
        >
          {saving ? '…' : '保存'}
        </button>
        <button
          onClick={generatePdf}
          disabled={generatingPdf}
          className="hidden sm:block text-sm px-3 py-1 bg-violet-600 hover:bg-violet-500 rounded disabled:opacity-50 transition-colors"
        >
          {generatingPdf ? 'PDF生成中…' : 'PDF出力'}
        </button>
      </header>

      {/* Desktop: 3-column layout */}
      <div className="hidden lg:flex flex-1 overflow-hidden">
        <aside
          className="shrink-0 bg-gray-800 border-r border-gray-700"
          style={{ width: leftWidth }}
        >
          <SplitPane
            defaultTopPercent={55}
            top={slideListPanel}
            bottom={componentTreePanel}
          />
        </aside>

        <div
          className="w-1.5 shrink-0 bg-gray-700 hover:bg-blue-600 cursor-col-resize transition-colors"
          onMouseDown={startLeftDrag}
        />

        <main className="flex-1 overflow-hidden">
          {previewPanel}
        </main>

        <div
          className="w-1.5 shrink-0 bg-gray-700 hover:bg-blue-600 cursor-col-resize transition-colors"
          onMouseDown={startRightDrag}
        />

        <aside
          className="shrink-0 bg-gray-800 border-l border-gray-700 overflow-y-auto thin-scroll"
          style={{ width: rightWidth }}
        >
          {propsPanel}
        </aside>
      </div>

      {/* Mobile: preview top half + tabbed panel bottom half */}
      <div className="flex lg:hidden flex-1 flex-col overflow-hidden min-h-0">
        {/* Top: preview (always visible) */}
        <div className="flex-1 overflow-hidden min-h-0 border-b border-gray-700">
          {previewPanel}
        </div>

        {/* Bottom tab bar */}
        <nav className="flex shrink-0 border-b border-gray-700 bg-gray-800">
          {MOBILE_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setMobileTab(tab.id)}
              className={`flex-1 py-2 text-xs flex flex-col items-center gap-0.5 transition-colors
                ${mobileTab === tab.id ? 'text-blue-400 bg-gray-700/50' : 'text-gray-500 active:text-gray-300'}`}
            >
              <span className="text-base leading-none">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Bottom: active panel */}
        <div className="flex-1 overflow-hidden min-h-0 bg-gray-800">
          {mobileTab === 'slides' && slideListPanel}
          {mobileTab === 'tree'   && componentTreePanel}
          {mobileTab === 'props'  && (
            <div className="h-full overflow-y-auto thin-scroll">{propsPanel}</div>
          )}
        </div>
      </div>
    </div>
  )
}
