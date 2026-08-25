import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import comsExtension from "./index.ts";
import { bindPeer, type BoundPeer } from "./protocol.ts";

type Tool = {
	name: string;
	execute: (
		toolCallId: string,
		params: Record<string, unknown>,
	) => Promise<{
		content: Array<{ type: string; text: string }>;
		details: unknown;
	}>;
};

function loadExtension(opts?: { flags?: Record<string, string> }) {
	const tools: Tool[] = [];
	const handlers = new Map<string, (...args: never[]) => unknown>();
	const flags: Record<string, string | undefined> = { ...opts?.flags };
	const registered = new Set<string>();
	comsExtension({
		registerFlag(name: string, options?: { default?: string }) {
			registered.add(name);
			if (flags[name] === undefined && options?.default !== undefined) {
				flags[name] = options.default;
			}
		},
		registerTool(tool: Tool) {
			tools.push(tool);
		},
		on(event: string, handler: (...args: never[]) => unknown) {
			handlers.set(event, handler);
		},
		getFlag(name: string) {
			if (!registered.has(name)) return undefined;
			return flags[name];
		},
		sendMessage() {},
	} as unknown as ExtensionAPI);
	return { tools, handlers };
}

function tool(tools: Tool[], name: string): Tool {
	const found = tools.find((item) => item.name === name);
	if (!found) throw new Error(`missing tool ${name}`);
	return found;
}

function sessionCtx(cwd = "/work") {
	return {
		cwd,
		model: { id: "grok" },
		hasUI: false,
		ui: {
			setStatus() {},
			notify() {},
		},
	};
}

async function withComsDir<T>(run: () => Promise<T>): Promise<T> {
	const comsDir = mkdtempSync(join(tmpdir(), "draconic-coms-ext-"));
	const prev = process.env.PI_COMS_DIR;
	process.env.PI_COMS_DIR = comsDir;
	try {
		return await run();
	} finally {
		if (prev === undefined) delete process.env.PI_COMS_DIR;
		else process.env.PI_COMS_DIR = prev;
	}
}

test("before_agent_start says coms is not bound before session_start", async () => {
	const { handlers } = loadExtension({
		flags: { cname: "alice", project: "demo" },
	});
	const result = await handlers.get("before_agent_start")?.({
		systemPrompt: "base",
	} as never);
	assert.deepEqual(result, {
		systemPrompt: "base\n\ncoms is not bound.",
	});
});

test("before_agent_start stamps the bound peer onto the system prompt", async () => {
	await withComsDir(async () => {
		const { handlers } = loadExtension({
			flags: { cname: "alice", project: "demo" },
		});
		try {
			await handlers.get("session_start")?.({} as never, sessionCtx() as never);
			const result = await handlers.get("before_agent_start")?.({
				systemPrompt: "base",
			} as never);
			assert.deepEqual(result, {
				systemPrompt: "base\n\nYou are coms peer alice on project demo.",
			});
		} finally {
			await handlers.get("session_shutdown")?.();
		}
	});
});

test("coms_list includes this session", async () => {
	await withComsDir(async () => {
		const { tools, handlers } = loadExtension({
			flags: { cname: "alice", project: "demo" },
		});
		try {
			await handlers.get("session_start")?.({} as never, sessionCtx() as never);
			const listed = await tool(tools, "coms_list").execute("1", {});
			assert.equal(
				listed.content[0]?.text,
				"1 peer(s):\nalice grok alive /work this-session",
			);
		} finally {
			await handlers.get("session_shutdown")?.();
		}
	});
});

test("two inbounds before one agent_end does not leave the first msg_id pending", async () => {
	await withComsDir(async () => {
		const { handlers } = loadExtension({
			flags: { cname: "alice", project: "demo" },
		});
		const extras: BoundPeer[] = [];
		try {
			await handlers.get("session_start")?.({} as never, sessionCtx() as never);
			const comsDir = process.env.PI_COMS_DIR;
			if (!comsDir) throw new Error("missing PI_COMS_DIR");
			const planner = await bindPeer({
				comsDir,
				name: "planner",
				project: "demo",
			});
			extras.push(planner);
			const reviewer = await bindPeer({
				comsDir,
				name: "reviewer",
				project: "demo",
			});
			extras.push(reviewer);

			const first = await planner.send({
				target: "alice",
				prompt: "job-1",
			});
			const second = await reviewer.send({
				target: "alice",
				prompt: "job-2",
			});
			assert.equal(planner.get(first.msg_id).status, "pending");
			assert.equal(reviewer.get(second.msg_id).status, "pending");

			await handlers.get("agent_end")?.(
				{} as never,
				{
					...sessionCtx(),
					sessionManager: {
						getBranch() {
							return [
								{
									type: "message",
									message: {
										role: "assistant",
										content: "turn-done",
									},
								},
							];
						},
					},
				} as never,
			);

			const firstDone = planner.get(first.msg_id);
			assert.notEqual(firstDone.status, "pending");
			assert.equal(firstDone.status, "complete");
			if (firstDone.status !== "complete") throw new Error("expected complete");
			assert.equal(firstDone.response, "turn-done");

			const secondDone = reviewer.get(second.msg_id);
			assert.equal(secondDone.status, "complete");
			if (secondDone.status !== "complete") throw new Error("expected complete");
			assert.equal(secondDone.response, "turn-done");
		} finally {
			for (const extra of extras) await extra.shutdown();
			await handlers.get("session_shutdown")?.();
		}
	});
});
