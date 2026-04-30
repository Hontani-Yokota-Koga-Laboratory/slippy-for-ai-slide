# Slippy For AI Slide
AIエージェントでスライドを作成して、作成したものをGUIで編集するためのツール

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
```npm install```

起動
```npm run dev```

