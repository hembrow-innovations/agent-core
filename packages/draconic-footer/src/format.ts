// Edit formatFooterLine to change the one-line footer.
import { existsSync } from "node:fs";
import { basename, dirname, join, relative, resolve, sep } from "node:path";

export type FooterFields = {
	cwd: string;
	teamStatus?: string;
	tokens: number | null;
	contextWindow: number;
	cost: number;
	model: string;
	effort?: string;
};

function findGitRoot(cwd: string): string | undefined {
	let dir = resolve(cwd);
	while (true) {
		if (existsSync(join(dir, ".git"))) return dir;
		const parent = dirname(dir);
		if (parent === dir) return undefined;
		dir = parent;
	}
}

function posixJoin(parts: string[]): string {
	return parts.filter((part) => part.length > 0).join("/");
}

export function formatCwdFromRoot(cwd: string): string {
	const abs = resolve(cwd);
	const root = findGitRoot(abs);
	if (!root) return basename(abs);
	const rel = relative(root, abs);
	if (!rel || rel === ".") return basename(root);
	return posixJoin([basename(root), ...rel.split(sep)]);
}

export function formatTokens(count: number): string {
	if (count < 1000) return count.toString();
	if (count < 10000) return `${(count / 1000).toFixed(1)}k`;
	if (count < 1000000) return `${Math.round(count / 1000)}k`;
	if (count < 10000000) return `${(count / 1000000).toFixed(1)}M`;
	return `${Math.round(count / 1000000)}M`;
}

export function formatFooterLine(fields: FooterFields): string {
	const tokens = fields.tokens === null ? "?" : formatTokens(fields.tokens);
	const parts = [
		fields.cwd,
		fields.teamStatus?.trim() || undefined,
		`${tokens}/${formatTokens(fields.contextWindow)}`,
		`$${fields.cost.toFixed(3)}`,
		fields.model,
		fields.effort,
	].filter((part): part is string => Boolean(part && part.length > 0));
	return parts.join(" ");
}
