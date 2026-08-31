import assert from "node:assert/strict";
import {
	mkdirSync,
	mkdtempSync,
	readFileSync,
	statSync,
	symlinkSync,
	utimesSync,
	writeFileSync,
} from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join, relative } from "node:path";
import { describe, it } from "node:test";
import { pathToFileURL } from "node:url";
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
	return mkdtempSync(join(tmpdir(), "heio-todo-"));
}

describe("parseSessionId", () => {
	it("accepts a uuid-like id", () => {
		assert.equal(parseSessionId(uuidA), uuidA);
	});

	it("rejects path traversal, slashes, empty, and spaces", () => {
		assert.throws(() => parseSessionId("../x"));
		assert.throws(() => parseSessionId("a/b"));
		assert.throws(() => parseSessionId(""));
		assert.throws(() => parseSessionId("a b"));
	});
});

describe("writeSessionChecklist", () => {
	it("writes the session file and the exact stub", () => {
		const cwd = tempCwd();
		const sessionId = parseSessionId(uuidA);
		const markdown = "# Feature\n\n- [ ] read principles";
		const result = writeSessionChecklist({ cwd, sessionId, markdown });

		assert.equal(result.sessionPath, sessionTodoPath(cwd, sessionId));
		assert.equal(result.stubPath, stubTodoPath(cwd));
		assert.equal(
			readFileSync(result.sessionPath, "utf8"),
			"# Feature\n\n- [ ] read principles\n",
		);
		assert.equal(readFileSync(result.stubPath, "utf8"), STUB_TODO_MARKDOWN);
	});

	it("keeps two session files and replaces only the writer", () => {
		const cwd = tempCwd();
		const a = parseSessionId(uuidA);
		const b = parseSessionId(uuidB);
		writeSessionChecklist({ cwd, sessionId: a, markdown: "alpha-one" });
		writeSessionChecklist({ cwd, sessionId: b, markdown: "bravo" });
		writeSessionChecklist({ cwd, sessionId: a, markdown: "alpha-two" });

		assert.equal(readFileSync(sessionTodoPath(cwd, a), "utf8"), "alpha-two\n");
		assert.equal(readFileSync(sessionTodoPath(cwd, b), "utf8"), "bravo\n");
		assert.equal(readFileSync(stubTodoPath(cwd), "utf8"), STUB_TODO_MARKDOWN);
	});

	it("does not rewrite an already-correct stub", () => {
		const cwd = tempCwd();
		const a = parseSessionId(uuidA);
		const b = parseSessionId(uuidB);
		writeSessionChecklist({ cwd, sessionId: a, markdown: "alpha" });
		const stub = stubTodoPath(cwd);
		const past = new Date("2020-01-01T00:00:00Z");
		utimesSync(stub, past, past);
		writeSessionChecklist({ cwd, sessionId: b, markdown: "bravo" });
		assert.equal(statSync(stub).mtimeMs, past.getTime());
		assert.equal(readFileSync(stub, "utf8"), STUB_TODO_MARKDOWN);
	});

	it("restores a corrupted stub", () => {
		const cwd = tempCwd();
		const sessionId = parseSessionId(uuidA);
		writeSessionChecklist({ cwd, sessionId, markdown: "alpha" });
		writeFileSync(stubTodoPath(cwd), "wrong\n");
		writeSessionChecklist({ cwd, sessionId, markdown: "alpha-two" });
		assert.equal(readFileSync(stubTodoPath(cwd), "utf8"), STUB_TODO_MARKDOWN);
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
		mkdirSync(join(cwd, ".heio", "sessions", "junk"), { recursive: true });
		writeFileSync(join(cwd, ".heio", "sessions", "not-a-session.txt"), "nope");
		mkdirSync(join(cwd, ".heio", "sessions", "a/b"), { recursive: true });

		assert.deepEqual(listSessionChecklists(cwd), [
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
		assert.equal(isProtectedTodoPath(cwd, ".heio/TODO.md"), true);
		assert.equal(isProtectedTodoPath(cwd, "@.heio/TODO.md"), true);
		assert.equal(isProtectedTodoPath(cwd, stubTodoPath(cwd)), true);
		assert.equal(isProtectedTodoPath(cwd, sessionPath), true);
		assert.equal(isProtectedTodoPath(cwd, ".heio/decisions.tsv"), false);
		assert.equal(isProtectedTodoPath(cwd, "src/foo.ts"), false);
	});

	it("protects home file-url and symlink aliases", () => {
		const cwd = tempCwd();
		const sessionId = parseSessionId(uuidA);
		writeSessionChecklist({ cwd, sessionId, markdown: "# Alpha" });
		const stub = stubTodoPath(cwd);
		const sessionPath = sessionTodoPath(cwd, sessionId);
		const homeRel = `~/${relative(homedir(), stub)}`;
		assert.equal(isProtectedTodoPath(cwd, homeRel), true);
		assert.equal(isProtectedTodoPath(cwd, pathToFileURL(stub).href), true);
		assert.equal(isProtectedTodoPath(cwd, pathToFileURL(sessionPath).href), true);
		const alias = join(cwd, "alias-todo");
		symlinkSync(stub, alias);
		assert.equal(isProtectedTodoPath(cwd, alias), true);
		assert.equal(
			isProtectedTodoPath(cwd, `.heio/sessions/${uuidA}/TODO.md`),
			true,
		);
	});
});
