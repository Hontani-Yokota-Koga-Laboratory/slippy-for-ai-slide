import type { FigureComponent } from '../../types'
import { chartRegistry } from '../../charts/registry'
import { localChartRegistry } from '../../charts/localRegistry'
import { useProject } from '../../context/ProjectContext'

interface Props {
  block: FigureComponent
  selected?: boolean
  onClick?: (e: React.MouseEvent) => void
}

export function SlideFigure({ block, selected, onClick }: Props) {
  const project = useProject()
  const Chart = localChartRegistry[project]?.[block.props.chartId] ?? chartRegistry[block.props.chartId]
  const { width, height, caption } = block.props

  return (
    <div
      className={`slide-figure${selected ? ' selected-component' : ''}`}
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : undefined}
    >
      {Chart ? (
        <Chart width={width} height={height} />
      ) : (
        <div style={{ padding: 16, background: '#f1f5f9', borderRadius: 6, color: '#64748b', fontSize: '0.8em' }}>
          Chart not found: {block.props.chartId}
        </div>
      )}
      {caption && <span className="slide-figure-caption">{caption}</span>}
    </div>
  )
}
