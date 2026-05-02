import { useState, useEffect, useCallback, useRef } from 'react'
import type { Slide, TocEntry, SlideComponent, MoveTarget, OverlayComponent } from '../types'
import type { SectionInfo } from '../utils/sections'
import { computeSectionNumbers, computeTocEntries } from '../utils/sections'
import {
  updateSlideProps,
  updateSlideComponent,
  deleteComponentFromList,
  moveUpDownInComponents,
  extractComponent,
  insertAtTarget,
  createDefaultComponent,
  createDefaultOverlay,
  reorderInTree,
  newId,
} from '../utils/mutations'
import { convertToJpeg } from '../utils/image'

export type MobileTab = 'slides' | 'tree' | 'props'

export function getUrlParams() {
  const p = new URLSearchParams(location.search)
  return {
    project: p.get('project') ?? 'example',
    slide:   p.get('slide') ?? null,
    print:   p.get('print') === '1',
    theme:   p.get('theme') ?? undefined,
  }
}

export function pushUrlState(project: string, slideId: string | null, theme: string) {
  const p = new URLSearchParams(location.search)
  p.set('project', project)
  if (slideId) p.set('slide', slideId)
  else p.delete('slide')
  p.set('theme', theme)
  history.replaceState(null, '', `?${p.toString()}`)
}

