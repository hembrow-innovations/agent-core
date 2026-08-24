#!/usr/bin/env node
/**
 * Live pi-coms scenario. Install playground first:
 *   pnpm exec agentic-core install playground --profile pi
 * Then:
 *   node scripts/run-pi-coms-larder.mjs --smoke
 *   node scripts/run-pi-coms-larder.mjs
 */
import { spawn, spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PLAY = join(ROOT, "playground");
const RUN = join(PLAY, "run");
const LARDER = join(PLAY, "larder");
const COMS = join(PLAY, ".coms");
const PROJECT = "larder";
const MODEL = process.env.PI_COMS_MODEL || "grok-4.6";
const THINKING = process.env.PI_COMS_THINKING || "medium";
const SMOKE = process.argv.includes("--smoke");

const JOINER_PROMPT = `You are joiner. You write the pantry CLI in larder/. Stay in this session.

When a peer messages you, do the work they ask. Write application files only under larder/. Do not edit .pi/, run/, or .coms/.

Reply with what you built and how to run it. Stay ready after you answer.`;

const INSPECTOR_PROMPT = `You are inspector. You review code. You do not rewrite the app.

When a peer messages you, read the files they point at, run them if you can, and reply with bugs or "ship it" plus the command output you saw.

Stay in this session. Stay ready after you answer.`;

const MASON_PROMPT = `You are mason. You plan. Do not write application files under larder/.

A living peer named joiner implements. A living peer named inspector reviews.

First action: use coms_list. Then coms_send this job to joiner, then coms_await the reply.

Job for joiner:
In larder/, build a Node pantry CLI with no dependencies.
Commands:
  node larder/larder.mjs add <name> <qty> [yyyy-mm-dd]
  node larder/larder.mjs list
  node larder/larder.mjs use <name> <qty>
Store state in larder/larder.json.
After add oats 2 2026-12-01, add rice 1, use oats 1, list must show oats 1 and rice 1.

After joiner replies, coms_send inspector the larder/ path and ask them to review and run those commands. coms_await inspector.

If inspector finds a real bug, coms_send joiner a fix request and coms_await again.

Then tell me what shipped and the exact commands to run.`;

function nowIso() {
  return new Date().toISOString();
}

function log(line) {
  const text = `[${nowIso()}] ${line}`;
  console.error(text);
  mkdirSync(RUN, { recursive: true });
  writeFileSync(join(RUN, "harness.log"), `${text}\n`, { flag: "a" });
}

function snapshotRegistry(label) {
  const dir = join(COMS, "projects", PROJECT, "agents");
  const snap = { ts: nowIso(), label, agents: [] };
  if (existsSync(dir)) {
    for (const file of readdirSync(dir)) {
      if (!file.endsWith(".json")) continue;
      try {
        snap.agents.push(JSON.parse(readFileSync(join(dir, file), "utf8")));
      } catch {
        snap.agents.push({ file, error: "unreadable" });
      }
    }
  }
  writeFileSync(
    join(RUN, `registry-${label}.json`),
    `${JSON.stringify(snap, null, 2)}\n`,
  );
  return snap;
}

function extractToolCalls(jsonlPath) {
  if (!existsSync(jsonlPath)) return [];
  const calls = [];
  for (const line of readFileSync(jsonlPath, "utf8").split("\n")) {
    if (!line) continue;
    let ev;
    try {
      ev = JSON.parse(line);
    } catch {
      continue;
    }
    if (ev.type === "tool_execution_start") {
      calls.push({
        tool: ev.toolName,
        args: ev.args ?? ev.input ?? null,
      });
    }
  }
  return calls;
}

class RpcSession {
  constructor(opts) {
    this.name = opts.name;
    this.purpose = opts.purpose;
    this.cwd = opts.cwd;
    this.lines = [];
    this.waiters = [];
    this.pending = new Map();
    this.seq = 0;
    this.child = null;
    this.stdoutPath = join(RUN, `${this.name}.stdout.jsonl`);
    this.stderrPath = join(RUN, `${this.name}.stderr.log`);
    this.buf = "";
  }

  start() {
    mkdirSync(RUN, { recursive: true });
    writeFileSync(this.stdoutPath, "");
    writeFileSync(this.stderrPath, "");
    const sessionDir = join(RUN, "sessions", this.name);
    mkdirSync(sessionDir, { recursive: true });
    const args = [
      "--mode",
      "rpc",
      "--approve",
      "--provider",
      "xai",
      "--model",
      MODEL,
      "--thinking",
      THINKING,
      "--name",
      this.name,
      "--session-dir",
      sessionDir,
      "--cname",
      this.name,
      "--purpose",
      this.purpose,
      "--project",
      PROJECT,
    ];
    this.child = spawn("pi", args, {
      cwd: this.cwd,
      env: {
        ...process.env,
        PI_COMS_DIR: COMS,
        PI_COMS_TIMEOUT_MS: process.env.PI_COMS_TIMEOUT_MS || "900000",
      },
      stdio: ["pipe", "pipe", "pipe"],
    });
    this.child.stdout.setEncoding("utf8");
    this.child.stderr.setEncoding("utf8");
    this.child.stdout.on("data", (chunk) => this.#onStdout(chunk));
    this.child.stderr.on("data", (chunk) => {
      writeFileSync(this.stderrPath, chunk, { flag: "a" });
    });
    this.child.on("exit", (code, signal) => {
      log(`${this.name} exited code=${code} signal=${signal}`);
      for (const [id, pending] of this.pending) {
        pending.reject(new Error(`${this.name} exited before response ${id}`));
      }
      this.pending.clear();
    });
  }

  #onStdout(chunk) {
    writeFileSync(this.stdoutPath, chunk, { flag: "a" });
    this.buf += chunk;
    while (true) {
      const nl = this.buf.indexOf("\n");
      if (nl < 0) break;
      const raw = this.buf.slice(0, nl).replace(/\r$/, "");
      this.buf = this.buf.slice(nl + 1);
      if (!raw) continue;
      let ev;
      try {
        ev = JSON.parse(raw);
      } catch {
        log(`${this.name} non-json stdout: ${raw.slice(0, 120)}`);
        continue;
      }
      this.lines.push(ev);
      if (ev.type === "response" && ev.id && this.pending.has(ev.id)) {
        const pending = this.pending.get(ev.id);
        this.pending.delete(ev.id);
        if (ev.success) pending.resolve(ev);
        else
          pending.reject(
            new Error(`${this.name} ${ev.command} failed: ${ev.error}`),
          );
      }
      const still = [];
      for (const waiter of this.waiters) {
        if (waiter.fn(ev)) waiter.resolve(ev);
        else still.push(waiter);
      }
      this.waiters = still;
    }
  }

  request(body, timeoutMs = 30_000) {
    const id = `${this.name}-${++this.seq}`;
    const payload = { id, ...body };
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`${this.name} timeout waiting for ${body.type}`));
      }, timeoutMs);
      this.pending.set(id, {
        resolve: (ev) => {
          clearTimeout(timer);
          resolve(ev);
        },
        reject: (err) => {
          clearTimeout(timer);
          reject(err);
        },
      });
      this.child.stdin.write(`${JSON.stringify(payload)}\n`);
    });
  }

  waitFor(fn, timeoutMs, label) {
    return new Promise((resolve, reject) => {
      for (let i = this.lines.length - 1; i >= 0; i--) {
        if (fn(this.lines[i])) {
          resolve(this.lines[i]);
          return;
        }
      }
      const timer = setTimeout(() => {
        this.waiters = this.waiters.filter((w) => w !== waiter);
        reject(new Error(`${this.name} timeout waiting for ${label}`));
      }, timeoutMs);
      const waiter = {
        fn,
        resolve: (ev) => {
          clearTimeout(timer);
          resolve(ev);
        },
      };
      this.waiters.push(waiter);
    });
  }

  async ready(timeoutMs = 60_000) {
    const state = await this.request({ type: "get_state" }, timeoutMs);
    return state.data;
  }

  async promptAndWait(message, timeoutMs) {
    const before = this.lines.length;
    await this.request({ type: "prompt", message }, 30_000);
    await this.waitFor(
      (ev) => ev.type === "agent_end" && this.lines.indexOf(ev) >= before,
      timeoutMs,
      "agent_end",
    );
    const text = await this.request(
      { type: "get_last_assistant_text" },
      15_000,
    );
    return text.data?.text ?? "";
  }

  async commands() {
    const res = await this.request({ type: "get_commands" }, 15_000);
    return res.data?.commands ?? [];
  }

  async close() {
    if (!this.child || this.child.exitCode !== null) return;
    try {
      this.child.stdin.end();
    } catch {
      // already closed
    }
    const dead = new Promise((resolve) => this.child.once("exit", resolve));
    this.child.kill("SIGTERM");
    const timer = setTimeout(() => this.child.kill("SIGKILL"), 5000);
    await dead;
    clearTimeout(timer);
  }
}

