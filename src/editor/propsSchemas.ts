import type { PropField } from '../types'

export const SLIDE_SCHEMAS: Record<string, PropField[]> = {
  title: [
    { key: 'tag',     label: 'タグ',   type: 'text',   placeholder: 'ゼミ | 3班' },
    { key: 'heading', label: '見出し', type: 'text' },
    { key: 'author',  label: '著者',   type: 'text' },
    { key: 'date',    label: '日付',   type: 'text',   placeholder: 'auto または YYYY-MM-DD' },
  ],
  toc:          [{ key: 'heading', label: '見出し',   type: 'text', placeholder: '目次' }],
  section:      [{ key: 'title',   label: 'タイトル', type: 'text' }],
  subsection:   [{ key: 'title',   label: 'タイトル', type: 'text' }],
  subsubsection:[{ key: 'title',   label: 'タイトル', type: 'text' }],
  content:      [{ key: 'heading', label: '見出し',   type: 'text' }],
  statement:    [{ key: 'children',label: 'テキスト', type: 'textarea' }],
}

export const COMPONENT_SCHEMAS: Record<string, PropField[]> = {
  box: [
    { key: 'variant',       label: 'タイプ',           type: 'select',
      options: ['blue', 'violet', 'cyan', 'green', 'amber', 'red'] },
    { key: 'label',         label: 'ラベル',           type: 'text' },
    { key: 'children',      label: '内容',             type: 'textarea' },
    { key: 'labelFontSize', label: 'ラベルサイズ (em)', type: 'number', min: 0.5, max: 2, step: 0.05, placeholder: '0.9' },
    { key: 'bodyFontSize',  label: '本文サイズ (em)',  type: 'number', min: 0.5, max: 2, step: 0.05, placeholder: '0.9' },
    { key: 'width',         label: '幅 (px)',          type: 'number', min: 100, step: 10 },
  ],
  cols: [
    { key: 'left',  label: '左の比率', type: 'number', min: 1, max: 9, step: 1 },
    { key: 'right', label: '右の比率', type: 'number', min: 1, max: 9, step: 1 },
    { key: 'gap',   label: 'Gap (px)', type: 'number', min: 0, step: 4, placeholder: '24' },
  ],
  figure: [
    { key: 'caption', label: 'キャプション', type: 'text' },
    { key: 'chartId', label: 'チャートID',   type: 'text' },
    { key: 'width',   label: '幅 (px)',       type: 'number', min: 100, step: 10, placeholder: '520' },
    { key: 'height',  label: '高さ (px)',     type: 'number', min: 50,  step: 10, placeholder: '240' },
  ],
  image: [
    { key: 'src',     label: 'ファイル名',     type: 'text' },
    { key: 'caption', label: 'キャプション', type: 'text' },
    { key: 'width',   label: '幅 (px)',       type: 'number', min: 100, step: 10 },
    { key: 'height',  label: '高さ (px)',     type: 'number', min: 50,  step: 10 },
    { key: 'borderColor', label: '枠の色',     type: 'text',   placeholder: 'red, #000, etc.' },
  ],
  text: [
    { key: 'children', label: 'テキスト',   type: 'textarea' },
    { key: 'fontSize', label: 'フォントサイズ (em)', type: 'number', min: 0.5, max: 2, step: 0.05 },
  ],
  h3: [
    { key: 'children', label: '見出し',     type: 'text' },
    { key: 'fontSize', label: 'フォントサイズ (em)', type: 'number', min: 0.5, max: 2, step: 0.05 },
  ],
  ul: [
    { key: 'items',    label: '項目 (1行1項目)', type: 'textarea' },
    { key: 'fontSize', label: 'フォントサイズ (em)', type: 'number', min: 0.5, max: 2, step: 0.05 },
  ],
  table: [
    { key: 'headers',  label: 'ヘッダー (カンマ区切り)', type: 'text' },
    { key: 'rows',     label: 'データ (1行1行、セルは | 区切り)', type: 'textarea' },
    { key: 'fontSize', label: 'フォントサイズ (em)', type: 'number', min: 0.5, max: 2, step: 0.05 },
  ],
  divider: [],
  vcenter: [],
}

export const OVERLAY_SCHEMAS: Record<string, PropField[]> = {
  'abs-textbox': [
    { key: 'content',  label: '内容',             type: 'textarea' },
    { key: 'x',        label: 'X (px)',           type: 'number', min: 0, max: 1280, step: 1 },
    { key: 'y',        label: 'Y (px)',           type: 'number', min: 0, max: 720,  step: 1 },
    { key: 'width',    label: '幅 (px)',           type: 'number', min: 50, step: 10 },
    { key: 'height',   label: '高さ (px)',         type: 'number', min: 30, step: 10 },
    { key: 'fontSize', label: 'フォントサイズ (em)', type: 'number', min: 0.5, max: 3, step: 0.05 },
    { key: 'borderColor', label: '枠の色',         type: 'text', placeholder: '#94a3b8' },
    { key: 'fitToInner', label: '内枠に収める',     type: 'boolean' },
  ],
}
