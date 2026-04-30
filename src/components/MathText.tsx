import { renderMath } from '../utils/math'

interface Props {
  children: string
  className?: string
}

export function MathText({ children, className }: Props) {
  const html = renderMath(children)
  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
