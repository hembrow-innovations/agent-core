import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type SliceRef = {
	sprintId: string;
	sliceId: string;
	status: string;
};

export type StackStatus = {
	sprints: string[];
	slices: SliceRef[];
	tickets: string[];
};

type Note = { id: string; status: string };

const LIVE_SPRINT = new Set(["shaping", "active", "review"]);
const LIVE_SLICE = new Set(["shaping", "frozen", "active"]);

function unquote(value: string): string {
	if (
		(value.startsWith('"') && value.endsWith('"') && value.length >= 2) ||
		(value.startsWith("'") && value.endsWith("'") && value.length >= 2)
	) {
		return value.slice(1, -1);
	}
	return value;
}

function readFrontmatter(path: string): Record<string, string> {
	let raw: string;
	try {
		raw = readFileSync(path, "utf8");
	} catch {
		return {};
	}
	if (!raw.startsWith("---")) return {};
	const end = raw.indexOf("\n---", 3);
	if (end === -1) return {};
	const block = raw.slice(3, end);
	const fields: Record<string, string> = {};
	for (const line of block.split("\n")) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#")) continue;
		const colon = trimmed.indexOf(":");
		if (colon <= 0) continue;
		const key = trimmed.slice(0, colon).trim();
		const value = unquote(trimmed.slice(colon + 1).trim());
		if (key) fields[key] = value;
	}
	return fields;
}

function noteFrom(path: string, fallbackId: string): Note | undefined {
	if (!existsSync(path)) return undefined;
	const fields = readFrontmatter(path);
	const id = fields.id || fallbackId;
	const status = fields.status;
	if (!status) return undefined;
	return { id, status };
}

function listDirs(path: string): string[] {
	if (!existsSync(path)) return [];
	return readdirSync(path, { withFileTypes: true })
		.filter((ent) => ent.isDirectory())
		.map((ent) => ent.name)
		.sort();
}

function listMarkdown(path: string): string[] {
	if (!existsSync(path)) return [];
	return readdirSync(path)
		.filter((name) => name.endsWith(".md"))
		.sort();
}

function readSprints(cwd: string): Note[] {
	const root = join(cwd, ".heio", "planning", "sprints");
	const notes: Note[] = [];
	for (const id of listDirs(root)) {
		const note = noteFrom(join(root, id, "shape.md"), id);
		if (note) notes.push(note);
	}
	return notes;
}

function readSlices(cwd: string, sprintId: string): Note[] {
	const root = join(cwd, ".heio", "planning", "sprints", sprintId, "slices");
	const notes: Note[] = [];
	for (const id of listDirs(root)) {
		const note = noteFrom(join(root, id, "spec.md"), id);
		if (note) notes.push(note);
	}
	return notes;
}

function readOpenTickets(cwd: string): string[] {
	const root = join(cwd, ".heio", "tickets");
	const ids: string[] = [];
	for (const name of listMarkdown(root)) {
		const note = noteFrom(join(root, name), name.replace(/\.md$/, ""));
		if (note?.status === "open") ids.push(note.id);
	}
	return ids;
}

export function sliceDir(cwd: string, slice: SliceRef): string {
	return join(
		cwd,
		".heio",
		"planning",
		"sprints",
		slice.sprintId,
		"slices",
		slice.sliceId,
	);
}

export function readStackStatus(cwd: string): StackStatus {
	const sprints = readSprints(cwd).filter((note) =>
		LIVE_SPRINT.has(note.status),
	);
	const slices: SliceRef[] = [];
	for (const sprint of sprints) {
		for (const slice of readSlices(cwd, sprint.id)) {
			if (!LIVE_SLICE.has(slice.status)) continue;
			slices.push({
				sprintId: sprint.id,
				sliceId: slice.id,
				status: slice.status,
			});
		}
	}
	return {
		sprints: sprints.map((note) => note.id),
		slices,
		tickets: readOpenTickets(cwd),
	};
}

export function formatStackStatus(status: StackStatus): string {
	const sprints = status.sprints.length > 0 ? status.sprints.join(", ") : "none";
	const slices =
		status.slices.length > 0
			? status.slices
					.map((slice) => `${slice.sprintId}/${slice.sliceId}:${slice.status}`)
					.join(", ")
			: "none";
	const tickets = status.tickets.length > 0 ? status.tickets.join(", ") : "none";
	return [
		`sprints: ${sprints}`,
		`slices: ${slices}`,
		`tickets: ${tickets}`,
	].join("\n");
}
