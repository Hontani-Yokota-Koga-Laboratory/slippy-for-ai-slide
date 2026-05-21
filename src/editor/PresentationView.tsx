import { useRef, useState, useEffect, useCallback } from 'react'
import type { Slide, TocEntry } from '../types'
import type { SectionInfo } from '../utils/sections'
import { SlideRenderer } from '../components/SlideRenderer'
import { computeSectionNumbers, computeTocEntries } from '../utils/sections'
import { ProjectContext } from '../context/ProjectContext'

interface Props {
  project: string
  theme?: string
}

export function PresentationView({ project, theme }: Props) {
  const [slides, setSlides] = useState<Slide[]>([])
  const [sectionNumbers, setSectionNumbers] = useState<Map<string, SectionInfo>>(new Map())
  const [tocEntries, setTocEntries] = useState<TocEntry[]>([])
  const [lang, setLang] = useState('ja')
  const [scripts, setScripts] = useState<Record<string, string>>({})
  const initialSlideId = useRef(new URLSearchParams(location.search).get('slide'))
  const [currentIndex, setCurrentIndex] = useState(0)
  const [editingText, setEditingText] = useState('')
  const [saving, setSaving] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [scriptWidth, setScriptWidth] = useState(() => {
    const saved = localStorage.getItem('presentationScriptWidth')
    return saved ? Number(saved) : 320
  })
  const draggingRef = useRef(false)

  useEffect(() => {
    fetch(`/api/projects/${project}/config`)
      .then(r => r.json())
      .then(data => { if (data.lang) setLang(data.lang) })
  }, [project])

  useEffect(() => {
    Promise.all([
      fetch(`/api/projects/${project}/slides`).then(r => r.json()),
      fetch(`/api/projects/${project}/script`).then(r => r.json()),
    ]).then(([slideData, scriptData]: [Slide[], Record<string, string>]) => {
      setSlides(slideData)
      setSectionNumbers(computeSectionNumbers(slideData))
      setTocEntries(computeTocEntries(slideData))
      setScripts(scriptData)
      if (initialSlideId.current) {
        const idx = slideData.findIndex((s: Slide) => s.id === initialSlideId.current)
        if (idx >= 0) setCurrentIndex(idx)
      }
    })
  }, [project])

  const currentSlide = slides[currentIndex] ?? null

  useEffect(() => {
    if (!currentSlide) return
    const p = new URLSearchParams(location.search)
    p.set('slide', currentSlide.id)
    history.replaceState(null, '', `?${p.toString()}`)
  }, [currentSlide?.id])

  useEffect(() => {
    setEditingText(currentSlide ? (scripts[currentSlide.id] ?? '') : '')
  }, [currentIndex, currentSlide?.id, scripts])

  useEffect(() => {
    const update = () => {
      if (!containerRef.current) return
      const { width, height } = containerRef.current.getBoundingClientRect()
      const padding = 8
      const scaleX = (width - padding) / 1280
      const scaleY = (height - padding) / 720
      setScale(Math.min(scaleX, scaleY))
    }
    update()
    const ro = new ResizeObserver(update)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  const navigate = useCallback((delta: number) => {
    setCurrentIndex(i => Math.max(0, Math.min(slides.length - 1, i + delta)))
  }, [slides.length])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement) return
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault()
        navigate(1)
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        navigate(-1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate])

  const onResizerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    draggingRef.current = true
    const startX = e.clientX
    const startWidth = scriptWidth
    const onMove = (ev: MouseEvent) => {
      if (!draggingRef.current) return
      const delta = startX - ev.clientX
      const next = Math.max(160, Math.min(600, startWidth + delta))
      setScriptWidth(next)
      localStorage.setItem('presentationScriptWidth', String(next))
    }
    const onUp = () => {
      draggingRef.current = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [scriptWidth])

  const saveScript = async () => {
    if (!currentSlide) return
    setSaving(true)
    try {
      await fetch(`/api/projects/${project}/script/${currentSlide.id}`, {
        method: 'PUT',
        body: editingText,
      })
      setScripts(prev => ({ ...prev, [currentSlide.id]: editingText }))
    } finally {
      setSaving(false)
    }
  }

  if (slides.length === 0) {
    return <div className="h-screen flex items-center justify-center bg-gray-950 text-white">Loading...</div>
  }

  return (
    <ProjectContext.Provider value={project}>
      <link rel="stylesheet" href={`/api/projects/${project}/style.css`} />
      <div className={`h-screen flex bg-gray-950 text-white theme-${theme}`}>
        {/* Slide area */}
        <div ref={containerRef} className="flex-1 flex items-center justify-center overflow-hidden">
          {currentSlide && (
            <div
              style={{
                transform: `scale(${scale})`,
                transformOrigin: 'center center',
                width: 1280,
                height: 720,
                flexShrink: 0,
              }}
            >
              <SlideRenderer
                slide={currentSlide}
                pageNum={currentIndex + 1}
                sectionNumbers={sectionNumbers}
                tocEntries={tocEntries}
                lang={lang}
              />
            </div>
          )}
        </div>

        {/* Resize handle */}
        <div
          onMouseDown={onResizerMouseDown}
          className="w-1 shrink-0 cursor-col-resize bg-gray-700 hover:bg-blue-500 transition-colors"
        />

        {/* Script panel */}
        <div className="shrink-0 flex flex-col bg-gray-900" style={{ width: scriptWidth }}>
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700 shrink-0">
            <span className="text-sm text-gray-400 font-mono">
              {currentIndex + 1} / {slides.length}
            </span>
            <span className="text-xs text-gray-500 truncate max-w-[160px]" title={currentSlide?.id}>
              {currentSlide?.id}
            </span>
            <a
              href={`?${(() => { const p = new URLSearchParams(location.search); p.delete('present'); return p.toString() })()}`}
              className="text-xs text-gray-500 hover:text-gray-300 px-1.5 py-0.5 rounded hover:bg-gray-700 transition-colors"
            >
              ✕ 終了
            </a>
          </div>

          {/* Script textarea */}
          <textarea
            className="flex-1 bg-transparent text-sm text-gray-200 leading-relaxed p-3 resize-none outline-none placeholder-gray-600 thin-scroll"
            placeholder="原稿を入力..."
            value={editingText}
            onChange={e => setEditingText(e.target.value)}
            onBlur={saveScript}
          />

          {/* Footer: save status + navigation */}
          <div className="flex items-center justify-between px-3 py-2 border-t border-gray-700 shrink-0">
            <span className="text-xs text-gray-600">
              {saving ? '保存中…' : 'Blur で自動保存'}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => navigate(-1)}
                disabled={currentIndex === 0}
                className="text-sm px-2.5 py-1 bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-30 transition-colors"
              >←</button>
              <button
                onClick={() => navigate(1)}
                disabled={currentIndex === slides.length - 1}
                className="text-sm px-2.5 py-1 bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-30 transition-colors"
              >→</button>
            </div>
          </div>
        </div>
      </div>
    </ProjectContext.Provider>
  )
}
