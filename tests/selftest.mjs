// Magpie Chat 自测：不需要真的 Magpie，用模拟网关跑一遍主要功能。
// 用法：node tests/selftest.mjs        （在扩展目录或任意位置运行均可）
// 全部在临时目录里进行，不会碰你的真实文件和配置。

import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LOADER = path.join(ROOT, "server", "index.mjs");
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "magpie-selftest-"));
const WORK = path.join(TMP, "work");
const HOME = path.join(TMP, "home");
fs.mkdirSync(WORK, { recursive: true });
fs.mkdirSync(path.join(TMP, "outside"), { recursive: true });
fs.writeFileSync(path.join(TMP, "outside", "secret.txt"), "secret");

// ---------- 模拟网关 ----------
let flaky = new Set();
const server = http.createServer((req, res) => {
  let b = "";
  req.on("data", (c) => (b += c));
  req.on("end", () => {
    res.setHeader("content-type", "application/json");
    if (req.url === "/v1/models") return res.end(JSON.stringify({ data: ["auto/a", "auto/b", "auto/c"].map((id) => ({ id })) }));
    const j = JSON.parse(b || "{}");
    if (j.model.startsWith("dead/")) {
      res.statusCode = 401;
      return res.end('{"error":{"message":"key disabled"}}');
    }
    const last = j.messages.at(-1).content;
    const m = last.match(/第 (\d+)\/(\d+) 部分/);
    if (m && flaky.has(+m[1])) {
      res.statusCode = 502;
      return res.end('{"error":{"message":"flaky"}}');
    }
    const sys = j.messages.find((x) => x.role === "system")?.content || "";
    const users = j.messages.filter((x) => x.role === "user").length;
    const content = m ? `[块${m[1]}]` : last.includes("长") ? "长".repeat(3000) : `ok users=${users} ctx=${sys.includes("背景资料") ? 1 : 0}`;
    res.end(JSON.stringify({ model: j.model, choices: [{ message: { content }, finish_reason: "stop" }], usage: { prompt_tokens: 3, completion_tokens: 2 } }));
  });
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const PORT = server.address().port;

// ---------- 启动扩展 ----------
function start() {
  const p = spawn(process.execPath, [LOADER, WORK], {
    stdio: ["pipe", "pipe", "inherit"],
    env: {
      PATH: process.env.PATH,
      HOME,
      USERPROFILE: HOME,
      MAGPIE_BASE_URL: `http://127.0.0.1:${PORT}/v1`,
      MAGPIE_CHAT_DIR: path.join(TMP, "chat"),
      MAGPIE_CHAT_OPEN_FILES: "false",
      MAGPIE_ALIASES: "a=auto/a, dd=dead/x|auto/b",
      MAGPIE_MODEL_TRANSLATE: "auto/c",
    },
  });
  let buf = "";
  const waiters = new Map();
  let nextId = 1;
  const notes = [];
  p.stdout.on("data", (d) => {
    buf += d;
    let i;
    while ((i = buf.indexOf("\n")) >= 0) {
      const msg = JSON.parse(buf.slice(0, i));
      buf = buf.slice(i + 1);
      if (msg.id && waiters.has(msg.id)) waiters.get(msg.id)(msg);
      else if (msg.method) notes.push(msg.method);
    }
  });
  const rpc = (method, params) =>
    new Promise((r) => {
      const id = nextId++;
      waiters.set(id, r);
      p.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
    });
  const call = async (name, args) => {
    const r = await rpc("tools/call", { name, arguments: args });
    return { text: r.result.content[0].text, err: !!r.result.isError };
  };
  return { p, rpc, call, notes };
}

let pass = 0;
let fail = 0;
function check(name, cond, detail = "") {
  if (cond) {
    pass++;
    console.log(`  ✓ ${name}`);
  } else {
    fail++;
    console.log(`  ✗ ${name}${detail ? "\n      " + String(detail).slice(0, 300).replace(/\n/g, " | ") : ""}`);
  }
}
const sid = (t) => (t.match(/session_id: (\S+?)，/) || [])[1];

try {
  let x = start();
  await x.rpc("initialize", { protocolVersion: "2025-06-18" });
  const tools = (await x.rpc("tools/list", {})).result.tools.map((t) => t.name);
  console.log("工具列表");
  check("7 个工具齐全", ["magpie_chat", "magpie_ask", "magpie_compare", "magpie_recall", "magpie_config", "magpie_list_models", "magpie_status"].every((n) => tools.includes(n)), tools);

  console.log("@别名会话");
  let r = await x.call("magpie_chat", { alias: "a", message: "你好", new_session: true });
  const A = sid(r.text);
  check("新会话", !r.err && r.text.includes("users=1"), r.text);
  r = await x.call("magpie_chat", { alias: "a", message: "第二句", session_id: A });
  check("同会话接着聊", r.text.includes("users=2"), r.text);
  r = await x.call("magpie_chat", { alias: "a", message: "另一个对话", new_session: true });
  const B = sid(r.text);
  check("另一个对话互不干扰", r.text.includes("users=1") && A !== B, r.text);
  r = await x.call("magpie_chat", { alias: "a", message: "带背景", session_id: B, context: "这是背景" });
  check("背景资料单独传入", r.text.includes("ctx=1"), r.text);
  r = await x.call("magpie_chat", { alias: "a", message: "写个长的", session_id: B });
  check("长回答写入文件", r.text.includes("已写入"), r.text);
  r = await x.call("magpie_chat", { alias: "dd", message: "hi", new_session: true });
  check("首选模型失败自动换备用", r.text.includes("auto/b") && r.text.includes("前面失败"), r.text);
  r = await x.call("magpie_chat", { alias: "dd", message: "再来", session_id: sid(r.text) });
  check("刚失败的模型被暂时跳过", r.text.includes("暂时跳过"), r.text);

  console.log("调取结果");
  r = await x.call("magpie_recall", { alias: "a" });
  check("按别名取回最近回答（含文件里的长回答）", r.text.includes("长长长"), r.text);

  console.log("重启后会话还在");
  x.p.stdin.end();
  await new Promise((res) => x.p.on("exit", res));
  x = start();
  await x.rpc("initialize", {});
  r = await x.call("magpie_chat", { alias: "a", message: "重启后", session_id: A });
  check("重启后接着聊", r.text.includes("users=3"), r.text);

  console.log("对话里改配置");
  r = await x.call("magpie_config", { action: "set_alias", name: "hy", models: "auto/c|auto/a" });
  check("新增别名立即生效", !r.err, r.text);
  r = await x.call("magpie_config", { action: "set_alias", name: "zz", models: "nope/x" });
  check("不存在的模型会提醒", r.text.includes("没有"), r.text);
  r = await x.call("magpie_chat", { alias: "hy", message: "hi", new_session: true });
  check("新别名可用", r.text.includes("auto/c"), r.text);
  r = await x.call("magpie_config", { action: "set_route", name: "quick", models: "auto/b" });
  r = await x.call("magpie_ask", { prompt: "短问题" });
  check("改路由立即生效", r.text.includes("auto/b"), r.text);
  await x.call("magpie_config", { action: "reset" });

  console.log("文件模式");
  fs.writeFileSync(path.join(WORK, "doc.md"), Array.from({ length: 5 }, (_, i) => `第${i + 1}段` + "内容".repeat(200)).join("\n\n"));
  r = await x.call("magpie_ask", { prompt: "x", input_files: [path.join(TMP, "outside", "secret.txt")] });
  check("白名单外的文件被拒", r.err && r.text.includes("不在允许"), r.text);
  r = await x.call("magpie_ask", { prompt: "x", output_file: path.join(WORK, "..", "outside", "pwn.txt") });
  check("用 .. 跳出白名单被拒", r.err, r.text);
  try {
    fs.symlinkSync(path.join(TMP, "outside"), path.join(WORK, "link"));
    r = await x.call("magpie_ask", { prompt: "x", input_files: [path.join(WORK, "link", "secret.txt")] });
    check("借符号链接跳出白名单被拒", r.err, r.text);
  } catch {
    console.log("  - 跳过符号链接测试（当前系统不允许创建）");
  }
  flaky = new Set([2, 4]);
  const args = { prompt: "翻译", task: "translate", input_files: [path.join(WORK, "doc.md")], chunk_chars: 450, output_file: path.join(WORK, "out.md"), preview_chars: 0 };
  r = await x.call("magpie_ask", args);
  check("分块部分失败时保留成功部分", r.text.includes("仍有 2 块失败"), r.text);
  fs.appendFileSync(path.join(WORK, "out.md"), "\n我手动改了一句");
  flaky = new Set();
  r = await x.call("magpie_ask", { ...args, resume: true });
  check("输出文件被手动改过时，续做会先停下", r.err && r.text.includes("被修改过"), r.text);
  r = await x.call("magpie_ask", { ...args, resume: true, overwrite: true });
  const out = fs.readFileSync(path.join(WORK, "out.md"), "utf8");
  check("续做只重做失败的块", r.text.includes("本次重做 2 块") && out.includes("[块2]") && out.includes("[块4]"), r.text);
  check("没有残留临时文件", !fs.readdirSync(WORK).some((f) => f.endsWith(".tmp") || f.endsWith(".progress.json")));

  console.log("多模型对比");
  r = await x.call("magpie_compare", { prompt: "比一比", models: ["a", "auto/c"] });
  check("别名和模型 ID 混用", r.text.includes("同时询问了 2 个模型"), r.text);

  console.log("状态与日志");
  r = await x.call("magpie_status", {});
  check("状态里有用量统计", r.text.includes("最近 7 天调用") && r.text.includes("auto/a"), r.text);

  console.log("热更新");
  const coreFile = path.join(TMP, "chat", "core", "core.mjs");
  check("外部核心文件已生成", fs.existsSync(coreFile));
  const orig = fs.readFileSync(coreFile, "utf8");
  fs.writeFileSync(coreFile, orig.replace('return `共 ${ids.length} 个模型', 'return `【热更新生效】共 ${ids.length} 个模型'));
  await new Promise((res) => setTimeout(res, 50));
  r = await x.call("magpie_list_models", {});
  check("改了核心文件，下一次调用就生效", r.text.includes("热更新生效"), r.text);
  check("通知 Claude 工具列表有变", x.notes.includes("notifications/tools/list_changed"), x.notes);
  fs.writeFileSync(coreFile, "this is not valid javascript (((");
  await new Promise((res) => setTimeout(res, 50));
  r = await x.call("magpie_list_models", {});
  check("新核心有语法错误时，继续用上一个可用版本并提示", r.text.includes("热更新生效") && r.text.includes("加载失败"), r.text);
  fs.writeFileSync(coreFile, orig);
  x.p.stdin.end();
} finally {
  server.close();
  fs.rmSync(TMP, { recursive: true, force: true });
}

console.log(`\n结果：${pass} 项通过，${fail} 项失败`);
process.exit(fail ? 1 : 0);
