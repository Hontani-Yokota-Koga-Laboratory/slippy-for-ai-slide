import type { PropField } from '../types'

const inputCls = 'w-full bg-gray-700 text-gray-100 text-xs rounded px-2 py-1.5 border border-gray-600 focus:outline-none focus:border-blue-400'

interface Props {
  field: PropField
  value: unknown
  onChange: (key: string, val: unknown) => void
}

export function PropsField({ field, value, onChange }: Props) {
  const strVal = value === undefined || value === null ? '' : String(value)

  return (
    <div className="mb-3">
      <label className="block text-xs text-gray-400 mb-1">{field.label}</label>
      {field.type === 'select' ? (
        <select value={strVal} onChange={e => onChange(field.key, e.target.value)} className={inputCls}>
          {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      ) : field.type === 'boolean' ? (
        <label className="flex items-center gap-2 cursor-pointer py-1">
          <input
            type="checkbox"
            checked={!!value}
            onChange={e => onChange(field.key, e.target.checked)}
            className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-400 focus:ring-offset-gray-800"
          />
          <span className="text-xs text-gray-200">{value ? 'ON' : 'OFF'}</span>
        </label>
      ) : field.type === 'textarea' ? (
        <textarea
          value={strVal}
          onChange={e => onChange(field.key, e.target.value)}
          rows={4}
          placeholder={field.placeholder}
          className={`${inputCls} resize-y font-mono`}
        />
      ) : field.type === 'number' ? (
        <input
          type="number"
          value={strVal}
          onChange={e => {
            const v = e.target.value
            onChange(field.key, v === '' ? undefined : Number(v))
          }}
          min={field.min}
          max={field.max}
          step={field.step ?? 1}
          placeholder={field.placeholder}
          className={inputCls}
        />
      ) : (
        <input
          type="text"
          value={strVal}
          onChange={e => onChange(field.key, e.target.value)}
          placeholder={field.placeholder}
          className={inputCls}
        />
      )}
    </div>
  )
}
