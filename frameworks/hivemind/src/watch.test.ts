import assert from "node:assert/strict";
import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const CLI = fileURLToPath(import.meta.url).replace(
  /watch\.test\.ts$/,
  "cli.ts",
);

function setupEmptyProject(): string {
  const cwd = mkdtempSync(join(tmpdir(), "hivemind-watch-"));
  mkdirSync(join(cwd, "tickets"));
  mkdirSync(join(cwd, "quarantine"));
  writeFileSync(
    join(cwd, "hivemind.yaml"),
    [
      "folders:",
      "  - path: tickets",
      "    schema: ticket",
      "    required: [id, status]",
      "  - path: quarantine",
      "    schema: quarantine",
      "    required: [origin-location, quarantined-at, fault]",
      "lanes:",
      "  - lane: plan",
      "    cmd: /bin/echo",
      "    trigger:",
      "      status: ready-for-agent",
      "    claim-status: active",
      "",
    ].join("\n"),
  );
  return cwd;
}

test("watch --until-quiet on an empty match set exits after one quiet scan", () => {
  const cwd = setupEmptyProject();
  const proc = spawnSync(
    process.execPath,
    ["--experimental-strip-types", CLI, "watch", "--until-quiet"],
    { cwd, encoding: "utf8", timeout: 5000 },
  );
  assert.equal(proc.status, 0, proc.stderr);
  assert.equal(proc.signal, null);
});

test("--until-target PATH exits when PATH exists", async () => {
  const cwd = setupEmptyProject();
  const target = join(cwd, "target.flag");
  const child = spawn(
    process.execPath,
    [
      "--experimental-strip-types",
      CLI,
      "watch",
      "--until-target",
      "target.flag",
    ],
    { cwd },
  );
  const exited = new Promise<{ status: number | null; stderr: string }>(
    (resolve) => {
      let stderr = "";
      child.stderr.on("data", (chunk: Buffer | string) => {
        stderr += chunk.toString();
      });
      child.on("close", (status) => {
        resolve({ status, stderr });
      });
    },
  );
  await new Promise((resolve) => setTimeout(resolve, 150));
  writeFileSync(target, "1");
  const proc = await withTimeout(exited, 4000);
  assert.equal(proc.status, 0, proc.stderr);
});

test("backoff does not busy-spin; killing the process stops spawn", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "hivemind-watch-backoff-"));
  mkdirSync(join(cwd, "tickets"));
  mkdirSync(join(cwd, "quarantine"));
  writeFileSync(
    join(cwd, "record.mjs"),
    "import { appendFileSync } from 'node:fs';\nappendFileSync('spawns.log', '1\\n');\n",
  );
  writeFileSync(
    join(cwd, "hivemind.yaml"),
    [
      "folders:",
      "  - path: tickets",
      "    schema: ticket",
      "    required: [id, status]",
      "  - path: quarantine",
      "    schema: quarantine",
      "    required: [origin-location, quarantined-at, fault]",
      "lanes:",
      "  - lane: plan",
      "    cmd:",
      `      - ${process.execPath}`,
      "      - record.mjs",
      "    trigger:",
      "      status: ready-for-agent",
      "    claim-status: active",
      "    backoff: 1s",
      "",
    ].join("\n"),
  );
  const child = startWatch(cwd);
  try {
    await delay(250);
    writeFileSync(
      join(cwd, "tickets", "agent.md"),
      "---\nid: agent\nstatus: ready-for-agent\n---\n\n# agent\n",
    );
    await delay(400);
    assert.equal(existsSync(join(cwd, "spawns.log")), false);
    await waitForPath(join(cwd, "spawns.log"), 2000);
  } finally {
    child.kill("SIGTERM");
    await onceClose(child);
  }
});

test("killing the process stops spawn", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "hivemind-watch-kill-"));
  mkdirSync(join(cwd, "tickets"));
  mkdirSync(join(cwd, "quarantine"));
  writeFileSync(
    join(cwd, "hold.mjs"),
    [
      "import { writeFileSync } from 'node:fs';",
      "writeFileSync('child.pid', String(process.pid));",
      "await new Promise((resolve) => setTimeout(resolve, 30000));",
      "",
    ].join("\n"),
  );
  writeFileSync(
    join(cwd, "hivemind.yaml"),
    [
      "folders:",
      "  - path: tickets",
      "    schema: ticket",
      "    required: [id, status]",
      "  - path: quarantine",
      "    schema: quarantine",
      "    required: [origin-location, quarantined-at, fault]",
      "lanes:",
      "  - lane: plan",
      "    cmd:",
      `      - ${process.execPath}`,
      "      - hold.mjs",
      "    trigger:",
      "      status: ready-for-agent",
      "    claim-status: active",
      "    backoff: 1s",
      "",
    ].join("\n"),
  );
  writeFileSync(
    join(cwd, "tickets", "agent.md"),
    "---\nid: agent\nstatus: ready-for-agent\n---\n\n# agent\n",
  );
  const child = startWatch(cwd);
  try {
    await waitForPath(join(cwd, "child.pid"), 4000);
    const spawnedPid = Number(readFileSync(join(cwd, "child.pid"), "utf8"));
    assert.equal(Number.isInteger(spawnedPid) && spawnedPid > 0, true);
    child.kill("SIGTERM");
    await onceClose(child);
    await delay(200);
    assert.equal(pidAlive(spawnedPid), false);
  } finally {
    child.kill("SIGKILL");
  }
});

function startWatch(cwd: string): ChildProcess {
  return spawn(process.execPath, ["--experimental-strip-types", CLI, "watch"], {
    cwd,
  });
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function onceClose(child: ChildProcess): Promise<void> {
  return new Promise((resolve) => {
    if (child.exitCode !== null || child.signalCode !== null) {
      resolve();
      return;
    }
    child.on("close", () => resolve());
  });
}

async function waitForPath(path: string, ms: number): Promise<void> {
  const start = Date.now();
  while (!existsSync(path)) {
    if (Date.now() - start > ms) {
      throw new Error(`timed out waiting for ${path}`);
    }
    await delay(20);
  }
}

function pidAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`timed out after ${ms}ms`));
    }, ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err: unknown) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}
