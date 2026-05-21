import { useRef, useCallback, useState } from 'react'
import type { Slide } from '../types'
import type { Dispatch, SetStateAction, MutableRefObject } from 'react'

type HistoryMeta = {
  slideId: string
  componentId: string | null
  propKey: string | null
}

type HistoryEntry = {
  slides: Slide[]
  meta: HistoryMeta
}

export function useUndoHistory(
  setSlides: Dispatch<SetStateAction<Slide[]>>,
  slidesRef: MutableRefObject<Slide[]>,
) {
  const historyRef = useRef<HistoryEntry[]>([])
  const futureRef = useRef<HistoryEntry[]>([])
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  const sync = useCallback(() => {
    setCanUndo(historyRef.current.length > 0)
    setCanRedo(futureRef.current.length > 0)
  }, [])

  const push = useCallback((currentSlides: Slide[], meta: HistoryMeta) => {
    const history = historyRef.current
    const last = history[history.length - 1]

    if (
      meta.propKey !== null &&
      last?.meta.slideId === meta.slideId &&
      last?.meta.componentId === meta.componentId &&
      last?.meta.propKey === meta.propKey
    ) return

    const next = [...history, { slides: currentSlides, meta }]
    historyRef.current = next.length > 50 ? next.slice(-50) : next
    futureRef.current = []
    sync()
  }, [sync])

  const undo = useCallback(() => {
    const history = historyRef.current
    if (history.length === 0) return
    const entry = history[history.length - 1]
    historyRef.current = history.slice(0, -1)
    futureRef.current = [...futureRef.current, { slides: slidesRef.current, meta: entry.meta }]
    setSlides(entry.slides)
    sync()
  }, [setSlides, slidesRef, sync])

  const redo = useCallback(() => {
    const future = futureRef.current
    if (future.length === 0) return
    const entry = future[future.length - 1]
    futureRef.current = future.slice(0, -1)
    historyRef.current = [...historyRef.current, { slides: slidesRef.current, meta: entry.meta }]
    setSlides(entry.slides)
    sync()
  }, [setSlides, slidesRef, sync])

  return { push, undo, redo, canUndo, canRedo }
}
