import type {
	ExtensionAPI,
	ExtensionContext,
} from "@earendil-works/pi-coding-agent";
import { formatCwdFromRoot, formatFooterLine } from "./format.ts";

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
					model: ctx.model?.id ?? "no-model",
					effort: ctx.thinkingLevel,
				});
				const clipped = line.length > width ? line.slice(0, width) : line;
				return [theme.fg("dim", clipped)];
			},
		}));
	});
}
