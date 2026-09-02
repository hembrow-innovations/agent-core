import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { readStackStatus, sliceDir, type SliceRef } from "./status.ts";

export type AdvanceResult = { ok: boolean; text: string };

const TARGETS = ["active", "met", "abandoned"] as const;
const ALLOWED: Record<string, readonly string[]> = {
	frozen: ["active"],
	active: ["met", "abandoned"],
};

const QUALIFIED = /^(s-[a-z0-9-]+):(active|met|abandoned)$/;

export function isBuilderShaped(input: {
	prompt?: string;
	sessionName?: string;
	agent?: string;
}): boolean {
	const haystack = [input.prompt, input.sessionName, input.agent]
		.filter((value): value is string => typeof value === "string")
		.join("\n");
	return /\bheio-builder\b/.test(haystack);
}

function unquote(value: string): string {
	const trimmed = value.trim();
	if (
		(trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length >= 2) ||
		(trimmed.startsWith("'") && trimmed.endsWith("'") && trimmed.length >= 2)
	) {
		return trimmed.slice(1, -1);
	}
	return trimmed;
}

function readStatus(path: string): string | undefined {
	let raw: string;
	try {
		raw = readFileSync(path, "utf8");
	} catch {
		return undefined;
	}
	if (!raw.startsWith("---")) return undefined;
	const end = raw.indexOf("\n---", 3);
	if (end === -1) return undefined;
	for (const line of raw.slice(3, end).split("\n")) {
		const trimmed = line.trim();
		if (!trimmed.startsWith("status:")) continue;
		return unquote(trimmed.slice("status:".length));
	}
	return undefined;
}

function setStatus(raw: string, status: string): string {
	if (!raw.startsWith("---")) return raw;
	const end = raw.indexOf("\n---", 3);
	if (end === -1) return raw;
	const head = raw.slice(0, end);
	const rest = raw.slice(end);
	if (/^status:\s*.*$/m.test(head)) {
		return `${head.replace(/^status:\s*.*$/m, `status: "${status}"`)}${rest}`;
	}
	return `${head}\nstatus: "${status}"${rest}`;
}

function specPathFor(cwd: string, slice: SliceRef): string {
	return join(sliceDir(cwd, slice), "spec.md");
}

function parseTarget(target: string): {
	sliceId?: string;
	status: string;
} | null {
	const qualified = target.match(QUALIFIED);
	if (qualified?.[1] && qualified[2]) {
		return { sliceId: qualified[1], status: qualified[2] };
	}
	if (TARGETS.includes(target as (typeof TARGETS)[number])) {
		return { status: target };
	}
	return null;
}

function pickSlice(
	cwd: string,
	sliceId: string | undefined,
	status: string,
): AdvanceResult | SliceRef {
	const live = readStackStatus(cwd).slices;
	const named = sliceId
		? live.filter((slice) => slice.sliceId === sliceId)
		: live;
	const eligible = named.filter((slice) => {
		const allowed = ALLOWED[slice.status];
		return Boolean(allowed?.includes(status));
	});
	if (eligible.length === 1 && eligible[0]) return eligible[0];
	if (eligible.length > 1) {
		const names = eligible
			.map((slice) => `${slice.sliceId}:${status}`)
			.join(" or ");
		return {
			ok: false,
			text: `Use heio_stack. Name the slice: ${names}.`,
		};
	}
	if (named.length === 1 && named[0]) return named[0];
	if (sliceId) {
		return { ok: false, text: `Use heio_stack. No slice ${sliceId} to advance.` };
	}
	return { ok: false, text: "Use heio_stack. No slice to advance." };
}

export function advanceSlice(input: {
	cwd: string;
	target: string;
	builder: boolean;
}): AdvanceResult {
	if (input.builder) {
		return {
			ok: false,
			text: "Use heio_stack. Builder cannot mark the slice met.",
		};
	}
	const parsed = parseTarget(input.target);
	if (!parsed) {
		return {
			ok: false,
			text: "target must be active, met, or abandoned",
		};
	}
	const picked = pickSlice(input.cwd, parsed.sliceId, parsed.status);
	if ("ok" in picked) return picked;
	const path = specPathFor(input.cwd, picked);
	if (!existsSync(path)) {
		return { ok: false, text: "Use heio_stack. No slice to advance." };
	}
	const current = readStatus(path);
	const allowed = current ? ALLOWED[current] : undefined;
	if (!current || !allowed || !allowed.includes(parsed.status)) {
		return {
			ok: false,
			text: `Use heio_stack. Cannot advance ${current ?? "none"} to ${parsed.status}.`,
		};
	}
	let raw: string;
	try {
		raw = readFileSync(path, "utf8");
	} catch {
		return { ok: false, text: "Use heio_stack. No slice to advance." };
	}
	writeFileSync(path, setStatus(raw, parsed.status), "utf8");
	return {
		ok: true,
		text: `advanced ${picked.sliceId} to ${parsed.status}`,
	};
}
