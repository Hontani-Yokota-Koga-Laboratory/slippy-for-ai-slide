# ai-slide

React + TypeScript でスライドを作成・編集するシステム。
スライドデータは JSON 形式で保存され、D3.js や KaTeX を活用した高度な表現が可能。

## ディレクトリ構成

- `src/`: React アプリケーションのソースコード
  - `components/`: スライドおよび各ブロックのコンポーネント
  - `charts/`: D3.js チャートコンポーネント
  - `editor/`: スライド編集 UI
- `projects/`: 各スライドプロジェクト。各フォルダに `slides.json` を配置。
- `server/`: Vite プラグイン形式の API サーバー（ファイル保存・PDF生成）
- `past/`: 過去のプロジェクト（参照用。直接編集しない）

## コマンド

```bash
npm install     # 依存関係のインストール
npm run dev     # 開発サーバー起動（エディタ・プレビュー）
npm run build   # ビルド
```

## ワークフロー

1. **新規プロジェクト作成**: `projects/` 内に新しいディレクトリを作り、既存の `slides.json` をコピーして開始。
2. **編集**: ブラウザで `http://localhost:5173/?project=my-project` にアクセスし、エディタで内容を編集。
3. **保存**: エディタの保存ボタンで `projects/my-project/slides.json` が更新される。
4. **PDF出力**: エディタ上の「Download PDF」ボタンをクリック。

## コンポーネント定義

### スライドレイアウト (`layout`)

- `title`: タイトルスライド
- `toc`: 目次（自動生成）
- `section` / `subsection` / `subsubsection`: セクション見出し（自動採番）
- `content`: コンテンツスライド
- `statement`: 中央に大きなテキストを表示

### コンテンツブロック (`type`)

`content` レイアウトの `children` 内で使用：

- `text`: 通常のテキスト（Markdownライクな一部HTMLタグ可、KaTeX対応）
- `ul`: 箇条書き
- `box`: 枠付きボックス (`variant`: blue, violet, cyan, green, amber, red)
- `cols`: カラムレイアウト (`props.left`, `props.right` で比率指定)
- `figure`: D3 チャート描画 (`props.chartId` で指定)
- `table`: テーブル
- `divider`: 区切り線
- `h3`: 小見出し
