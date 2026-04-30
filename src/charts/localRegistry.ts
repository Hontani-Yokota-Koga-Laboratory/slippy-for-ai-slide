import type { ComponentType } from 'react'
import type { ChartProps } from './registry'

const modules = import.meta.glob('../../projects/*/charts/*.tsx', { eager: true }) as Record<
  string,
  { default: ComponentType<ChartProps> }
>

// { project: { chartId: Component } }
export const localChartRegistry: Record<string, Record<string, ComponentType<ChartProps>>> = {}

for (const [path, mod] of Object.entries(modules)) {
  const match = path.match(/\/projects\/([^/]+)\/charts\/([^/]+)\.tsx$/)
  if (!match || !mod.default) continue
  const [, project, chartId] = match
  if (!localChartRegistry[project]) localChartRegistry[project] = {}
  localChartRegistry[project][chartId] = mod.default
}
