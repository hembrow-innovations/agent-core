import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { readStackStatus, type SliceRef } from "./status.ts";

export type OracleResult = { ok: boolean; text: string };

const MODES = ["status", "reverify"] as const;
const QUALIFIED = /^(s-[a-z0-9-]+):(status|reverify)$/;

function parseTarget(target: string): {
	sliceId?: string;
	mode: string;
} | null {
	const qualified = target.match(QUALIFIED);
	if (qualified?.[1] && qualified[2]) {
		return { sliceId: qualified[1], mode: qualified[2] };
	}
	if (MODES.includes(target as (typeof MODES)[number])) {
		return { mode: target };
	}
	return null;
}

function pickLedgerSlice(
	cwd: string,
	sliceId: string | undefined,
): OracleResult | SliceRef {
	const live = readStackStatus(cwd).slices.filter(
		(slice) => slice.status === "frozen" || slice.status === "active",
	);
	const named = sliceId
		? live.filter((slice) => slice.sliceId === sliceId)
		: live;
	if (named.length === 1 && named[0]) return named[0];
	if (named.length > 1) {
		const names = named.map((slice) => `${slice.sliceId}:status`).join(" or ");
		return {
			ok: false,
			text: `Use heio_stack. Name the slice: ${names}.`,
		};
	}
	return { ok: false, text: "no slice ledger" };
}

function sliceLedger(cwd: string, slice: SliceRef): string {
	return join(
		".heio",
		"planning",
		"sprints",
		slice.sprintId,
		"slices",
		slice.sliceId,
		"oracles.md",
	);
}

export function runOracle(input: { cwd: string; mode: string }): OracleResult {
	const parsed = parseTarget(input.mode);
	if (!parsed) {
		return { ok: false, text: "target must be status or reverify" };
	}
	const picked = pickLedgerSlice(input.cwd, parsed.sliceId);
	if ("ok" in picked) return picked;
	const ledger = sliceLedger(input.cwd, picked);
	const script = join(
		input.cwd,
		".pi",
		"skills",
		"oracle",
		"scripts",
		"oracle-check.mjs",
	);
	if (!existsSync(script)) {
		return { ok: false, text: "missing oracle-check.mjs" };
	}
	const result = spawnSync(
		process.execPath,
		[script, `--${parsed.mode}`, ledger],
		{
			cwd: input.cwd,
			encoding: "utf8",
			timeout: 120_000,
			env: process.env,
		},
	);
	const text = `${result.stdout ?? ""}${result.stderr ?? ""}`;
	return { ok: result.status === 0, text };
}
