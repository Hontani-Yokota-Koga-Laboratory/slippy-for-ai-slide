import type { ComponentType } from 'react'

export interface ChartProps {
  width?: number
  height?: number
}

export const chartRegistry: Record<string, ComponentType<ChartProps>> = {}
