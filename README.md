# Model Slots for Claude

[中文说明](README.zh-CN.md)

A Claude Desktop extension (`.mcpb`) that keeps the official Claude as your main model while letting you call third-party models — DeepSeek, GLM, GPT, Gemini and others — through a **local OpenAI-compatible gateway** (default: [Magpie](https://github.com/yetone/magpie) at `http://127.0.0.1:3425/v1`). It feels like adding a few extra "model slots" to Claude, and it is designed to save Claude tokens.

> **Unofficial.** Not affiliated with, endorsed by, or supported by Anthropic or the Magpie project. "Claude" is a trademark of Anthropic.

## What you get

| Feature | How it works |
|---|---|
| **@alias model slots** | Start a message with `@ds`, `@gpt`, `@glm`… and Claude forwards it to that model. Multi-turn history is kept per Claude conversation, saved to disk, and survives restarts. `@ds @gpt …` asks several at once. |
| **Task routing** | `general / code / reasoning / writing / translate / quick` each map to a list of models; on failure the next one is tried, and models that just failed are pushed to the back for 10 minutes. |
| **Multi-model compare** | Same question to 2–5 models in parallel; partial failures still return the successful answers. |
| **File mode (saves tokens)** | The extension reads local text files and writes results back to files, so long documents never pass through the conversation. Long documents are chunked (3 in parallel) and failed chunks can be resumed. |
| **Recall** | Fetch the full text of an earlier answer (including long answers saved to files) so Claude can review it. |
| **Live config** | Add/remove aliases, change routes or display mode from the chat (`magpie_config`) — no restart needed. |
| **Usage stats** | `magpie_status` shows calls, failures, average latency and tokens per model for the last 7 days. |
| **Hot reload** | The core code lives in `Documents/Magpie Chat/core/core.mjs`; edits take effect on the next call without reinstalling. If new code fails to load, the last working version keeps running. |

Tools: `magpie_chat`, `magpie_ask`, `magpie_compare`, `magpie_recall`, `magpie_config`, `magpie_list_models`, `magpie_status`. (The `magpie_` prefix is historical; any OpenAI-compatible gateway works.)

## Requirements

- Claude Desktop (Windows or macOS) with extensions enabled. The extension runs on Claude Desktop's bundled Node.js.
- A local OpenAI-compatible gateway that serves `/v1/chat/completions` and `/v1/models`, e.g. Magpie.
- Third-party usage is billed by whatever providers your gateway uses, not by your Claude plan.

## Install

1. Download the latest `magpie-chat-<version>.mcpb` from the [`dist/`](dist/) folder (click the file, then **Download raw file**), or from [Releases](../../releases) if available.
2. Double-click it (or drag it into Claude Desktop → Settings → Extensions).
3. Review the settings: default model, per-task models, aliases (e.g. `ds=auto/deepseek-v4.1-flash, gpt=auto/gpt-6.1-sol`), and **allowed folders** for file mode. The default model IDs follow Magpie's naming — change them to IDs your gateway lists.
4. Fully quit Claude from the system tray and reopen it.
5. In a **new** conversation, ask Claude to run `magpie_status`, then try `@ds hello`.

## Recommended: the companion skill

`skill/magpie-collab/SKILL.md` teaches Claude how to use the tools well: forward `@alias` messages verbatim, pass background via `context`, follow display instructions, shortcut commands (`#审` review, `#译` translate, `#比` compare, `#稿` draft→review→finalize), when to auto-trigger cross-review, and to treat third-party output as untrusted. Add it to Claude as a skill (or paste it into a Project's instructions).

## Token reality check

- If a third-party answer is shown in the chat, Claude has to output it again — that costs about as much as Claude answering itself.
- Cross-review **adds** Claude usage; it buys quality, not savings.
- The real savings come from **file mode**: long inputs and outputs stay on disk.
- Long `@alias` answers are written to files and opened automatically (threshold configurable).

## Security & privacy

- File mode only reads/writes inside the folders you allow. Paths are resolved with `realpath` before checking, blocking `..` and symlink escapes; binary files and files over 5 MB are rejected; existing files are never overwritten unless you say so.
- Output from third-party models is treated as untrusted data; the skill tells Claude never to follow instructions found in it.
- **Hot reload executes `core/core.mjs`.** Anything that can write to that folder can run code through this extension. Don't share or sync that folder with untrusted parties.
- Your gateway may route through third-party relays. Think before sending unpublished or sensitive material.
- Data stays local: replies, sessions, logs and config live in `Documents/Magpie Chat` (`.state` subfolder).

## Known limits

- Claude Desktop's model picker can't list third-party models, and the input box can't autocomplete `@`. This extension works through tools + a skill instead.
- Answers can't stream into the chat.
- Desktop only (needs the local gateway on the same machine).
- Tool descriptions are cached per conversation — open a new conversation after updates that add tools.

## Development

```bash
node tests/selftest.mjs          # 27 checks against a mock gateway, in a temp dir
npm i -g @anthropic-ai/mcpb
mcpb validate manifest.json
mcpb pack . magpie-chat.mcpb
```

`server/index.mjs` is a thin loader (MCP over stdio + hot reload); `server/core.mjs` holds all features. Zero dependencies, Node ≥ 18.

## Build your own with Claude

[`docs/PROMPT.zh-CN.md`](docs/PROMPT.zh-CN.md) is a prompt (in Chinese) you can give to your own Claude to build an equivalent extension from scratch, including the pitfalls we hit.

## License

[MIT](LICENSE)
