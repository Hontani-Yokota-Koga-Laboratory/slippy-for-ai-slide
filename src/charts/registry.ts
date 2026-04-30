import type { ComponentType } from 'react'
import { NormalCurve } from './NormalCurve'

export interface ChartProps {
  width?: number
  height?: number
}

export const chartRegistry: Record<string, ComponentType<ChartProps>> = {
  NormalCurve,
}
