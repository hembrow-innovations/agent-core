import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { Lane, SpawnSpec } from "../config/loadConfig.ts";
import type { Journal } from "../journal/journal.ts";
import { exclusiveSetsOverlap, type Match } from "../match/matcher.ts";
import { claim } from "../spawn/claim.ts";
import { interpolate } from "../spawn/interpolator.ts";
import { spawnArgv, type SpawnHandle } from "../spawn/spawner.ts";
import { tokenize } from "../spawn/tokenizer.ts";

export type SpawnChild = (argv: readonly string[]) => unknown;

export type LiveRun = {
  exclusive: readonly string[];
  wait: Promise<number>;
  kill: () => void;
  done: boolean;
  path: string;
  lane: string;
  runId: string;
};

export function spawnMatches(opts: {
  cwd: string;
  matches: readonly Match[];
  env: NodeJS.ProcessEnv;
  spawnChild?: SpawnChild;
  live: LiveRun[];
  journal?: Journal;
  lastFinished?: Map<string, number>;
  now?: () => number;
}): number {
  let spawned = 0;
  const now = opts.now ?? Date.now;
  for (const match of opts.matches) {
    const current = opts.live.filter((run) => !run.done);
    const laneLive = current.filter((run) => run.lane === match.lane.lane);
    if (laneLive.length >= match.lane.concurrency) {
      opts.journal?.record({
        kind: "skip",
        lane: match.lane.lane,
        path: match.note.path,
        reason: "concurrency",
      });
      continue;
    }
    if (current.some((run) => run.path === match.note.path)) {
      opts.journal?.record({
        kind: "skip",
        lane: match.lane.lane,
        path: match.note.path,
        reason: "live",
      });
      continue;
    }
    if (
      current.some((run) =>
        exclusiveSetsOverlap(match.lane.exclusive, run.exclusive),
      )
    ) {
      opts.journal?.record({
        kind: "skip",
        lane: match.lane.lane,
        path: match.note.path,
        reason: "exclusive",
      });
      continue;
    }
    if (match.lane.cooldownMs > 0 && opts.lastFinished !== undefined) {
      const last = opts.lastFinished.get(match.lane.lane);
      if (last !== undefined && now() - last < match.lane.cooldownMs) {
        opts.journal?.record({
          kind: "skip",
          lane: match.lane.lane,
          path: match.note.path,
          reason: "cooldown",
        });
        continue;
      }
    }
    const specs = spawnSpecs(match.lane);
    const argvList: string[][] = [];
    let skipped: "missing-prompt" | "cmd-skip" | undefined;
    for (const spec of specs) {
      const argv = cmdArgv({
        spec,
        lane: match.lane.lane,
        cwd: opts.cwd,
        env: opts.env,
      });
      if (argv.kind === "skip") {
        skipped = argv.reason;
        break;
      }
      argvList.push(argv.argv);
    }
    if (skipped !== undefined) {
      opts.journal?.record({
        kind: "skip",
        lane: match.lane.lane,
        path: match.note.path,
        reason: skipped,
      });
      continue;
    }
    const runId = randomUUID();
    const taken = claim({
      abs: join(opts.cwd, match.note.path),
      triggerStatus: match.lane.trigger.status,
      claimStatus: match.lane.claimStatus,
      runId,
    });
    if (taken.kind === "skipped") {
      opts.journal?.record({
        kind: "skip",
        lane: match.lane.lane,
        path: match.note.path,
        reason: "claim-race",
      });
      continue;
    }
    opts.journal?.record({
      kind: "claim",
      lane: match.lane.lane,
      path: match.note.path,
      runId,
    });
    const handle = startChildren({
      argvList,
      cwd: opts.cwd,
      env: opts.env,
      spawnChild: opts.spawnChild,
      journal: opts.journal,
      lane: match.lane.lane,
      path: match.note.path,
      runId,
    });
    const pipelineExits = argvList.length > 1 && opts.spawnChild === undefined;
    opts.live.push(
      track({
        exclusive: match.lane.exclusive,
        wait: handle.wait,
        kill: handle.kill,
        path: match.note.path,
        lane: match.lane.lane,
        runId,
        journal: pipelineExits ? undefined : opts.journal,
        lastFinished: opts.lastFinished,
      }),
    );
    spawned += 1;
  }
  return spawned;
}

function spawnSpecs(lane: Lane): SpawnSpec[] {
  if (lane.type === "single") return [lane];
  return [...lane.stages];
}

