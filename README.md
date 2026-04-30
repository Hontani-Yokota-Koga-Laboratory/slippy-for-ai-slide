# Slippy For AI Slide
AIエージェントでスライドを作成して、作成したものをGUIで編集するためのツール
- Claude Code などのAIエージェントにスライドを生成させる（HTML/CSSベース）
- GUIでスライドを確認し、編集する
- 完成したらPDFで出力
<img width="1919" height="971" alt="image" src="https://github.com/user-attachments/assets/8db835b9-fe07-41b0-8f56-8b7709058298" />


# Usage

## AIにスライドを書かせる
`CLAUDE.md` と `AGENT.md` が用意してあります。
Claude CodeとかGemini CLIを用いる場合は良いですが、他のエージェントを用いる場合、`CLAUDE.md`をコピーして使ってください。

その後は、好きなAI Agentに「新しいプロジェクトでスライドを作ってほしい」と命令してください。

## GUIでの確認 & 編集 & PDF出力

### Dependencies
- `node.js`

### Set Up
初回のみ
``` bash:
npm install
```

起動
``` bash:
npm run dev
```

### UI
| UI | 説明 |
| ---- | ---- |
|<img width="1918" height="910" alt="image" src="https://github.com/user-attachments/assets/13657822-11a4-41ec-be0c-e398769acc16" />|コンポーネントツリーを表示。ここで操作することで、スライドに要素を追加できる。|
|<img width="1918" height="910" alt="image" src="https://github.com/user-attachments/assets/21a05966-568d-49c6-8c59-353244eac1d4" />|スライド本体。要素を選択することで、右側のサイドバーに要素の詳細を表示・編集できる。|
|<img width="1918" height="908" alt="image" src="https://github.com/user-attachments/assets/2eaa753a-6f2c-4ca0-9281-fc72a890ccec" />|スライドコンポーネントの編集。テキストの内容や、要素のサイズなど、要素に応じた編集ができる。|


# 仕組みの概要

本プロジェクトは、Reactを用いたコンポーネントベースのスライド生成・編集ツールです。
**React + Vite** を採用しており、事前定義されたコンポーネントを組み合わせることでスライドを生成しています。

スライドの実態は `slide.json` であり、コンポーネントの名前と変数を羅列しています。
これを編集してもいいですが、スライドの追加やコンポーネントの追加はバグりやすいので、人の手でやることはおすすめしません。
GUIでは、この`slide.json`を読み込み、編集を自動で行っています。

また `D3.js + KaTeX` での図の描画にも対応しています。
サンプルは起動後、 `example`プロジェクト を参照してください。
