import assert from "node:assert/strict";
import { chmodSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import { describe, it } from "node:test";
import type {
	ExtensionAPI,
	ExtensionContext,
	ToolDefinition,
} from "@earendil-works/pi-coding-agent";
import onicExtension from "./index.ts";

function loadFactory(): { tool: ToolDefinition } {
	let tool: ToolDefinition | undefined;
	onicExtension({
		on() {},
		registerTool(registered) {
			tool = registered;
		},
	} as ExtensionAPI);
	if (!tool) throw new Error("factory did not register the tool");
	return { tool };
}

function fakeOnicDir(): string {
	const dir = mkdtempSync(join(tmpdir(), "fake-onic-"));
	const bin = join(dir, "onic");
	writeFileSync(
		bin,
		`#!/usr/bin/env node
process.stdout.write(JSON.stringify(process.argv.slice(2)));\n`,
	);
	chmodSync(bin, 0o755);
	return dir;
}

async function withPath<T>(path: string, fn: () => Promise<T>): Promise<T> {
	const previous = process.env.PATH;
	process.env.PATH = previous ? `${path}${delimiter}${previous}` : path;
	try {
		return await fn();
	} finally {
		process.env.PATH = previous;
	}
}

describe("heio-onic factory", () => {
	it("fails closed when onic is not installed", async () => {
		const { tool } = loadFactory();
		const previous = process.env.PATH;
		process.env.PATH = mkdtempSync(join(tmpdir(), "no-onic-"));
		try {
			const result = await tool.execute(
				"id",
				{},
				undefined,
				undefined,
				{ cwd: process.cwd() } as ExtensionContext,
			);
			assert.deepEqual(result.content, [
				{ type: "text", text: "onic is not installed" },
			]);
		} finally {
			process.env.PATH = previous;
		}
	});

	it("schema shells to onic schema", async () => {
		const { tool } = loadFactory();
		const result = await withPath(fakeOnicDir(), () =>
			tool.execute(
				"id",
				{ action: "schema" },
				undefined,
				undefined,
				{ cwd: process.cwd() } as ExtensionContext,
			),
		);
		assert.deepEqual(result.content, [
			{ type: "text", text: '["schema"]' },
		]);
	});

	it("compact shells to onic compact with the query", async () => {
		const { tool } = loadFactory();
		const result = await withPath(fakeOnicDir(), () =>
			tool.execute(
				"id",
				{ action: "compact", query: "login" },
				undefined,
				undefined,
				{ cwd: process.cwd() } as ExtensionContext,
			),
		);
		assert.deepEqual(result.content, [
			{ type: "text", text: '["compact","login"]' },
		]);
	});

	it("search shells to onic search with the query", async () => {
		const { tool } = loadFactory();
		const result = await withPath(fakeOnicDir(), () =>
			tool.execute(
				"id",
				{ action: "search", query: "login" },
				undefined,
				undefined,
				{ cwd: process.cwd() } as ExtensionContext,
			),
		);
		assert.deepEqual(result.content, [
			{ type: "text", text: '["search","login"]' },
		]);
	});
});
