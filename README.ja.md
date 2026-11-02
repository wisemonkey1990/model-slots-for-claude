# Model Slots for Claude

[English](README.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Português (Brasil)](README.pt-BR.md) | [Русский](README.ru.md)

Claude Desktop の拡張機能（`.mcpb`）です。公式の Claude をメインモデルとして使いながら、**ローカルの OpenAI 互換ゲートウェイ**（デフォルトでは [Magpie](https://github.com/yetone/magpie) の `http://127.0.0.1:3425/v1`）を通じて、DeepSeek、GLM、GPT、Gemini などのサードパーティモデルを呼び出せます。Claude にいくつかの追加の「モデルスロット」を加えるような使い心地で、Claude のトークンを節約できるよう設計されています。

> **非公式です。** Anthropic または Magpie プロジェクトとは提携しておらず、承認やサポートも受けていません。「Claude」は Anthropic の商標です。

## 利用できる機能

| 機能 | 仕組み |
|---|---|
| **@alias モデルスロット** | メッセージの先頭に `@ds`、`@gpt`、`@glm`…を付けると、Claude がそのモデルに転送します。複数ターンの履歴は Claude の会話ごとに保持され、ディスクに保存されるため、再起動後も利用できます。`@ds @gpt …` と指定すると、複数のモデルに同時に尋ねられます。 |
| **タスクルーティング** | `general / code / reasoning / writing / translate / quick` はそれぞれモデルのリストに対応しています。失敗した場合は次のモデルが試され、直前に失敗したモデルは 10 分間、リストの後ろに回されます。 |
| **複数モデル比較** | 同じ質問を 2～5 個のモデルに並列で送信します。一部が失敗しても、成功した回答は返されます。 |
| **ファイルモード（トークンを節約）** | 拡張機能がローカルのテキストファイルを読み取り、結果をファイルに書き戻すため、長いドキュメントが会話を通過することはありません。長いドキュメントは分割され（3 件を並列処理）、失敗したチャンクは再開できます。 |
| **再取得** | 以前の回答の全文（ファイルに保存された長い回答を含む）を取得し、Claude が確認できるようにします。 |
| **ライブ設定** | チャットからエイリアスの追加・削除、ルートや表示モードの変更を行えます（`magpie_config`）。再起動は不要です。 |
| **利用統計** | `magpie_status` で、過去 7 日間のモデルごとの呼び出し回数、失敗回数、平均レイテンシー、トークン数を確認できます。 |
| **ホットリロード** | コアコードは `Documents/Magpie Chat/core/core.mjs` にあります。編集内容は再インストールなしで次回の呼び出しから反映されます。新しいコードの読み込みに失敗した場合は、最後に動作していたバージョンが実行され続けます。 |

ツール: `magpie_chat`、`magpie_ask`、`magpie_compare`、`magpie_recall`、`magpie_config`、`magpie_list_models`、`magpie_status`。（`magpie_` プレフィックスは歴史的なもので、任意の OpenAI 互換ゲートウェイを利用できます。）

## 必要条件

- 拡張機能が有効になっている Claude Desktop（Windows または macOS）。拡張機能は Claude Desktop に同梱された Node.js で実行されます。
- `/v1/chat/completions` と `/v1/models` を提供するローカルの OpenAI 互換ゲートウェイ（Magpie など）。
- サードパーティの利用料金は Claude のプランではなく、ゲートウェイが利用する各プロバイダーによって請求されます。

## インストール

1. [`dist/`](dist/) フォルダーから最新の `magpie-chat-<version>.mcpb` をダウンロードします（ファイルをクリックして **Download raw file** を選択します）。利用可能な場合は [Releases](../../releases) からもダウンロードできます。
2. ファイルをダブルクリックするか、Claude Desktop → Settings → Extensions にドラッグします。
3. 設定を確認します。デフォルトモデル、タスクごとのモデル、エイリアス（例: `ds=auto/deepseek-v4.1-flash, gpt=auto/gpt-6.1-sol`）、ファイルモードで使用する **許可したフォルダー** を設定できます。デフォルトのモデル ID は Magpie の命名規則に従っています。ゲートウェイが一覧表示する ID に変更してください。
4. システムトレイから Claude を完全に終了し、再度開きます。
5. **新しい**会話で、Claude に `magpie_status` を実行するよう依頼し、その後 `@ds hello` を試します。

## 推奨: 付属スキル

`skill/magpie-collab/SKILL.md` は、ツールを適切に使う方法を Claude に教えます。`@alias` メッセージをそのまま転送すること、`context` を使って背景情報を渡すこと、表示指示に従うこと、ショートカットコマンド（`#审` レビュー、`#译` 翻訳、`#比` 比較、`#稿` 下書き→レビュー→確定）、クロスレビューを自動的に開始するタイミング、サードパーティの出力を信頼できないものとして扱うことなどが含まれます。これをスキルとして Claude に追加するか、Project の指示に貼り付けてください。

## トークンについての現実的な確認

- サードパーティモデルの回答をチャットに表示すると、Claude はそれをもう一度出力する必要があるため、Claude 自身が回答する場合とほぼ同じコストがかかります。
- クロスレビューでは Claude の利用量が**増えます**。節約ではなく、品質向上のための機能です。
- 実際に節約できるのは**ファイルモード**です。長い入力と出力がディスク上に保持されます。
- 長い `@alias` の回答はファイルに書き込まれ、自動的に開かれます（しきい値は設定可能です）。

## セキュリティとプライバシー

- ファイルモードは、許可したフォルダー内だけを読み書きします。確認前に `realpath` でパスを解決し、`..` やシンボリックリンクによる脱出を防ぎます。バイナリファイルと 5 MB を超えるファイルは拒否され、既存のファイルは明示的に許可しない限り上書きされません。
- サードパーティモデルの出力は信頼できないデータとして扱われます。スキルは、そこに含まれる指示に Claude が従わないようにします。
- **ホットリロードでは `core/core.mjs` が実行されます。** そのフォルダーに書き込めるものは、この拡張機能を通じてコードを実行できる可能性があります。そのフォルダーを信頼できない相手と共有または同期しないでください。
- ゲートウェイがサードパーティのリレーを経由する場合があります。未公開の情報や機密性の高い内容を送信する前に、よく検討してください。
- データはローカルに保持されます。返信、セッション、ログ、設定は `Documents/Magpie Chat`（`.state` サブフォルダー）に保存されます。

## 既知の制限

- 拡張機能の実行時メッセージと付属スキルは簡体字中国語で書かれていますが、Claude は使用している言語で回答します。
- Claude Desktop のモデル選択にはサードパーティモデルを一覧表示できず、入力ボックスでは `@` のオートコンプリートもできません。この拡張機能は代わりにツールとスキルを通じて動作します。
- 回答をチャットにストリーミングすることはできません。
- デスクトップのみ対応です（同じマシン上でローカルゲートウェイを実行する必要があります）。
- ツールの説明は会話ごとにキャッシュされます。ツールを追加する更新を行った後は、新しい会話を開いてください。

## 開発

```bash
node tests/selftest.mjs          # 27 checks against a mock gateway, in a temp dir
npm i -g @anthropic-ai/mcpb
mcpb validate manifest.json
mcpb pack . magpie-chat.mcpb
```

`server/index.mjs` は薄いローダー（stdio 経由の MCP + ホットリロード）で、`server/core.mjs` にすべての機能が含まれています。依存関係はなく、Node ≥ 18 が必要です。

## Claude で独自に構築する

自分の Claude に渡して、問題点も含めて同等の拡張機能をゼロから構築させるためのプロンプトです。[English](docs/PROMPT.en.md) · [简体中文](docs/PROMPT.zh-CN.md) · [繁體中文](docs/PROMPT.zh-TW.md) · [日本語](docs/PROMPT.ja.md) · [한국어](docs/PROMPT.ko.md) · [Español](docs/PROMPT.es.md) · [Français](docs/PROMPT.fr.md) · [Deutsch](docs/PROMPT.de.md) · [Português (Brasil)](docs/PROMPT.pt-BR.md) · [Русский](docs/PROMPT.ru.md)

## ライセンス

[MIT](LICENSE)