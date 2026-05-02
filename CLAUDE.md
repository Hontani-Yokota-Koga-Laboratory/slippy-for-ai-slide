# ai-slide

React + TypeScript でスライドを作成・編集するシステム。
スライドデータは JSON 形式で保存され、D3.js や KaTeX を活用した高度な表現が可能。

## トークン効率と開発原則

Claude Code や Gemini CLI 等の AI ツールを使用する際、トークン消費を抑えつつ正確な編集を行うための最重要原則です。

1.  **ファイルの小規模化**: 1ファイルは100行程度を目安にします。詳細は `architecture.md` を参照。
2.  **サージカル（外科的）インデックス**: `_index.json` を使い、`slides.json` の必要なスライド行のみを読み書きしてください。詳細な手順は `AGENT.md` を参照。
3.  **状態管理の分離**: ロジックは `hooks/` や `utils/` に分離し、UIコンポーネントを軽量に保ちます。

### スライド作成時の参照ドキュメント

スライドの JSON を書く際は、ソースコードや既存ファイルを探索する前に以下を参照してください：

- **`SCHEMA.md`**: 全レイアウト・全ブロックの props 定義（型・説明・使用例付き）
- **`SNIPPETS.md`**: そのままコピーして使える JSON テンプレート集

## ディレクトリ構造

詳細は `architecture.md` を参照してください。

- `src/`: React アプリケーションのソースコード
- `projects/`: スライドプロジェクトデータ
- `server/`: Vite プラグイン形式の API サーバー
- `architecture.md`: アーキテクチャ詳細とAI最適化ガイドライン

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

スキーマ・全 props・コピー用 JSON テンプレートは **`SCHEMA.md`** を参照。
