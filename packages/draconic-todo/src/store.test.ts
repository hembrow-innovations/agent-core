import { describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
	isProtectedTodoPath,
	listSessionChecklists,
	parseSessionId,
	STUB_TODO_MARKDOWN,
	sessionTodoPath,
	stubTodoPath,
	writeSessionChecklist,
} from "./store.ts";

const uuidA = "01a02e18-de1b-73f6-a111-111111111111";
const uuidB = "01a02e18-de1b-73f6-b222-222222222222";

function tempCwd(): string {
	return mkdtempSync(join(tmpdir(), "draconic-todo-"));
}

describe("parseSessionId", () => {
	it("accepts a uuid-like id", () => {
		expect(parseSessionId(uuidA)).toBe(uuidA);
	});

	it("rejects path traversal, slashes, empty, and spaces", () => {
		expect(() => parseSessionId("../x")).toThrow();
		expect(() => parseSessionId("a/b")).toThrow();
		expect(() => parseSessionId("")).toThrow();
		expect(() => parseSessionId("a b")).toThrow();
	});
});

describe("writeSessionChecklist", () => {
	it("writes the session file and the exact stub", () => {
		const cwd = tempCwd();
		const sessionId = parseSessionId(uuidA);
		const markdown = "# Feature\n\n- [ ] read principles";
		const result = writeSessionChecklist({ cwd, sessionId, markdown });

		expect(result.sessionPath).toBe(sessionTodoPath(cwd, sessionId));
		expect(result.stubPath).toBe(stubTodoPath(cwd));
		expect(readFileSync(result.sessionPath, "utf8")).toBe(
			"# Feature\n\n- [ ] read principles\n",
		);
		expect(readFileSync(result.stubPath, "utf8")).toBe(STUB_TODO_MARKDOWN);
	});

	it("keeps two session files and replaces only the writer", () => {
		const cwd = tempCwd();
		const a = parseSessionId(uuidA);
		const b = parseSessionId(uuidB);
		writeSessionChecklist({ cwd, sessionId: a, markdown: "alpha-one" });
		writeSessionChecklist({ cwd, sessionId: b, markdown: "bravo" });
		writeSessionChecklist({ cwd, sessionId: a, markdown: "alpha-two" });

		expect(readFileSync(sessionTodoPath(cwd, a), "utf8")).toBe("alpha-two\n");
		expect(readFileSync(sessionTodoPath(cwd, b), "utf8")).toBe("bravo\n");
		expect(readFileSync(stubTodoPath(cwd), "utf8")).toBe(STUB_TODO_MARKDOWN);
	});
});

describe("listSessionChecklists", () => {
	it("returns both sessions sorted with first-line titles", () => {
		const cwd = tempCwd();
		writeSessionChecklist({
			cwd,
			sessionId: parseSessionId(uuidB),
			markdown: "# Bravo\n\n- [ ] later",
		});
		writeSessionChecklist({
			cwd,
			sessionId: parseSessionId(uuidA),
			markdown: "# Alpha\n\n- [ ] first",
		});
		mkdirSync(join(cwd, ".draconic", "sessions", "junk"), { recursive: true });
		writeFileSync(
			join(cwd, ".draconic", "sessions", "not-a-session.txt"),
			"nope",
		);
		mkdirSync(join(cwd, ".draconic", "sessions", "a/b"), { recursive: true });

		expect(listSessionChecklists(cwd)).toEqual([
			{
				sessionId: uuidA,
				path: sessionTodoPath(cwd, parseSessionId(uuidA)),
				title: "# Alpha",
			},
			{
				sessionId: uuidB,
				path: sessionTodoPath(cwd, parseSessionId(uuidB)),
				title: "# Bravo",
			},
		]);
	});
});

describe("isProtectedTodoPath", () => {
	it("protects the stub and session checklist paths", () => {
		const cwd = tempCwd();
		const sessionPath = sessionTodoPath(cwd, parseSessionId(uuidA));
		expect(isProtectedTodoPath(cwd, ".draconic/TODO.md")).toBe(true);
		expect(isProtectedTodoPath(cwd, "@.draconic/TODO.md")).toBe(true);
		expect(isProtectedTodoPath(cwd, stubTodoPath(cwd))).toBe(true);
		expect(isProtectedTodoPath(cwd, sessionPath)).toBe(true);
		expect(isProtectedTodoPath(cwd, ".draconic/decisions.tsv")).toBe(false);
		expect(isProtectedTodoPath(cwd, "src/foo.ts")).toBe(false);
	});
});
