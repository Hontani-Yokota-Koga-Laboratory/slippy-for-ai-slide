import { createContext, useContext } from 'react'

interface SlideInteractionContextType {
  selectedId: string | undefined
  onSelect: (id: string) => void
  onMoveOverlay: (id: string, x: number, y: number) => void
}

const defaultCtx: SlideInteractionContextType = {
  selectedId: undefined,
  onSelect: () => {},
  onMoveOverlay: () => {},
}

export const SlideInteractionContext = createContext<SlideInteractionContextType>(defaultCtx)
export const useSlideInteraction = () => useContext(SlideInteractionContext)