export function useAppLogic() {
  const { project: initialProject, slide: initialSlide, theme: initialTheme } = getUrlParams()

  const [project] = useState(initialProject)
  const [theme, setTheme] = useState(initialTheme ?? 'light')
  const [projects, setProjects] = useState<string[]>([])
  const [slides, setSlides] = useState<Slide[]>([])
  const [sectionNumbers, setSectionNumbers] = useState<Map<string, SectionInfo>>(new Map())
  const [tocEntries, setTocEntries] = useState<TocEntry[]>([])
  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(initialSlide)
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [generatingPdf, setGeneratingPdf] = useState(false)
  const [cleaning, setCleaning] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle')
  const [leftWidth, setLeftWidth] = useState(224)
  const [rightWidth, setRightWidth] = useState(288)
  const [mobileTab, setMobileTab] = useState<MobileTab>('slides')
  const draggingLeft = useRef(false)
  const draggingRight = useRef(false)

  const savedSlidesRef = useRef<string>('')
  const hasUnsavedChanges = savedSlidesRef.current !== '' && savedSlidesRef.current !== JSON.stringify(slides)

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
    fetch(`/api/projects/${project}/config`)
      .then(r => r.json())
      .then(data => {
        if (data.theme && !initialTheme) {
          setTheme(data.theme)
        }
      })
  }, [project, initialTheme])

  useEffect(() => {
    fetch(`/api/projects/${project}/slides`)
      .then(r => r.json())
      .then((data: Slide[]) => {
        setSlides(data)
        setSectionNumbers(computeSectionNumbers(data))
        setTocEntries(computeTocEntries(data))
        savedSlidesRef.current = JSON.stringify(data)

        setSelectedSlideId(prev => {
          const target = prev ?? initialSlide
          return data.find(s => s.id === target) ? (target ?? data[0]?.id ?? null) : (data[0]?.id ?? null)
        })
        setSelectedComponentId(null)
      })
  }, [project, initialSlide])

  useEffect(() => {
    setSectionNumbers(computeSectionNumbers(slides))
    setTocEntries(computeTocEntries(slides))
  }, [slides])

  useEffect(() => {
    pushUrlState(project, selectedSlideId, theme)
  }, [project, selectedSlideId, theme])

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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

  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items || !selectedSlideId) return

      for (let i = 0; i < items.length; i++) {
        const mimeType = items[i].type
        if (mimeType.indexOf('image') !== -1) {
          const file = items[i].getAsFile()
          if (!file) continue

          let blobToUpload: Blob = file
          let extension = 'png'

          if (mimeType === 'image/svg+xml') {
            extension = 'svg'
          } else if (mimeType === 'image/gif') {
            extension = 'gif'
          } else {
            try {
              blobToUpload = await convertToJpeg(file)
              extension = 'jpg'
            } catch (err) {
              console.warn('Failed to convert to JPEG, uploading original', err)
              // Use original extension if available, otherwise png
              const originalExt = file.name ? file.name.split('.').pop() : null
              extension = originalExt || (mimeType === 'image/jpeg' ? 'jpg' : 'png')
            }
          }

          const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
          const filename = `pasted-${timestamp}.${extension}`

          try {
            const res = await fetch(`/api/projects/${project}/images?filename=${filename}`, {
              method: 'POST',
              body: blobToUpload,
            })

            if (res.ok) {
              const data = await res.json()
              const newComp: SlideComponent = {
                type: 'image',
                id: newId(),
                props: { src: data.filename, caption: '' },
              }

              setSlides(prev => prev.map(slide => {
                if (slide.id !== selectedSlideId || slide.layout !== 'content') return slide
                return { ...slide, children: [...slide.children, newComp] }
              }))
              setSelectedComponentId(newComp.id)
            }
          } catch (err) {
            console.error('Failed to upload pasted image:', err)
          }
        }
      }
    }

    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [project, selectedSlideId, setSlides])

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

  const handleAddOverlay = useCallback((_type: OverlayComponent['type']) => {
    if (!selectedSlideId) return
    const overlay = createDefaultOverlay()
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

  const handleReorderComponent = useCallback((activeId: string, overId: string) => {
    if (!selectedSlideId || activeId === overId) return
    setSlides(prev => prev.map(slide => {
      if (slide.id !== selectedSlideId || slide.layout !== 'content') return slide
      return { ...slide, children: reorderInTree(slide.children, activeId, overId) }
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
      const [resSlides, resConfig] = await Promise.all([
        fetch(`/api/projects/${project}/slides`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(slides, null, 2),
        }),
        fetch(`/api/projects/${project}/config`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ theme }, null, 2),
        })
      ])
      if (resSlides.ok && resConfig.ok) {
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

  const cleanUnusedImages = async () => {
    if (!confirm('使用していない画像を削除しますか？')) return
    setCleaning(true)
    try {
      // Collect used images
      const usedImages = new Set<string>()
      const walk = (components: SlideComponent[]) => {
        for (const comp of components) {
          if (comp.type === 'image' && comp.props.src) {
            usedImages.add(comp.props.src)
          } else if (comp.type === 'cols') {
            comp.columns.forEach(walk)
          } else if (comp.type === 'vcenter') {
            walk(comp.children)
          }
        }
      }

      slides.forEach(slide => {
        if (slide.layout === 'content') {
          walk(slide.children)
        }
      })

      // Fetch all images
      const res = await fetch(`/api/projects/${project}/images`)
      if (!res.ok) throw new Error('Failed to fetch image list')
      const allImages: string[] = await res.json()

      // Identify unused images
      const unusedImages = allImages.filter(filename => !usedImages.has(filename))

      if (unusedImages.length === 0) {
        alert('未使用の画像はありませんでした。')
        return
      }

      if (!confirm(`${unusedImages.length}個の未使用画像を削除しますか？\n\n${unusedImages.join('\n')}`)) return

      // Delete unused images
      let deletedCount = 0
      for (const filename of unusedImages) {
        const delRes = await fetch(`/api/projects/${project}/images/${filename}`, { method: 'DELETE' })
        if (delRes.ok) deletedCount++
      }

      alert(`${deletedCount}個の画像を削除しました。`)
    } catch (err) {
      console.error('Failed to clean images:', err)
      alert('エラーが発生しました。')
    } finally {
      setCleaning(false)
    }
  }

  return {
    project,
    theme,
    setTheme,
    projects,
    slides,
    sectionNumbers,
    tocEntries,
    selectedSlideId,
    selectedComponentId,
    saving,
    generatingPdf,
    cleaning,
    saveStatus,
    leftWidth,
    rightWidth,
    mobileTab,
    setMobileTab,
    hasUnsavedChanges,
    handleSelectSlide,
    handleSelectComponent,
    handleNavigate,
    startLeftDrag,
    startRightDrag,
    handleReorderComponent,
    handleAddComponent,
    handleDeleteComponent,
    handleMoveUpDown,
    handleLayerMove,
    handleAddOverlay,
    handleDeleteOverlay,
    handleMoveOverlay,
    handlePropsChange,
    save,
    generatePdf,
    cleanUnusedImages,
  }
}
