# Model Slots for Claude

[English](README.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Português (Brasil)](README.pt-BR.md) | [Русский](README.ru.md)

一個 Claude 桌面版擴充功能（`.mcpb`）：主模型仍然是官方 Claude，同時可以透過**本機 OpenAI 相容閘道**（預設是 [Magpie](https://github.com/yetone/magpie)，位址 `http://127.0.0.1:3425/v1`）呼叫 DeepSeek、GLM、GPT、Gemini 等第三方模型。用起來像是替 Claude 多加了幾個「模型插槽」，並且盡量節省 Claude 的 token。

> **非官方專案。** 與 Anthropic、Magpie 專案均無關聯，也未獲其認可或支援。「Claude」是 Anthropic 的商標。

## 功能

| 功能 | 說明 |
|---|---|
| **@別名模型插槽** | 訊息以 `@ds`、`@gpt`、`@glm` 等開頭，Claude 就會把它轉給對應模型。每個 Claude 對話各自儲存多輪記錄，存檔後，重新啟動可以接著聊。`@ds @gpt ……` 可以同時詢問多個模型。 |
| **依任務路由** | 通用、程式設計、推理審閱、寫作、翻譯、快速六類任務各配一組模型，失敗時自動換下一個；剛失敗過的模型 10 分鐘內排到最後。 |
| **多模型比較** | 同一個問題並行詢問 2–5 個模型，部分失敗也照常回傳成功的部分。 |
| **檔案模式（省 token）** | 擴充功能直接讀取本機文字檔案、把結果寫回檔案，長文件不經過對話。長文件自動分塊，3 塊並行，失敗的區塊可以單獨繼續處理。 |
| **取回結果** | 取回之前某次回答的全文（包括寫入檔案的長回答），方便 Claude 評論。 |
| **在對話中修改設定** | 增刪別名、修改路由、修改顯示方式，用 `magpie_config` 一句話搞定，不用重新啟動。 |
| **用量統計** | `magpie_status` 顯示最近 7 天各模型的呼叫次數、失敗次數、平均耗時和 token。 |
| **熱更新** | 核心程式碼放在 `文档/Magpie Chat/core/core.mjs`，修改完下一次呼叫就會生效，不用重新安裝；新程式碼出錯時自動沿用上一個可用版本。 |

工具：`magpie_chat`、`magpie_ask`、`magpie_compare`、`magpie_recall`、`magpie_config`、`magpie_list_models`、`magpie_status`。工具名稱的 `magpie_` 前綴是歷史原因，任何 OpenAI 相容閘道都能使用。

## 需要

- Claude 桌面版（Windows 或 macOS），已開啟擴充功能。擴充功能使用 Claude 桌面版內建的 Node.js 執行。
- 一個提供 `/v1/chat/completions` 和 `/v1/models` 的本機 OpenAI 相容閘道，例如 Magpie。
- 第三方模型的費用由閘道背後的供應商收取，不佔用 Claude 訂閱額度。

## 安裝

1. 從 [`dist/`](dist/) 資料夾下載最新的 `magpie-chat-<版本>.mcpb`（點開檔案後點選 **Download raw file**），如果 [Releases](../../releases) 裡有，也可以從那裡下載。
2. 連按兩下安裝，或者拖曳到 Claude 桌面版的「設定 → 擴充功能」。
3. 檢查設定項目：預設模型、各任務的模型、別名（例如 `ds=auto/deepseek-v4.1-flash, gpt=auto/gpt-6.1-sol`），以及檔案模式**允許讀寫的資料夾**。預設的模型 ID 是依照 Magpie 的命名方式寫的，請改成你的閘道中實際存在的 ID。
4. 從系統匣完全退出 Claude，再重新開啟。
5. 開啟一個**新對話**，讓 Claude 呼叫 `magpie_status`，再試試 `@ds 你好`。

## 推薦：配套技能

`skill/magpie-collab/SKILL.md` 規定了 Claude 如何善用這些工具：
- @別名原樣轉發，透過 `context` 傳入背景，嚴格按照顯示說明展示；
- 快捷指令：`#审` 交叉審閱、`#译` 檔案模式翻譯、`#比` 多模型比較、`#稿` 起草→審閱→定稿；
- 什麼時候自動進行交叉審閱；
- 第三方模型的輸出一律視為不可信資料。

把它加入 Claude 的技能中，或者貼到某個專案的指令裡。

## 關於 token 的實話

- 第三方模型的回答要在聊天中顯示，Claude 就得再輸出一次，消耗量和 Claude 自己回答差不多。
- 交叉審閱會**增加** Claude 用量，換來的是品質，不是省錢。
- 真正節省 token 要靠**檔案模式**：長輸入、長輸出都留在硬碟上。
- @別名的長回答會寫入檔案並自動開啟，長度門檻可以調整。

## 安全與隱私

- 檔案模式只能讀寫你允許的資料夾。檢查前先用 `realpath` 解析真實路徑，攔截 `..` 和符號連結逃逸；拒絕二進位檔案和超過 5MB 的檔案；沒有你的同意不會覆寫既有檔案。
- 第三方模型的輸出會被視為不可信資料，技能要求 Claude 不執行其中的任何指令。
- **熱更新會執行 `core/core.mjs`。** 能寫入這個資料夾的程式都能借助本擴充功能執行程式碼，請不要把這個資料夾分享或同步給不信任的人。
- 你的閘道可能經過第三方中轉平台，傳送尚未發表或敏感的資料前請三思。
- 資料都在本機：回答、工作階段、記錄、設定都存在 `文档/Magpie Chat`（`.state` 子資料夾）。

## 已知限制

- 擴充功能的執行提示和配套技能使用簡體中文撰寫；Claude 仍會用你自己的語言回覆你。
- Claude 桌面版的模型選擇器無法加入第三方模型，輸入框也無法做 `@` 自動補全，所以這個擴充功能透過工具和技能來實現。
- 回答無法逐字串流顯示在聊天中。
- 只能在桌面版使用，閘道必須在同一台電腦上。
- 同一個對話中工具說明會被快取，新增工具後必須開啟新對話才能看到。

## 開發

```bash
node tests/selftest.mjs          # 用模拟网关在临时目录里跑 27 项检查
npm i -g @anthropic-ai/mcpb
mcpb validate manifest.json
mcpb pack . magpie-chat.mcpb
```

`server/index.mjs` 是很薄的外殼（stdio 上的 MCP 通訊 + 熱更新），`server/core.mjs` 是全部功能。零相依，Node ≥ 18。

## 讓你的 Claude 自己做一個

一段提示詞，傳給你自己的 Claude，就能從零做出同樣功能的擴充功能，我們踩過的坑也都寫在裡面了：[English](docs/PROMPT.en.md) · [简体中文](docs/PROMPT.zh-CN.md) · [繁體中文](docs/PROMPT.zh-TW.md) · [日本語](docs/PROMPT.ja.md) · [한국어](docs/PROMPT.ko.md) · [Español](docs/PROMPT.es.md) · [Français](docs/PROMPT.fr.md) · [Deutsch](docs/PROMPT.de.md) · [Português (Brasil)](docs/PROMPT.pt-BR.md) · [Русский](docs/PROMPT.ru.md)

## 授權條款

[MIT](LICENSE)