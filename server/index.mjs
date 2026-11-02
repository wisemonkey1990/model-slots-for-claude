#!/usr/bin/env node
// Magpie Chat 外壳（loader）v2
// 只负责 MCP 通信和加载核心代码；核心代码放在“文档\Magpie Chat\core\core.mjs”，
// 文件一变就自动重新加载（热更新），不用重装扩展、不用重启 Claude。
// 外部核心加载失败时，回退到扩展包里自带的核心。

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";

const LOADER_VERSION = "2.0.0";
const HERE = path.dirname(fileURLToPath(import.meta.url));
const BUNDLED_CORE = path.join(HERE, "core.mjs");

function env(name) {
  const v = (process.env[name] || "").trim();
  return v && !v.startsWith("${") ? v : "";
}
const HOME_DIR = env("MAGPIE_CHAT_DIR") || path.join(os.homedir(), "Documents", "Magpie Chat");
const CORE_DIR = env("MAGPIE_CORE_DIR") || path.join(HOME_DIR, "core");
const EXTERNAL_CORE = path.join(CORE_DIR, "core.mjs");

function cmpVersion(a = "0", b = "0") {
  const pa = String(a).split(".").map(Number);
  const pb = String(b).split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return d;
  }
  return 0;
}
function readVersion(file) {
  try {
    const m = fs.readFileSync(file, "utf8").match(/export const VERSION\s*=\s*"([^"]+)"/);
    return m ? m[1] : "0";
  } catch {
    return null;
  }
}

// 外部核心不存在，或比扩展包里自带的旧（说明刚重装了新版扩展），就用自带的覆盖
function seedExternalCore() {
  try {
    const bundledV = readVersion(BUNDLED_CORE);
    const externalV = readVersion(EXTERNAL_CORE);
    if (externalV === null || cmpVersion(bundledV, externalV) > 0) {
      fs.mkdirSync(CORE_DIR, { recursive: true });
      fs.copyFileSync(BUNDLED_CORE, EXTERNAL_CORE);
    }
  } catch {
    /* 写不进去就只用自带核心 */
  }
}

const state = {
  mod: null, // 当前生效的核心模块
  source: null, // "external" | "bundled"
  mtime: 0,
  lastError: "",
  lastReload: null,
};

function loaderInfo() {
  return {
    loaderVersion: LOADER_VERSION,
    coreFile: state.source === "external" ? EXTERNAL_CORE : BUNDLED_CORE,
    coreSource: state.source,
    lastReload: state.lastReload,
    lastError: state.lastError,
    homeDir: HOME_DIR,
  };
}

async function importCore(file, mtime) {
  const mod = await import(pathToFileURL(file).href + `?t=${mtime}`);
  if (typeof mod.call !== "function" || typeof mod.getTools !== "function") throw new Error("核心代码缺少 getTools / call 导出");
  if (typeof mod.init === "function") await mod.init({ argv: process.argv.slice(2), loaderInfo, homeDir: HOME_DIR });
  return mod;
}

let notify = () => {};

async function ensureCore() {
  let st = null;
  try {
    st = fs.statSync(EXTERNAL_CORE);
  } catch {
    /* 没有外部核心 */
  }
  if (st && st.mtimeMs !== state.mtime) {
    const first = !state.mod;
    state.mtime = st.mtimeMs;
    try {
      state.mod = await importCore(EXTERNAL_CORE, st.mtimeMs);
      state.source = "external";
      state.lastError = "";
      state.lastReload = new Date().toISOString();
      if (!first) notify();
    } catch (err) {
      state.lastError = `外部核心加载失败（${new Date().toLocaleString()}）：${err.message}`;
    }
  }
  if (!state.mod) {
    state.mod = await importCore(BUNDLED_CORE, 0);
    state.source = "bundled";
  }
  return state.mod;
}

// ---------- MCP（JSON-RPC over stdio）----------

function send(msg) {
  process.stdout.write(JSON.stringify(msg) + "\n");
}
notify = () => send({ jsonrpc: "2.0", method: "notifications/tools/list_changed" });

async function handle(req) {
  const { id, method, params } = req;
  const isNotification = id === undefined || id === null;
  try {
    let result;
    switch (method) {
      case "initialize":
        await ensureCore();
        result = {
          protocolVersion: params?.protocolVersion || "2025-06-18",
          capabilities: { tools: { listChanged: true } },
          serverInfo: { name: "magpie-chat", version: state.mod?.VERSION || LOADER_VERSION },
        };
        break;
      case "ping":
        result = {};
        break;
      case "tools/list":
        result = { tools: (await ensureCore()).getTools() };
        break;
      case "tools/call": {
        const mod = await ensureCore();
        try {
          let text = await mod.call(params?.name, params?.arguments || {});
          if (state.lastError) text += `\n\n⚠ ${state.lastError}（当前使用：${state.source === "external" ? "上一个可用版本" : "扩展自带版本"}）`;
          result = { content: [{ type: "text", text }] };
        } catch (err) {
          result = { content: [{ type: "text", text: `出错：${err.message}` }], isError: true };
        }
        break;
      }
      default:
        if (isNotification) return;
        send({ jsonrpc: "2.0", id, error: { code: -32601, message: `Method not found: ${method}` } });
        return;
    }
    if (!isNotification) send({ jsonrpc: "2.0", id, result });
  } catch (err) {
    if (!isNotification) send({ jsonrpc: "2.0", id, error: { code: -32603, message: err.message } });
  }
}

seedExternalCore();

let buffer = "";
let queue = Promise.resolve();
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  buffer += chunk;
  let idx;
  while ((idx = buffer.indexOf("\n")) >= 0) {
    const line = buffer.slice(0, idx).trim();
    buffer = buffer.slice(idx + 1);
    if (!line) continue;
    let req;
    try {
      req = JSON.parse(line);
    } catch {
      send({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } });
      continue;
    }
    // initialize / tools/list 按顺序处理；工具调用并发执行
    const reqs = Array.isArray(req) ? req : [req];
    for (const r of reqs) {
      if (r.method === "tools/call") track(queue.then(() => handle(r)));
      else queue = track(queue.then(() => handle(r)));
    }
  }
});

// 输入结束后，等手上的请求都处理完再退出
const pending = new Set();
function track(p) {
  pending.add(p);
  p.finally(() => pending.delete(p));
  return p;
}
process.stdin.on("end", async () => {
  while (pending.size) await Promise.allSettled([...pending]);
  process.exit(0);
});
