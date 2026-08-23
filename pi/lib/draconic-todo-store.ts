import {
	existsSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	statSync,
	writeFileSync,
} from "node:fs";
import { join, resolve, sep } from "node:path";

export type SessionId = string & { readonly __brand: "SessionId" };

const SESSION_ID_PATTERN = /^[A-Za-z0-9._-]+$/;

export const STUB_TODO_MARKDOWN = `# Session checklists

Do not write a playbook checklist here. Call \`draconic_todo\`.
Each session owns \`.draconic/sessions/<sessionId>/TODO.md\`.
Use action \`list\` to see sibling checklists.
`;

export function parseSessionId(raw: string): SessionId {
	if (raw === "." || raw === ".." || !SESSION_ID_PATTERN.test(raw)) {
		throw new Error(`invalid session id: ${raw}`);
	}
	return raw as SessionId;
}

export function stubTodoPath(cwd: string): string {
	return join(cwd, ".draconic", "TODO.md");
}

export function sessionTodoPath(cwd: string, sessionId: SessionId): string {
	return join(cwd, ".draconic", "sessions", sessionId, "TODO.md");
}

function withTrailingNewline(markdown: string): string {
	return markdown.endsWith("\n") ? markdown : `${markdown}\n`;
}

export function writeSessionChecklist(input: {
	cwd: string;
	sessionId: SessionId;
	markdown: string;
}): { sessionPath: string; stubPath: string } {
	const sessionPath = sessionTodoPath(input.cwd, input.sessionId);
	const stubPath = stubTodoPath(input.cwd);
	mkdirSync(join(input.cwd, ".draconic", "sessions", input.sessionId), {
		recursive: true,
	});
	writeFileSync(sessionPath, withTrailingNewline(input.markdown), "utf8");
	writeFileSync(stubPath, STUB_TODO_MARKDOWN, "utf8");
	return { sessionPath, stubPath };
}

function firstNonEmptyLine(text: string): string {
	for (const line of text.split("\n")) {
		const trimmed = line.trim();
		if (trimmed) return trimmed;
	}
	return "(empty)";
}

export function listSessionChecklists(cwd: string): Array<{
	sessionId: string;
	path: string;
	title: string;
}> {
	const sessionsDir = join(cwd, ".draconic", "sessions");
	if (!existsSync(sessionsDir)) return [];
	const listed: Array<{ sessionId: string; path: string; title: string }> = [];
	for (const entry of readdirSync(sessionsDir)) {
		let sessionId: SessionId;
		try {
			sessionId = parseSessionId(entry);
		} catch {
			continue;
		}
		const path = sessionTodoPath(cwd, sessionId);
		if (!existsSync(path) || !statSync(path).isFile()) continue;
		listed.push({
			sessionId,
			path,
			title: firstNonEmptyLine(readFileSync(path, "utf8")),
		});
	}
	return listed.sort((a, b) => a.sessionId.localeCompare(b.sessionId));
}

export function isProtectedTodoPath(cwd: string, rawPath: string): boolean {
	const trimmed = rawPath.replace(/^@/, "");
	if (!trimmed) return false;
	const absolute = resolve(cwd, trimmed);
	if (absolute === resolve(stubTodoPath(cwd))) return true;
	const sessionsRoot = resolve(cwd, ".draconic", "sessions");
	const prefix = sessionsRoot.endsWith(sep)
		? sessionsRoot
		: `${sessionsRoot}${sep}`;
	if (!absolute.startsWith(prefix)) return false;
	const rel = absolute.slice(prefix.length);
	const parts = rel.split(sep);
	if (parts.length !== 2 || parts[1] !== "TODO.md") return false;
	try {
		parseSessionId(parts[0] ?? "");
		return true;
	} catch {
		return false;
	}
}
