#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { bindPeer } from "../packages/draconic-coms/src/protocol.ts";
import { sendComsPrompt } from "../packages/draconic-teams/src/coms-send.ts";
import {
  claimTask,
  createTask,
  createTeam,
  readTeam,
  upsertMember,
} from "../packages/draconic-teams/src/store.ts";
import {
  applySpawn,
  defaultTmuxRunner,
  killPane,
  shellQuote,
} from "../packages/draconic-teams/src/tmux.ts";

const HERE = fileURLToPath(import.meta.url);
const ROOT = join(dirname(HERE), "..");
const TEAM = "try-teams";
const MEMBER = "researcher";

async function runFixture() {
  const peer = await bindPeer({
    comsDir: process.env.PI_COMS_DIR,
    name: MEMBER,
    purpose: "reply with the word pong",
    project: TEAM,
    cwd: process.cwd(),
    onPrompt: (env) => {
      process.stdout.write(`[from ${env.sender_name}]\n\n${env.prompt}\n`);
      void peer.fulfillInbound({ msgId: env.msg_id, response: "pong" });
    },
  });
  process.stdout.write(`fixture ${MEMBER} ready\n`);
  await new Promise(() => {});
}

function writeArtifact(dir, name, value) {
  mkdirSync(dir, { recursive: true });
  const text =
    typeof value === "string" ? value : `${JSON.stringify(value, null, 2)}\n`;
  writeFileSync(join(dir, name), text.endsWith("\n") ? text : `${text}\n`);
}

function paneAlive(paneId) {
  const r = spawnSync(
    "tmux",
    ["display-message", "-p", "-t", paneId, "#{pane_id}"],
    { encoding: "utf8" },
  );
  return r.status === 0 && r.stdout.trim() === paneId;
}

const BAR = `Teams living bar.

Install, then run this script inside tmux:

  pnpm exec agentic-core install . --profile agentic-core
  node scripts/try-teams.mjs

The script writes artifacts under a temp dir and prints that path.
Those files must show pong, one claimed task, and a dead pane id.

Human TUI proof after install, still inside tmux:

  /team create try-teams
  /team spawn researcher reply with the word pong
  coms_list
  coms_send researcher ping
  coms_await

The researcher pane must show [from ...] and answer. read_inbox is a fail.
Shut the pane with /team shutdown researcher before you leave.
`;

async function runBar() {
  process.stdout.write(BAR);
  if (!process.env.TMUX) {
    process.stdout.write("\nNot inside tmux. Printed the bar only.\n");
    return;
  }
  process.stdout.write("\n");
  const root = mkdtempSync(join(tmpdir(), "try-teams-"));
  const teamsDir = join(root, "teams");
  const comsDir = join(root, "coms");
  const artifacts = join(root, "artifacts");
  process.env.PI_TEAMS_DIR = teamsDir;
  process.env.PI_COMS_DIR = comsDir;
  mkdirSync(artifacts, { recursive: true });

  createTeam({
    teamsDir,
    name: TEAM,
    leadName: "team-lead",
    cwd: ROOT,
  });
  createTask({
    teamsDir,
    team: TEAM,
    subject: "reply pong",
    description: "answer the inbound ping",
  });

  const inner = defaultTmuxRunner();
  const fixtureCmd = `PI_COMS_DIR=${shellQuote(comsDir)} PI_TEAMS_DIR=${shellQuote(teamsDir)} node --experimental-strip-types ${shellQuote(HERE)} --fixture`;
  const result = await applySpawn({
    teamsDir,
    request: {
      team: TEAM,
      name: MEMBER,
      purpose: "reply with the word pong",
      cwd: ROOT,
    },
    runner: {
      run(argv) {
        if (argv[1] === "split-window" || argv[1] === "new-window") {
          return inner.run([...argv.slice(0, -1), fixtureCmd]);
        }
        return inner.run(argv);
      },
    },
  });
  if (result.member.kind !== "teammate") {
    throw new Error("expected teammate");
  }
  const paneId = result.member.paneId;
  writeArtifact(artifacts, "spawn.json", result);

  const lead = await bindPeer({
    comsDir,
    name: "team-lead",
    purpose: "lead the try-teams fixture",
    project: TEAM,
    cwd: ROOT,
  });
  try {
    const started = Date.now();
    let listed = [];
    while (Date.now() - started < 8000) {
      listed = await lead.list();
      if (listed.some((peer) => peer.name === MEMBER && peer.alive)) break;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    writeArtifact(artifacts, "peers.json", listed);
    if (!listed.some((peer) => peer.name === MEMBER)) {
      const pane = spawnSync("tmux", ["capture-pane", "-p", "-t", paneId], {
        encoding: "utf8",
      });
      writeArtifact(artifacts, "pane.txt", pane.stdout || pane.stderr || "");
      throw new Error(
        `researcher never appeared on coms. pane=${pane.status} ${pane.stdout}`,
      );
    }

    const sent = await lead.send({ target: MEMBER, prompt: "ping" });
    const pong = await lead.awaitReply(sent.msg_id, 8000);
    writeArtifact(artifacts, "pong.txt", pong);
    if (pong.trim() !== "pong") {
      throw new Error(`expected pong, got ${JSON.stringify(pong)}`);
    }

    const claimed = claimTask({
      teamsDir,
      team: TEAM,
      id: "1",
      owner: MEMBER,
    });
    writeArtifact(artifacts, "task.json", claimed);

    try {
      await sendComsPrompt({
        comsDir,
        project: TEAM,
        senderName: "team-lead",
        senderCwd: ROOT,
        target: MEMBER,
        prompt: "Please stop. The lead is shutting this pane down.",
      });
    } catch {
      // fixture may already be gone
    }
    let killed = await killPane({ paneId });
    if (paneAlive(paneId)) {
      spawnSync("tmux", ["kill-pane", "-t", paneId], { encoding: "utf8" });
      killed = paneAlive(paneId) ? killed : "killed";
    }
    if (paneAlive(paneId)) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      spawnSync("tmux", ["kill-pane", "-t", paneId], { encoding: "utf8" });
    }
    upsertMember({
      teamsDir,
      team: TEAM,
      member: { ...result.member, status: "shutdown" },
    });
    const panes = spawnSync("tmux", ["list-panes", "-a", "-F", "#{pane_id}"], {
      encoding: "utf8",
    });
    const ids = (panes.stdout || "").trim().split("\n").filter(Boolean);
    writeArtifact(artifacts, "shutdown.json", {
      action: killed,
      name: MEMBER,
      paneId,
      alive: paneAlive(paneId),
      paneIds: ids,
      team: readTeam({ teamsDir, name: TEAM }),
    });
    if (ids.includes(paneId) || paneAlive(paneId)) {
      throw new Error(
        `pane ${paneId} still alive in ${ids.join(",")} artifacts ${artifacts}`,
      );
    }
  } finally {
    await lead.shutdown();
  }

  process.stdout.write(`${artifacts}\n`);
}

if (process.argv.includes("--fixture")) {
  await runFixture();
} else {
  await runBar();
}
