import { ProjectContext } from './context/ProjectContext'
import { SlideList } from './editor/SlideList'
import { ComponentTree } from './editor/ComponentTree'
import { SplitPane } from './editor/SplitPane'
import { SlidePreview } from './editor/SlidePreview'
import { PropsPanel } from './editor/PropsPanel'
import { PrintView } from './editor/PrintView'
import { useAppLogic, getUrlParams } from './hooks/useAppLogic'

const THEMES = [
  { id: 'light',    label: 'Light',    icon: '☀️' },
  { id: 'dark',     label: 'Dark',     icon: '🌙' },
  { id: 'academic', label: 'Academic', icon: '🏛️' },
  { id: 'pop',      label: 'Pop',      icon: '🎀' },
]

const MOBILE_TABS = [
  { id: 'slides' as const, label: 'スライド', icon: '≡' },
  { id: 'tree' as const,   label: 'ツリー',   icon: '⊞' },
  { id: 'props' as const,  label: '設定',     icon: '⚙' },
]

export default function App() {
  const { project: initialProject, print: isPrint, theme: initialTheme } = getUrlParams()
  const logic = useAppLogic()

  if (isPrint) {
    return <PrintView project={initialProject} theme={initialTheme} />
  }

  const selectedSlideIndex = logic.slides.findIndex(s => s.id === logic.selectedSlideId)
  const selectedSlide = selectedSlideIndex >= 0 ? logic.slides[selectedSlideIndex] : null

  const slideListPanel = (
    <SlideList
      slides={logic.slides}
      sectionNumbers={logic.sectionNumbers}
      selectedSlideId={logic.selectedSlideId}
      onSelectSlide={logic.handleSelectSlide}
    />
  )

  const componentTreePanel = (
    <ComponentTree
      slide={selectedSlide}
      selectedComponentId={logic.selectedComponentId}
      onSelectComponent={(id) => logic.selectedSlideId && logic.handleSelectComponent(logic.selectedSlideId, id)}
      onAddComponent={logic.handleAddComponent}
      onDeleteComponent={logic.handleDeleteComponent}
      onMoveUpDown={logic.handleMoveUpDown}
      onLayerMove={logic.handleLayerMove}
      onReorder={logic.handleReorderComponent}
      onAddOverlay={logic.handleAddOverlay}
      onDeleteOverlay={logic.handleDeleteOverlay}
    />
  )

  const previewPanel = (
    <SlidePreview
      slide={selectedSlide}
      slides={logic.slides}
      slideIndex={selectedSlideIndex >= 0 ? selectedSlideIndex : 0}
      sectionNumbers={logic.sectionNumbers}
      tocEntries={logic.tocEntries}
      selectedComponentId={logic.selectedComponentId}
      onSelectComponent={(id) => logic.selectedSlideId && logic.handleSelectComponent(logic.selectedSlideId, id)}
      onMoveOverlay={logic.handleMoveOverlay}
      onNavigate={logic.handleNavigate}
    />
  )

  const propsPanel = (
    <PropsPanel
      slide={selectedSlide}
      componentId={logic.selectedComponentId}
      onChange={logic.handlePropsChange}
    />
  )

  return (
    <ProjectContext.Provider value={logic.project}>
    <div className={`h-screen flex flex-col bg-gray-900 text-white theme-${logic.theme}`}>
      {/* Header */}
      <header className="flex items-center gap-2 px-3 md:px-4 py-2 bg-gray-800 border-b border-gray-700 shrink-0">
        <span className="font-bold text-sm text-gray-200">Slippie</span>
        <div className="w-px h-4 bg-gray-600 hidden sm:block" />
        <select
          value={logic.project}
          onChange={e => { location.href = `?project=${e.target.value}` }}
          className="bg-gray-700 text-white text-sm px-2 py-1 rounded border border-gray-600 max-w-[8rem] sm:max-w-none"
        >
          {logic.projects.map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        {logic.hasUnsavedChanges && (
          <span className="text-xs text-amber-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
            <span className="hidden sm:inline">未保存</span>
          </span>
        )}

        <div className="flex-1" />
        {logic.saveStatus === 'saved' && <span className="text-xs text-green-400 hidden sm:inline">保存しました</span>}
        {logic.saveStatus === 'error' && <span className="text-xs text-red-400 hidden sm:inline">保存に失敗しました</span>}

        <select
          value={logic.theme}
          onChange={e => {
            const p = new URLSearchParams(location.search)
            p.set('theme', e.target.value)
            location.href = `?${p.toString()}`
          }}
          className="bg-gray-700 text-white text-sm px-2 py-1 rounded border border-gray-600 transition-colors"
        >
          {THEMES.map(t => (
            <option key={t.id} value={t.id}>
              {t.icon} {t.label}
            </option>
          ))}
        </select>

        <button
          onClick={logic.save}
          disabled={logic.saving}
          className="text-sm px-2 sm:px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded disabled:opacity-50 transition-colors"
        >
          {logic.saving ? '…' : '保存'}
        </button>
        <button
          onClick={logic.generatePdf}
          disabled={logic.generatingPdf}
          className="hidden sm:block text-sm px-3 py-1 bg-violet-600 hover:bg-violet-500 rounded disabled:opacity-50 transition-colors"
        >
          {logic.generatingPdf ? 'PDF生成中…' : 'PDF出力'}
        </button>
        <button
          onClick={logic.cleanUnusedImages}
          disabled={logic.cleaning}
          className="hidden sm:block text-sm px-3 py-1 bg-teal-600 hover:bg-teal-500 rounded disabled:opacity-50 transition-colors"
        >
          {logic.cleaning ? '掃除中…' : 'クリーン'}
        </button>
      </header>

      {/* Desktop: 3-column layout */}
      <div className="hidden lg:flex flex-1 overflow-hidden">
        <aside className="shrink-0 bg-gray-800 border-r border-gray-700" style={{ width: logic.leftWidth }}>
          <SplitPane defaultTopPercent={55} top={slideListPanel} bottom={componentTreePanel} />
        </aside>
        <div className="w-1.5 shrink-0 bg-gray-700 hover:bg-blue-600 cursor-col-resize transition-colors" onMouseDown={logic.startLeftDrag} />
        <main className="flex-1 overflow-hidden">{previewPanel}</main>
        <div className="w-1.5 shrink-0 bg-gray-700 hover:bg-blue-600 cursor-col-resize transition-colors" onMouseDown={logic.startRightDrag} />
        <aside className="shrink-0 bg-gray-800 border-l border-gray-700 overflow-y-auto thin-scroll" style={{ width: logic.rightWidth }}>
          {propsPanel}
        </aside>
      </div>

      {/* Mobile: preview top half + tabbed panel bottom half */}
      <div className="flex lg:hidden flex-1 flex-col overflow-hidden min-h-0">
        <div className="flex-1 overflow-hidden min-h-0 border-b border-gray-700">{previewPanel}</div>
        <nav className="flex shrink-0 border-b border-gray-700 bg-gray-800">
          {MOBILE_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => logic.setMobileTab(tab.id)}
              className={`flex-1 py-2 text-xs flex flex-col items-center gap-0.5 transition-colors
                ${logic.mobileTab === tab.id ? 'text-blue-400 bg-gray-700/50' : 'text-gray-500 active:text-gray-300'}`}
            >
              <span className="text-base leading-none">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
        <div className="flex-1 overflow-hidden min-h-0 bg-gray-800">
          {logic.mobileTab === 'slides' && slideListPanel}
          {logic.mobileTab === 'tree'   && componentTreePanel}
          {logic.mobileTab === 'props'  && <div className="h-full overflow-y-auto thin-scroll">{propsPanel}</div>}
        </div>
      </div>
    </div>
    </ProjectContext.Provider>
  )
}