function startChildren(opts: {
  argvList: readonly (readonly string[])[];
  cwd: string;
  env: NodeJS.ProcessEnv;
  spawnChild?: SpawnChild;
  journal?: Journal;
  lane: string;
  path: string;
  runId: string;
}): SpawnHandle {
  if (opts.spawnChild !== undefined) {
    for (const argv of opts.argvList) {
      opts.journal?.record({
        kind: "spawn",
        lane: opts.lane,
        path: opts.path,
        runId: opts.runId,
      });
      opts.spawnChild(argv);
    }
    return { wait: Promise.resolve(0), kill: noop };
  }
  if (opts.argvList.length === 1 && opts.argvList[0] !== undefined) {
    opts.journal?.record({
      kind: "spawn",
      lane: opts.lane,
      path: opts.path,
      runId: opts.runId,
    });
    return spawnArgv({
      argv: opts.argvList[0],
      cwd: opts.cwd,
      env: opts.env,
    });
  }
  return startPipeline(opts);
}

function startPipeline(opts: {
  argvList: readonly (readonly string[])[];
  cwd: string;
  env: NodeJS.ProcessEnv;
  journal?: Journal;
  lane: string;
  path: string;
  runId: string;
}): SpawnHandle {
  let currentKill = noop;
  let cancelled = false;
  const wait = (async () => {
    for (const argv of opts.argvList) {
      if (cancelled) return 1;
      opts.journal?.record({
        kind: "spawn",
        lane: opts.lane,
        path: opts.path,
        runId: opts.runId,
      });
      const handle = spawnArgv({
        argv,
        cwd: opts.cwd,
        env: opts.env,
      });
      currentKill = handle.kill;
      const status = await handle.wait;
      opts.journal?.record({
        kind: "exit",
        lane: opts.lane,
        path: opts.path,
        runId: opts.runId,
        status,
      });
      if (status !== 0) return status;
    }
    return 0;
  })();
  return {
    wait,
    kill: () => {
      cancelled = true;
      currentKill();
    },
  };
}

function track(
  run: Omit<LiveRun, "done"> & {
    journal?: Journal;
    lastFinished?: Map<string, number>;
  },
): LiveRun {
  const live: LiveRun = {
    exclusive: run.exclusive,
    wait: run.wait,
    kill: run.kill,
    done: false,
    path: run.path,
    lane: run.lane,
    runId: run.runId,
  };
  void live.wait.then(
    (status) => {
      live.done = true;
      run.lastFinished?.set(live.lane, Date.now());
      run.journal?.record({
        kind: "exit",
        lane: live.lane,
        path: live.path,
        runId: live.runId,
        status,
      });
    },
    () => {
      live.done = true;
      run.lastFinished?.set(live.lane, Date.now());
      run.journal?.record({
        kind: "exit",
        lane: live.lane,
        path: live.path,
        runId: live.runId,
        status: 1,
      });
    },
  );
  return live;
}

function noop(): void {}

function cmdArgv(opts: {
  spec: SpawnSpec;
  lane: string;
  cwd: string;
  env: NodeJS.ProcessEnv;
}):
  | { kind: "ok"; argv: string[] }
  | { kind: "skip"; reason: "missing-prompt" | "cmd-skip" } {
  if (opts.spec.prompt !== undefined && opts.spec.prompt !== "") {
    if (!existsSync(join(opts.cwd, opts.spec.prompt))) {
      return { kind: "skip", reason: "missing-prompt" };
    }
  }
  if (typeof opts.spec.cmd !== "string") {
    const argv: string[] = [];
    for (const part of opts.spec.cmd) {
      const rendered = interpolate({
        template: part,
        cwd: opts.cwd,
        lane: opts.lane,
        spec: opts.spec,
        env: opts.env,
      });
      if (rendered.kind === "skip") {
        return { kind: "skip", reason: "cmd-skip" };
      }
      argv.push(rendered.value);
    }
    return { kind: "ok", argv };
  }
  const rendered = interpolate({
    template: opts.spec.cmd,
    cwd: opts.cwd,
    lane: opts.lane,
    spec: opts.spec,
    env: opts.env,
  });
  if (rendered.kind === "skip") return { kind: "skip", reason: "cmd-skip" };
  const tokens = tokenize(rendered.value);
  if (tokens.kind === "fail") return { kind: "skip", reason: "cmd-skip" };
  return { kind: "ok", argv: tokens.argv };
}
