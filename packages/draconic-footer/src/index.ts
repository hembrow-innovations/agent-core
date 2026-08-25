import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
	CONFIG_DIR_NAME,
	type ExtensionAPI,
	type ExtensionContext,
	getAgentDir,
} from "@earendil-works/pi-coding-agent";
import { formatCwdFromRoot, formatFooterLine } from "./format.ts";

function compactionEnabledFromFile(path: string): boolean | undefined {
	if (!existsSync(path)) return undefined;
	try {
		const raw: unknown = JSON.parse(readFileSync(path, "utf8"));
		if (!raw || typeof raw !== "object") return undefined;
		if (!("compaction" in raw)) return undefined;
		const compaction = raw.compaction;
		if (!compaction || typeof compaction !== "object") return undefined;
		if (!("enabled" in compaction)) return undefined;
		return typeof compaction.enabled === "boolean"
			? compaction.enabled
			: undefined;
	} catch {
		return undefined;
	}
}

function autoCompactEnabled(cwd: string): boolean {
	const project = compactionEnabledFromFile(
		join(cwd, CONFIG_DIR_NAME, "settings.json"),
	);
	if (project !== undefined) return project;
	const global = compactionEnabledFromFile(join(getAgentDir(), "settings.json"));
	if (global !== undefined) return global;
	return true;
}

function assistantCost(ctx: ExtensionContext): number {
	let cost = 0;
	for (const entry of ctx.sessionManager.getEntries()) {
		if (entry.type !== "message") continue;
		if (entry.message.role !== "assistant") continue;
		cost += entry.message.usage.cost.total;
	}
	return cost;
}

export default function (pi: ExtensionAPI) {
	pi.on("session_start", (_event, ctx) => {
		if (ctx.mode !== "tui") return;
		ctx.ui.setFooter((_tui, theme, footerData) => ({
			invalidate() {},
			render(width: number): string[] {
				const usage = ctx.getContextUsage();
				const line = formatFooterLine({
					cwd: formatCwdFromRoot(ctx.cwd),
					teamStatus: footerData.getExtensionStatuses().get("team"),
					tokens: usage?.tokens ?? null,
					contextWindow: usage?.contextWindow ?? ctx.model?.contextWindow ?? 0,
					cost: assistantCost(ctx),
					autoCompact: autoCompactEnabled(ctx.cwd),
					model: ctx.model?.id ?? "no-model",
					effort: ctx.thinkingLevel,
				});
				const clipped = line.length > width ? line.slice(0, width) : line;
				return [theme.fg("dim", clipped)];
			},
		}));
	});
}
