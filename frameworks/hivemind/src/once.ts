import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { claim } from "./claim.ts";
import { interpolate } from "./interpolator.ts";
import { loadConfig, type Lane } from "./loadConfig.ts";
import { exclusiveSetsOverlap, matchNotes, type Match } from "./matcher.ts";
import { scan } from "./scan.ts";
import { spawnArgv } from "./spawner.ts";
import { tokenize } from "./tokenizer.ts";

export type SpawnChild = (argv: readonly string[]) => unknown;

export type LiveRun = {
  exclusive: readonly string[];
  wait: Promise<number>;
  kill: () => void;
  done: boolean;
  path: string;
};

export async function runOnce(opts: {
  cwd: string;
  spawnChild?: SpawnChild;
  env?: NodeJS.ProcessEnv;
}): Promise<void> {
  const config = loadConfig(opts.cwd);
  const lanes = config.lanes.filter(
    (lane) => !config.disable.includes(lane.lane),
  );
  if (lanes.length === 0) return;
  const { notes } = scan({ cwd: opts.cwd, config });
  const matches = matchNotes({ lanes, notes, disable: config.disable });
  const env = opts.env ?? process.env;
  const live: LiveRun[] = [];
  spawnMatches({
    cwd: opts.cwd,
    concurrency: config.concurrency,
    matches,
    env,
    spawnChild: opts.spawnChild,
    live,
  });
  await Promise.all(live.map((run) => run.wait));
}

export function spawnMatches(opts: {
  cwd: string;
  concurrency: number;
  matches: readonly Match[];
  env: NodeJS.ProcessEnv;
  spawnChild?: SpawnChild;
  live: LiveRun[];
}): number {
  let spawned = 0;
  for (const match of opts.matches) {
    const current = opts.live.filter((run) => !run.done);
    if (current.length >= opts.concurrency) break;
    if (current.some((run) => run.path === match.note.path)) {
      continue;
    }
    if (
      current.some((run) =>
        exclusiveSetsOverlap(match.lane.exclusive, run.exclusive),
      )
    ) {
      continue;
    }
    const argv = cmdArgv({ lane: match.lane, cwd: opts.cwd, env: opts.env });
    if (argv === undefined) continue;
    const taken = claim({
      abs: join(opts.cwd, match.note.path),
      triggerStatus: match.lane.trigger.status,
      claimStatus: match.lane.claimStatus,
      runId: randomUUID(),
    });
    if (taken.kind === "skipped") continue;
    if (opts.spawnChild !== undefined) {
      opts.spawnChild(argv);
      opts.live.push(
        track({
          exclusive: match.lane.exclusive,
          wait: Promise.resolve(0),
          kill: noop,
          path: match.note.path,
        }),
      );
      spawned += 1;
      continue;
    }
    const handle = spawnArgv({ argv, cwd: opts.cwd, env: opts.env });
    opts.live.push(
      track({
        exclusive: match.lane.exclusive,
        wait: handle.wait,
        kill: handle.kill,
        path: match.note.path,
      }),
    );
    spawned += 1;
  }
  return spawned;
}

function track(run: Omit<LiveRun, "done">): LiveRun {
  const live: LiveRun = { ...run, done: false };
  void live.wait.then(
    () => {
      live.done = true;
    },
    () => {
      live.done = true;
    },
  );
  return live;
}

function noop(): void {}

function cmdArgv(opts: {
  lane: Lane;
  cwd: string;
  env: NodeJS.ProcessEnv;
}): string[] | undefined {
  if (opts.lane.prompt !== undefined && opts.lane.prompt !== "") {
    if (!existsSync(join(opts.cwd, opts.lane.prompt))) return undefined;
  }
  if (typeof opts.lane.cmd !== "string") {
    const argv: string[] = [];
    for (const part of opts.lane.cmd) {
      const rendered = interpolate({
        template: part,
        cwd: opts.cwd,
        lane: opts.lane,
        env: opts.env,
      });
      if (rendered.kind === "skip") return undefined;
      argv.push(rendered.value);
    }
    return argv;
  }
  const rendered = interpolate({
    template: opts.lane.cmd,
    cwd: opts.cwd,
    lane: opts.lane,
    env: opts.env,
  });
  if (rendered.kind === "skip") return undefined;
  const tokens = tokenize(rendered.value);
  if (tokens.kind === "fail") return undefined;
  return tokens.argv;
}