function verifyLarder() {
  const bin = join(LARDER, "larder.mjs");
  const result = { ok: false, steps: [], error: null };
  if (!existsSync(bin)) {
    result.error = "larder/larder.mjs missing";
    writeFileSync(
      join(RUN, "verify.json"),
      `${JSON.stringify(result, null, 2)}\n`,
    );
    return result;
  }
  const defaultStore = join(LARDER, "larder.json");
  if (existsSync(defaultStore)) rmSync(defaultStore);
  const steps = [
    ["larder/larder.mjs", "add", "oats", "2", "2026-12-01"],
    ["larder/larder.mjs", "add", "rice", "1"],
    ["larder/larder.mjs", "use", "oats", "1"],
    ["larder/larder.mjs", "list"],
  ];
  for (const args of steps) {
    const ran = spawnSync("node", args, {
      cwd: PLAY,
      encoding: "utf8",
    });
    const step = {
      args,
      code: ran.status,
      stdout: (ran.stdout || "").trim(),
      stderr: (ran.stderr || "").trim(),
    };
    result.steps.push(step);
    if (ran.status !== 0) {
      result.error = `command failed: node ${args.join(" ")}`;
      writeFileSync(
        join(RUN, "verify.json"),
        `${JSON.stringify(result, null, 2)}\n`,
      );
      return result;
    }
  }
  const listOut = result.steps.at(-1)?.stdout ?? "";
  const expected = "oats 1 2026-12-01\nrice 1";
  result.ok = listOut === expected;
  if (!result.ok)
    result.error = `list output was ${JSON.stringify(listOut)}, expected ${JSON.stringify(expected)}`;
  writeFileSync(
    join(RUN, "verify.json"),
    `${JSON.stringify(result, null, 2)}\n`,
  );
  return result;
}

