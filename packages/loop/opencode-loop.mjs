#!/usr/bin/env node
// Run the same OpenCode prompt N times, streaming events live.
// Terminal renders JSON events through .loop/harness (markdown, tools).
// Usage: node .loop/opencode-loop.mjs <loops> <prompt...>
//        node .loop/opencode-loop.mjs 5 "fix the failing tests"
// Extra opencode flags: put them after `--`, e.g. ... "prompt" -- -m xai/grok-4.5
// Optional sleep between loops (seconds): SLEEP=60 node .loop/opencode-loop.mjs 5 "prompt"

import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import { createHarness } from "./harness/index.mjs";

const [, , loopsArg, ...rest] = process.argv;
const loops = Number.parseInt(loopsArg, 10);
if (!Number.isInteger(loops) || loops < 1 || rest.length === 0) {
	console.error(
		"Usage: node .loop/opencode-loop.mjs <loops> <prompt...> [-- <opencode flags>]",
	);
	process.exit(1);
}

const dash = rest.indexOf("--");
const promptParts = dash === -1 ? rest : rest.slice(0, dash);
const extraFlags = dash === -1 ? [] : rest.slice(dash + 1);

const flags = [
	// auto-approve permissions that are not explicitly denied
	"--auto",
	// stream events live as JSON instead of formatted text
	"--format",
	"json",
];

const run = (i) =>
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
		createInterface({ input: child.stdout }).on("line", (line) => {
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

const sleepMs = (Number.parseFloat(process.env.SLEEP) || 0) * 1000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
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
