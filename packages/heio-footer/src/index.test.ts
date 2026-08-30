import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import type {
	ExtensionAPI,
	ExtensionContext,
	FooterData,
	TUI,
} from "@earendil-works/pi-coding-agent";
import { CONFIG_DIR_NAME } from "@earendil-works/pi-coding-agent";
import footerExtension from "./index.ts";
import { visibleWidth } from "./format.ts";

type FooterWidget = {
	render: (width: number) => string[];
};

type Theme = {
	fg: (name: string, text: string) => string;
};

function tempCwd(): string {
	return mkdtempSync(join(tmpdir(), "heio-footer-"));
}

function writeProjectSettings(cwd: string, body: string) {
	mkdirSync(join(cwd, CONFIG_DIR_NAME), { recursive: true });
	writeFileSync(join(cwd, CONFIG_DIR_NAME, "settings.json"), body);
}

function loadFactory(): {
	sessionStart: (
		event: { type: "session_start" },
		ctx: ExtensionContext,
	) => void;
} {
	let sessionStart:
		| ((event: { type: "session_start" }, ctx: ExtensionContext) => void)
		| undefined;
	footerExtension({
		on(event, handler) {
			if (event === "session_start") {
				sessionStart = handler as (
					event: { type: "session_start" },
					ctx: ExtensionContext,
				) => void;
			}
		},
	} as ExtensionAPI);
	if (!sessionStart) {
		throw new Error("factory did not register session_start");
	}
	return { sessionStart };
}

function usage(total: number) {
	return { cost: { total } };
}

function footerCtx(input: {
	cwd: string;
	mode: ExtensionContext["mode"];
	entries?: unknown[];
	tokens?: number | null;
}): {
	ctx: ExtensionContext;
	footer: { current: FooterWidget | undefined };
	setFooterCalls: number;
} {
	const footer: { current: FooterWidget | undefined } = { current: undefined };
	let setFooterCalls = 0;
	const ctx = {
		cwd: input.cwd,
		mode: input.mode,
		model: { id: "gpt-5.4", contextWindow: 1000 },
		thinkingLevel: "high",
		getContextUsage() {
			return {
				tokens: input.tokens ?? 80,
				contextWindow: 1000,
			};
		},
		sessionManager: {
			getEntries() {
				return input.entries ?? [];
			},
		},
		ui: {
			setFooter(
				factory: (tui: TUI, theme: Theme, footerData: FooterData) => FooterWidget,
			) {
				setFooterCalls += 1;
				footer.current = factory(
					{} as TUI,
					{ fg: (_name: string, text: string) => text },
					{
						getExtensionStatuses() {
							return new Map([["team", "team alpha"]]);
						},
					} as FooterData,
				);
			},
		},
	} as ExtensionContext;
	return {
		ctx,
		footer,
		get setFooterCalls() {
			return setFooterCalls;
		},
	};
}

test("non-tui mode does not set a footer", () => {
	const { sessionStart } = loadFactory();
	const loaded = footerCtx({ cwd: tempCwd(), mode: "print" });
	sessionStart({ type: "session_start" }, loaded.ctx);
	assert.equal(loaded.setFooterCalls, 0);
	assert.equal(loaded.footer.current, undefined);
});

test("tui footer cost includes assistant toolResult compaction and branch_summary", () => {
	const cwd = tempCwd();
	writeProjectSettings(cwd, JSON.stringify({ compaction: { enabled: false } }));
	const { sessionStart } = loadFactory();
	const loaded = footerCtx({
		cwd,
		mode: "tui",
		entries: [
			{ type: "message", message: { role: "assistant", usage: usage(1) } },
			{ type: "message", message: { role: "toolResult", usage: usage(0.2) } },
			{ type: "compaction", usage: usage(0.05) },
			{ type: "branch_summary", usage: usage(0.03) },
			{ type: "message", message: { role: "user" } },
		],
	});
	sessionStart({ type: "session_start" }, loaded.ctx);
	assert.equal(loaded.setFooterCalls, 1);
	const line = loaded.footer.current?.render(120)[0];
	assert.match(line ?? "", /\$1\.280/);
});

test("corrupt project compaction settings do not paint (auto)", () => {
	const cwd = tempCwd();
	writeProjectSettings(cwd, "{not json");
	const { sessionStart } = loadFactory();
	const loaded = footerCtx({ cwd, mode: "tui" });
	sessionStart({ type: "session_start" }, loaded.ctx);
	const line = loaded.footer.current?.render(120)[0] ?? "";
	assert.equal(line.includes("(auto)"), false);
});

test("non-boolean compaction enabled does not paint (auto)", () => {
	const cwd = tempCwd();
	writeProjectSettings(cwd, JSON.stringify({ compaction: { enabled: "yes" } }));
	const { sessionStart } = loadFactory();
	const loaded = footerCtx({ cwd, mode: "tui" });
	sessionStart({ type: "session_start" }, loaded.ctx);
	const line = loaded.footer.current?.render(120)[0] ?? "";
	assert.equal(line.includes("(auto)"), false);
});

test("tui footer clips to terminal visible width", () => {
	const cwd = tempCwd();
	writeProjectSettings(cwd, JSON.stringify({ compaction: { enabled: false } }));
	const { sessionStart } = loadFactory();
	const loaded = footerCtx({ cwd, mode: "tui" });
	sessionStart({ type: "session_start" }, loaded.ctx);
	const line = loaded.footer.current?.render(8)[0] ?? "";
	assert.ok(visibleWidth(line) <= 8);
});