function waitForFile(path, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (existsSync(path)) return true;
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 50);
  }
  return existsSync(path);
}

async function smoke() {
  log("smoke: starting probe");
  const probe = new RpcSession({
    name: "probe",
    purpose: "Smoke the coms bind",
    cwd: PLAY,
  });
  probe.start();
  try {
    const state = await probe.ready();
    const cardPath = join(COMS, "projects", PROJECT, "agents", "probe.json");
    if (!waitForFile(cardPath, 10_000)) {
      throw new Error(`probe did not bind at ${cardPath}`);
    }
    const card = JSON.parse(readFileSync(cardPath, "utf8"));
    if (!existsSync(card.endpoint)) {
      throw new Error(`probe socket missing: ${card.endpoint}`);
    }
    const registry = snapshotRegistry("smoke");
    const summary = {
      sessionId: state.sessionId,
      card,
      registry,
    };
    writeFileSync(
      join(RUN, "smoke.json"),
      `${JSON.stringify(summary, null, 2)}\n`,
    );
    log(`smoke: ok. bound ${card.name} socket ${card.endpoint}`);
  } finally {
    await probe.close();
  }
}

async function runScenario() {
  mkdirSync(LARDER, { recursive: true });
  writeFileSync(
    join(PLAY, "AGENTS.md"),
    `# playground

The pantry CLI lives in larder/.
Do not edit .pi/, run/, or .coms/.
`,
  );

  const joiner = new RpcSession({
    name: "joiner",
    purpose: "Writes the pantry CLI",
    cwd: PLAY,
  });
  const inspector = new RpcSession({
    name: "inspector",
    purpose: "Reviews the pantry CLI",
    cwd: PLAY,
  });
  const mason = new RpcSession({
    name: "mason",
    purpose: "Plans and talks to peers",
    cwd: PLAY,
  });

  const sessions = [joiner, inspector, mason];
  const summary = {
    startedAt: nowIso(),
    model: MODEL,
    thinking: THINKING,
    project: PROJECT,
    comsDir: COMS,
    texts: {},
    tools: {},
    verify: null,
    error: null,
  };

  try {
    log("start joiner");
    joiner.start();
    await joiner.ready();
    log("start inspector");
    inspector.start();
    await inspector.ready();
    snapshotRegistry("after-workers");

    log("role prompt joiner");
    summary.texts.joinerRole = await joiner.promptAndWait(
      JOINER_PROMPT,
      8 * 60_000,
    );
    log("role prompt inspector");
    summary.texts.inspectorRole = await inspector.promptAndWait(
      INSPECTOR_PROMPT,
      8 * 60_000,
    );

    log("start mason");
    mason.start();
    await mason.ready();
    snapshotRegistry("after-mason");

    log("job prompt mason");
    summary.texts.mason = await mason.promptAndWait(MASON_PROMPT, 25 * 60_000);
    snapshotRegistry("after-job");

    summary.texts.joinerFinal = (
      await joiner.request({ type: "get_last_assistant_text" }, 15_000)
    ).data?.text;
    summary.texts.inspectorFinal = (
      await inspector.request({ type: "get_last_assistant_text" }, 15_000)
    ).data?.text;

    for (const s of sessions) {
      summary.tools[s.name] = extractToolCalls(s.stdoutPath);
    }

    log("verify larder CLI");
    summary.verify = verifyLarder();
    summary.finishedAt = nowIso();
    writeFileSync(
      join(RUN, "summary.json"),
      `${JSON.stringify(summary, null, 2)}\n`,
    );
    log(
      `verify ${summary.verify.ok ? "ok" : "failed"} ${summary.verify.error ?? ""}`,
    );
  } catch (err) {
    summary.error = err instanceof Error ? err.message : String(err);
    summary.finishedAt = nowIso();
    for (const s of sessions) {
      summary.tools[s.name] = extractToolCalls(s.stdoutPath);
    }
    writeFileSync(
      join(RUN, "summary.json"),
      `${JSON.stringify(summary, null, 2)}\n`,
    );
    log(`scenario error: ${summary.error}`);
    throw err;
  } finally {
    for (const s of sessions) await s.close();
  }
}

async function main() {
  if (
    !existsSync(join(PLAY, ".pi", "vendor", "@agentic-core", "draconic-coms"))
  ) {
    throw new Error(
      "playground missing coms package. run: pnpm exec agentic-core install playground --profile pi",
    );
  }
  mkdirSync(RUN, { recursive: true });
  mkdirSync(COMS, { recursive: true });
  if (SMOKE) {
    await smoke();
    return;
  }
  await runScenario();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
