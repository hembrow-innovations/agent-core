import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { formatCwdFromRoot, formatFooterLine } from "./format.ts";

test("cwd at the git root is the root folder name", () => {
	const root = mkdtempSync(join(tmpdir(), "footer-root-"));
	mkdirSync(join(root, ".git"));
	assert.equal(formatCwdFromRoot(root), root.split("/").at(-1));
});

test("cwd under the git root starts at the root folder name", () => {
	const parent = mkdtempSync(join(tmpdir(), "footer-nested-"));
	const root = join(parent, "agentic-core");
	mkdirSync(root);
	mkdirSync(join(root, ".git"));
	mkdirSync(join(root, "packages", "foo"), { recursive: true });
	assert.equal(
		formatCwdFromRoot(join(root, "packages", "foo")),
		"agentic-core/packages/foo",
	);
});

test("cwd with no git root is the last folder name", () => {
	const dir = mkdtempSync(join(tmpdir(), "footer-nongit-"));
	assert.equal(formatCwdFromRoot(dir), dir.split("/").at(-1));
});

test("worktree .git file still counts as the repo root", () => {
	const parent = mkdtempSync(join(tmpdir(), "footer-worktree-"));
	const root = join(parent, "agentic-core");
	mkdirSync(root);
	writeFileSync(join(root, ".git"), "gitdir: /tmp/fake\n");
	assert.equal(formatCwdFromRoot(root), "agentic-core");
});

test("footer line is cwd team tokens/limit cost model effort", () => {
	assert.equal(
		formatFooterLine({
			cwd: "agentic-core/packages/foo",
			teamStatus: "team alpha",
			tokens: 12300,
			contextWindow: 200000,
			cost: 0.042,
			model: "gpt-5.4",
			effort: "high",
		}),
		"agentic-core/packages/foo team alpha 12k/200k $0.042 gpt-5.4 high",
	);
});

test("footer line puts (auto) before the model when autocompact is on", () => {
	assert.equal(
		formatFooterLine({
			cwd: "agentic-core",
			tokens: 80,
			contextWindow: 1000,
			cost: 0,
			autoCompact: true,
			model: "gpt-5.4",
			effort: "high",
		}),
		"agentic-core 80/1.0k $0.000 (auto) gpt-5.4 high",
	);
});

test("footer line drops missing team and effort", () => {
	assert.equal(
		formatFooterLine({
			cwd: "agentic-core",
			tokens: 80,
			contextWindow: 1000,
			cost: 0,
			model: "no-model",
		}),
		"agentic-core 80/1.0k $0.000 no-model",
	);
});

test("unknown tokens render as a question mark", () => {
	assert.equal(
		formatFooterLine({
			cwd: "agentic-core",
			tokens: null,
			contextWindow: 200000,
			cost: 1.5,
			model: "opus",
			effort: "off",
		}),
		"agentic-core ?/200k $1.500 opus off",
	);
});
