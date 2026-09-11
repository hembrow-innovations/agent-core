#!/usr/bin/env node
/**
 * Run the same OpenCode prompt N times, streaming events live.
 *
 * Terminal renders JSON events through the loop harness (markdown, tools).
 * Extra opencode flags go after `--`. Optional sleep between loops uses
 * `SLEEP=<seconds>`.
 *
 * {@link packages/loop/src/harness/index.ts}
 *
 * @see createHarness
 *
 * @example
 * ```bash
 * node .loop/opencode-loop.mjs 5 "fix the failing tests"
 * node .loop/opencode-loop.mjs 5 "prompt" -- -m xai/grok-4.5
 * SLEEP=60 node .loop/opencode-loop.mjs 5 "prompt"
 * ```
 *
 * @packageDocumentation
 */

import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import { createHarness } from "./harness/index.ts";

/**
 * Stderr text when the loop count or prompt is missing.
 */
const USAGE =
  "Usage: node .loop/opencode-loop.mjs <loops> <prompt...> [-- <opencode flags>]";

/**
 * Loop count from argv, then the prompt and optional `--` flags.
 */
const [, , loopsArg, ...rest] = process.argv;
/**
 * How many times to spawn `opencode run`.
 */
const loops = Number.parseInt(loopsArg, 10);
if (!Number.isInteger(loops) || loops < 1 || rest.length === 0) {
  console.error(USAGE);
  process.exit(1);
}

/**
 * Index of `--` in the remaining argv, or `-1` when absent.
 */
const dash = rest.indexOf("--");
/**
 * Prompt tokens passed to `opencode run` before extra flags.
 */
const promptParts = dash === -1 ? rest : rest.slice(0, dash);
/**
 * Tokens after `--`, forwarded to OpenCode unchanged.
 */
const extraFlags = dash === -1 ? [] : rest.slice(dash + 1);

/**
 * Always-on OpenCode flags: auto-approve and JSON event stream.
 */
const flags = ["--auto", "--format", "json"];

/**
 * Spawn one `opencode run` and print formatted JSON events as they arrive.
 *
 * @param i - 1-based loop index.
 * @returns The child exit code, or `0` when the close event has a null code.
 *
 * @see createHarness
 */
const run = (i: number): Promise<number> =>
  new Promise((resolve) => {
    process.stdout.write(`\n===== loop ${i}/${loops} =====\n`);
    const harness = createHarness();
    const child = spawn(
      "opencode",
      ["run", ...flags, ...promptParts, ...extraFlags],
      {
        stdio: ["inherit", "pipe", "inherit"],
      },
    );
    createInterface({ input: child.stdout! }).on("line", (line) => {
      if (!line.trim()) return;
      try {
        const view = harness.format(JSON.parse(line));
        if (view) process.stdout.write(`${view}\n`);
      } catch {
        console.log(line);
      }
    });
    child.on("close", (code) => resolve(code ?? 0));
  });

/**
 * Sleep for a number of milliseconds.
 *
 * @param ms - Delay in milliseconds.
 * @returns A promise that resolves after `ms`.
 */
const sleep = (ms: number): Promise<void> =>
  new Promise((r) => setTimeout(r, ms));

/**
 * Delay between loops from `SLEEP` seconds; zero skips the wait.
 */
const sleepMs = (Number.parseFloat(process.env.SLEEP ?? "") || 0) * 1000;
console.log(
  `sleep between loops: ${sleepMs / 1000}s (set with SLEEP=<seconds>)`,
);

for (let i = 1; i <= loops; i++) {
  const code = await run(i);
  if (code !== 0) console.error(`loop ${i} exited with code ${code}`);
  if (sleepMs && i < loops) {
    console.log(`sleeping ${sleepMs / 1000}s...`);
    await sleep(sleepMs);
  }
}
