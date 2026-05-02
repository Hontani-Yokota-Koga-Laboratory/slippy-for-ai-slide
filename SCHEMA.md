# Slide Schema & Snippets

`slides.json` は JSON 配列。各要素が 1 スライド（1280×720px）。
このファイルだけ読めば slides.json を書ける。他のファイルを探索する必要はない。

## スライドレイアウト

```json
{ "id": "slide-title", "layout": "title", "props": { "heading": "タイトル", "tag": "サブタグ", "author": "著者", "date": "auto" } }
{ "id": "slide-toc",   "layout": "toc",   "props": { "heading": "目次" } }
{ "id": "slide-s1",    "layout": "section",       "props": { "title": "セクション" } }
{ "id": "slide-s1-1",  "layout": "subsection",     "props": { "title": "サブセクション" } }
{ "id": "slide-s1-1-1","layout": "subsubsection",  "props": { "title": "小見出し" } }
{ "id": "slide-stmt",  "layout": "statement", "props": { "children": "中央に大きく表示\n改行可" } }
```

- `date: "auto"` で今日の日付を自動挿入
- `section` / `subsection` / `subsubsection` は自動採番（1 / 1.1 / 1.1.1）され `toc` に反映

`content` スライド（最も多用）:
```json
{
  "id": "slide-content",
  "layout": "content",
  "props": { "heading": "スライドタイトル" },
  "children": [],
  "overlays": []
}
```
- `overlays` は省略可

## コンテンツブロック（`content.children` 内）

```json
{ "id": "c-text", "type": "text", "children": "本文。<code>HTML</code>・<strong>強調</strong>・$KaTeX$が使える。" }
{ "id": "c-h3",   "type": "h3",   "children": "小見出し" }
{ "id": "c-div",  "type": "divider" }
```

`text` / `h3` は `"props": { "fontSize": 1.1 }` で文字サイズ調整可（em、省略可）

```json
{ "id": "c-ul", "type": "ul", "items": ["項目1", "項目2（$数式$可）", "項目3"] }
```
`ul` も `"props": { "fontSize": 1.0 }` で調整可（省略可）

### `box` — 6バリアント
```json
{ "id": "c-box-blue",   "type": "box", "props": { "variant": "blue",   "label": "定義"  }, "children": "本文（KaTeX可）" }
{ "id": "c-box-violet", "type": "box", "props": { "variant": "violet", "label": "定理"  }, "children": "本文" }
{ "id": "c-box-cyan",   "type": "box", "props": { "variant": "cyan",   "label": "補題"  }, "children": "本文" }
{ "id": "c-box-green",  "type": "box", "props": { "variant": "green",  "label": "ポイント" }, "children": "本文" }
{ "id": "c-box-amber",  "type": "box", "props": { "variant": "amber",  "label": "例"    }, "children": "本文" }
{ "id": "c-box-red",    "type": "box", "props": { "variant": "red",    "label": "注意"  }, "children": "本文" }
```
追加 props（省略可）: `labelFontSize`（em）, `bodyFontSize`（em）, `width`（px）

### `cols` — 2カラム
```json
{
  "id": "c-cols",
  "type": "cols",
  "props": { "left": 1, "right": 2, "gap": 24 },
  "columns": [
    [ { "id": "c-l", "type": "text", "children": "左カラム" } ],
    [ { "id": "c-r", "type": "text", "children": "右カラム" } ]
  ]
}
```
- `left` / `right`: 列幅の比（整数）。例 `1:2` → 左1fr 右2fr
- `gap`: px（省略可）
- `columns[0]` = 左、`columns[1]` = 右。各カラムは SlideComponent の配列

### `table`
```json
{
  "id": "c-table",
  "type": "table",
  "props": {
    "headers": ["列A", "列B", "列C"],
    "rows": [ ["行1A", "行1B", "行1C"], ["行2A", "行2B", "行2C"] ],
    "fontSize": 0.95
  }
}
```

### `figure` — チャート
```json
{ "id": "c-fig", "type": "figure", "props": { "chartId": "ChartName", "caption": "図の説明", "width": 400, "height": 300 } }
```
- `chartId`: `projects/<project>/charts/<ChartName>.tsx` に定義したコンポーネント名
- `caption` / `width` / `height` は省略可

### `vcenter` — 垂直中央配置
```json
{
  "id": "c-vcenter",
  "type": "vcenter",
  "children": [ { "id": "c-inner", "type": "text", "children": "中央配置" } ]
}
```

## オーバーレイ（`content.overlays` 内）

### `abs-textbox`
```json
{
  "id": "c-ov",
  "type": "abs-textbox",
  "props": { "x": 800, "y": 150, "width": 380, "height": 200, "content": "テキスト。$KaTeX$可。", "borderColor": "blue", "fitToInner": true }
}
```
- `x` / `y`: スライド左上からの絶対座標（px）。スライドサイズは 1280×720
- `borderColor` / `fontSize`（em）/ `fitToInner` は省略可

## ID 命名規則

- スライド: `slide-<名前>` 例: `slide-s1`, `slide-intro`
- ブロック: `c-<名前>` 例: `c-ul-1`, `c-box-def`
- プロジェクト全体で一意にする

## テキスト内マークアップ

- HTMLインライン: `<code>` `<strong>` `<em>` `<br>`
- KaTeX インライン: `$数式$`
- KaTeX ブロック: `$$数式$$`（`\n` で改行）

## よく使うパターン

### テキスト＋箇条書き
```json
{ "id": "c-intro", "type": "text", "children": "概要説明" },
{ "id": "c-ul",    "type": "ul",   "items": ["ポイント1", "ポイント2", "ポイント3"] }
```

### 左：箇条書き、右：ボックス
```json
{
  "id": "c-cols", "type": "cols", "props": { "left": 1, "right": 1 },
  "columns": [
    [ { "id": "c-l-h3", "type": "h3", "children": "手順" },
      { "id": "c-l-ul", "type": "ul", "items": ["ステップ1", "ステップ2"] } ],
    [ { "id": "c-r-box", "type": "box", "props": { "variant": "blue", "label": "定義" }, "children": "$f: \\mathcal{X} \\to \\mathcal{Y}$" } ]
  ]
}
```

### まとめスライド
```json
{
  "id": "slide-summary", "layout": "content", "props": { "heading": "まとめ" },
  "children": [
    { "id": "c-box", "type": "box", "props": { "variant": "green", "label": "まとめ" },
      "children": "・ポイント1\n・ポイント2\n・ポイント3" }
  ]
}
```
