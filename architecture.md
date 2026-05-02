# プロジェクト構成 (Architecture)

AI（Claude Code, Gemini CLI等）による効率的な開発をサポートするため、本プロジェクトの構成と開発ガイドラインを以下にまとめます。

## ディレクトリ構成

- `src/`: React + TypeScript フロントエンド
  - `editor/`: エディタ UI コンポーネント（1ファイル100行程度を目安に分割）
  - `components/`: スライド描画用コンポーネント
    - `slides/`: スライド全体のレイアウト（タイトル、コンテンツ等）
    - `blocks/`: スライド内の各ブロック（ボックス、カラム等）
    - `overlays/`: 重ね合わせコンポーネント（絶対座標テキスト等）
  - `charts/`: D3.js チャートの実装とレジストリ
  - `hooks/`: ロジックを分離したカスタムフック
  - `utils/`: 純粋関数や共通ロジック
  - `context/`: グローバル状態管理用の React Context
  - `themes/`: CSS テーマ
- `projects/`: スライドデータとプロジェクト固有の資産
  - 各プロジェクトには `slides.json` (データ) と `_index.json` (行番号インデックス) が含まれます。
- `server/`: Vite プラグイン形式のバックエンドAPI（保存、PDF出力）
- `scripts/`: メンテナンス用スクリプト（インデックス更新、PDF生成）

## AI 効率化のための原則

1. **ファイルサイズの制限**: 1ファイルあたり100〜150行以内に抑える。大規模なコンポーネントは、サブコンポーネントやカスタムフックに分割する。
2. **サージカル（外科的）編集**: `projects/` 内の `_index.json` を活用し、`slides.json` の特定の行のみを読み書きする。巨大な JSON 全体を読み込むことを避ける。
3. **ロジックとUIの分離**: ビジネスロジックは `hooks/` や `utils/` に配置し、`App.tsx` や UI コンポーネントはレイアウトとイベント処理に専念させる。

## データフロー

1. `App.tsx` が `hooks/useAppLogic.ts` 等を利用して状態を初期化。
2. `/api/projects/:project/slides` からスライドデータを取得。
3. `SlideRenderer` がレイアウトに応じたコンポーネントを選択。
4. `ContentSlide` 内で `ComponentRenderer` がブロックを再帰的に描画。
5. 編集内容は `App.tsx` (または `hooks/`) のミューテーション関数を通じて更新され、サーバーに保存される。
