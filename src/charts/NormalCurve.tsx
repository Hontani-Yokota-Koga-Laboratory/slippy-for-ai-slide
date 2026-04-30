import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

interface Props {
  width?: number
  height?: number
}

export function NormalCurve({ width: W = 520, height: H = 240 }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    d3.select(svg).selectAll('*').remove()

    const margin = { top: 20, right: 20, bottom: 36, left: 44 }
    const w = W - margin.left - margin.right
    const h = H - margin.top - margin.bottom

    const g = d3.select(svg)
      .attr('width', W).attr('height', H)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    const pdf = (x: number) => Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI)
    const xScale = d3.scaleLinear().domain([-3.5, 3.5]).range([0, w])
    const yScale = d3.scaleLinear().domain([0, pdf(0) * 1.15]).range([h, 0])

    const data = d3.range(-3.5, 3.5, 0.05).map(x => ({ x, y: pdf(x) }))
    const shaded = data.filter(d => d.x >= -1 && d.x <= 1)

    const area = d3.area<{ x: number; y: number }>()
      .x(d => xScale(d.x)).y0(h).y1(d => yScale(d.y)).curve(d3.curveBasis)
    const line = d3.line<{ x: number; y: number }>()
      .x(d => xScale(d.x)).y(d => yScale(d.y)).curve(d3.curveBasis)

    g.append('path').datum(shaded).attr('fill', '#bfdbfe').attr('opacity', 0.6).attr('d', area)
    g.append('path').datum(data).attr('fill', 'none')
      .attr('stroke', '#1d4ed8').attr('stroke-width', 2.5).attr('d', line)

    g.append('g').attr('transform', `translate(0,${h})`)
      .call(d3.axisBottom(xScale).ticks(7).tickFormat(d => `${d}σ`))
    g.append('g').call(d3.axisLeft(yScale).ticks(4))

    g.append('text')
      .attr('x', xScale(0)).attr('y', yScale(pdf(0)) - 10)
      .attr('text-anchor', 'middle').attr('fill', '#1d4ed8').attr('font-size', 13)
      .text('μ = 0, σ = 1')
  }, [W, H])

  return <svg ref={svgRef} />
}
