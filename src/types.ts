export type BoxVariant = 'blue' | 'violet' | 'cyan' | 'green' | 'amber' | 'red'

// ── Component types (blocks inside a content slide) ──────────────────────────

export interface BoxComponent {
  type: 'box'
  id: string
  props: {
    variant: BoxVariant
    label?: string
    labelFontSize?: number  // em — label heading size
    bodyFontSize?: number   // em — body content size
    width?: number          // px — box width
  }
  children: string
}

export interface ColsComponent {
  type: 'cols'
  id: string
  // ratio as two integers, e.g. left:1 right:2 → "1fr 2fr"
  props: { left: number; right: number; gap?: number }
  columns: SlideComponent[][]
}

export interface FigureComponent {
  type: 'figure'
  id: string
  props: { caption?: string; chartId: string; width?: number; height?: number }
}

export interface TextComponent {
  type: 'text'
  id: string
  props?: { fontSize?: number }
  children: string
}

export interface H3Component {
  type: 'h3'
  id: string
  props?: { fontSize?: number }
  children: string
}

export interface UlComponent {
  type: 'ul'
  id: string
  props?: { fontSize?: number }
  items: string[]
}

export interface TableComponent {
  type: 'table'
  id: string
  props: { headers: string[]; rows: string[][]; fontSize?: number }
}

export interface DividerComponent {
  type: 'divider'
  id: string
}

export interface VCenterComponent {
  type: 'vcenter'
  id: string
  children: SlideComponent[]
}

export interface ImageComponent {
  type: 'image'
  id: string
  props: {
    src: string
    caption?: string
    width?: number
    height?: number
    borderColor?: string
  }
}

export type SlideComponent =
  | BoxComponent
  | ColsComponent
  | FigureComponent
  | ImageComponent
  | TextComponent
  | H3Component
  | UlComponent
  | TableComponent
  | DividerComponent
  | VCenterComponent

// ── Slide types (one slide = one 1280×720 page) ───────────────────────────────

export interface TitleSlide {
  layout: 'title'
  id: string
  props: { tag?: string; heading: string; author?: string; date?: string }
}

export interface TocSlide {
  layout: 'toc'
  id: string
  props: { heading?: string }
}

export interface SectionSlide {
  layout: 'section'
  id: string
  props: { title: string }
}

export interface SubsectionSlide {
  layout: 'subsection'
  id: string
  props: { title: string }
}

export interface SubsubsectionSlide {
  layout: 'subsubsection'
  id: string
  props: { title: string }
}

// ── Overlay types (absolutely positioned on the slide) ───────────────────────

export interface AbsTextBox {
  type: 'abs-textbox'
  id: string
  props: {
    x: number
    y: number
    width: number
    height: number
    content: string
    fontSize?: number
    borderColor?: string
    fitToInner?: boolean
  }
}

export type OverlayComponent = AbsTextBox

// ─────────────────────────────────────────────────────────────────────────────

export interface ContentSlide {
  layout: 'content'
  id: string
  props: { heading: string }
  children: SlideComponent[]
  overlays?: OverlayComponent[]
}

export interface StatementSlide {
  layout: 'statement'
  id: string
  props: { children: string }
}

export type Slide =
  | TitleSlide
  | TocSlide
  | SectionSlide
  | SubsectionSlide
  | SubsubsectionSlide
  | ContentSlide
  | StatementSlide

export type MoveTarget =
  | { kind: 'slide' }
  | { kind: 'vcenter'; id: string }
  | { kind: 'cols'; id: string; colIndex: number }

// ── TOC / Section numbering ──────────────────────────────────────────────────

export interface TocEntry {
  level: 1 | 2 | 3
  num: string
  text: string
}

// ── Props panel schema ────────────────────────────────────────────────────────

export interface PropField {
  key: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'number' | 'boolean'
  options?: string[]
  placeholder?: string
  min?: number
  max?: number
  step?: number
}
