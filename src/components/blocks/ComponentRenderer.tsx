import type { SlideComponent } from '../../types'
import { SlideBox } from './SlideBox'
import { SlideFigure } from './SlideFigure'
import { MathText } from '../MathText'

interface Props {
  block: SlideComponent
  selectedId?: string
  onSelect?: (id: string) => void
}

export function ComponentRenderer({ block, selectedId, onSelect }: Props) {
  const isSelected = selectedId === block.id
  const handleClick = onSelect
    ? (e: React.MouseEvent) => { e.stopPropagation(); onSelect(block.id) }
    : undefined

  switch (block.type) {
    case 'box':
      return <SlideBox block={block} selected={isSelected} onClick={handleClick} />

    case 'cols': {
      const { left, right, gap = 24 } = block.props
      return (
        <div
          className={`slide-cols${isSelected ? ' selected-component' : ''}`}
          style={{ gridTemplateColumns: `${left}fr ${right}fr`, gap }}
          onClick={handleClick}
        >
          {block.columns.map((col, i) => (
            <div key={i}>
              {col.map(child => (
                <ComponentRenderer
                  key={child.id}
                  block={child}
                  selectedId={selectedId}
                  onSelect={onSelect}
                />
              ))}
            </div>
          ))}
        </div>
      )
    }

    case 'figure':
      return <SlideFigure block={block} selected={isSelected} onClick={handleClick} />

    case 'text': {
      const fs = block.props?.fontSize
      return (
        <p
          className={isSelected ? 'selected-component' : ''}
          style={fs ? { fontSize: `${fs}em` } : undefined}
          onClick={handleClick}
        >
          <MathText>{block.children}</MathText>
        </p>
      )
    }

    case 'h3': {
      const fs = block.props?.fontSize
      return (
        <h3
          className={isSelected ? 'selected-component' : ''}
          style={fs ? { fontSize: `${fs}em` } : undefined}
          onClick={handleClick}
        >
          <MathText>{block.children}</MathText>
        </h3>
      )
    }

    case 'ul': {
      const fs = block.props?.fontSize
      return (
        <ul
          className={isSelected ? 'selected-component' : ''}
          style={fs ? { fontSize: `${fs}em` } : undefined}
          onClick={handleClick}
        >
          {block.items.map((item, i) => (
            <li key={i}><MathText>{item}</MathText></li>
          ))}
        </ul>
      )
    }

    case 'table': {
      const fs = block.props?.fontSize
      return (
        <table
          className={`slide-table${isSelected ? ' selected-component' : ''}`}
          style={fs ? { fontSize: `${fs}em` } : undefined}
          onClick={handleClick}
        >
          <thead>
            <tr>{block.props.headers.map((h, i) => <th key={i}><MathText>{h}</MathText></th>)}</tr>
          </thead>
          <tbody>
            {block.props.rows.map((row, i) => (
              <tr key={i}>{row.map((cell, j) => <td key={j}><MathText>{cell}</MathText></td>)}</tr>
            ))}
          </tbody>
        </table>
      )
    }

    case 'vcenter':
      return (
        <div
          className={isSelected ? 'selected-component' : ''}
          style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
          onClick={handleClick}
        >
          {block.children.map(child => (
            <ComponentRenderer key={child.id} block={child} selectedId={selectedId} onSelect={onSelect} />
          ))}
        </div>
      )

    case 'divider':
      return <hr className="slide-divider" />

    default:
      return null
  }
}
