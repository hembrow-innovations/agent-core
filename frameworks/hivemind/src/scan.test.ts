import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { scan } from "./scan.ts";

const NOW = new Date("2026-09-01T18:00:00.000Z");

const CONFIG = `folders:
  - path: notes
    schema:
      id: string
    required: [id]
  - path: quarantine
    schema: quarantine
    required: [origin-location, quarantined-at, fault]
lanes: []
`;

function setup(): string {
  const cwd = mkdtempSync(join(tmpdir(), "hivemind-scan-"));
  writeFileSync(join(cwd, "hivemind.yaml"), CONFIG);
  mkdirSync(join(cwd, "notes"));
  mkdirSync(join(cwd, "quarantine"));
  return cwd;
}

test("parse error moves the file to quarantine with only three keys; scan continues", () => {
  const cwd = setup();
  writeFileSync(join(cwd, "notes", "bad.md"), "# no front matter\n");
  writeFileSync(
    join(cwd, "notes", "good.md"),
    "---\nid: good\n---\n\n# keep this body\n",
  );

  const result = scan({ cwd, now: NOW });

  assert.equal(existsSync(join(cwd, "notes", "bad.md")), false);
  const quarantined = readFileSync(join(cwd, "quarantine", "bad.md"), "utf8");
  assert.equal(
    quarantined,
    "---\norigin-location: notes/bad.md\nquarantined-at: 2026-09-01T18:00:00.000Z\nfault: parse-error\n---\n",
  );
  assert.equal(
    readFileSync(join(cwd, "notes", "good.md"), "utf8"),
    "---\nid: good\n---\n\n# keep this body\n",
  );
  assert.deepEqual(
    result.notes.map((note) => note.path),
    ["notes/good.md"],
  );
});

test("unknown key moves the file to quarantine with only three keys; scan continues", () => {
  const cwd = setup();
  writeFileSync(
    join(cwd, "notes", "extra.md"),
    "---\nid: extra\nmystery: 1\n---\n\n# body\n",
  );
  writeFileSync(
    join(cwd, "notes", "good.md"),
    "---\nid: good\n---\n\n# keep this body\n",
  );

  const result = scan({ cwd, now: NOW });

  assert.equal(existsSync(join(cwd, "notes", "extra.md")), false);
  assert.equal(
    readFileSync(join(cwd, "quarantine", "extra.md"), "utf8"),
    "---\norigin-location: notes/extra.md\nquarantined-at: 2026-09-01T18:00:00.000Z\nfault: unknown-key:mystery\n---\n",
  );
  assert.equal(
    readFileSync(join(cwd, "notes", "good.md"), "utf8"),
    "---\nid: good\n---\n\n# keep this body\n",
  );
  assert.deepEqual(
    result.notes.map((note) => note.path),
    ["notes/good.md"],
  );
});

test("missing required key moves the file to quarantine with only three keys; scan continues", () => {
  const cwd = setup();
  writeFileSync(join(cwd, "notes", "empty.md"), "---\n---\n\n# body\n");
  writeFileSync(
    join(cwd, "notes", "good.md"),
    "---\nid: good\n---\n\n# keep this body\n",
  );

  const result = scan({ cwd, now: NOW });

  assert.equal(existsSync(join(cwd, "notes", "empty.md")), false);
  assert.equal(
    readFileSync(join(cwd, "quarantine", "empty.md"), "utf8"),
    "---\norigin-location: notes/empty.md\nquarantined-at: 2026-09-01T18:00:00.000Z\nfault: missing-key:id\n---\n",
  );
  assert.equal(
    readFileSync(join(cwd, "notes", "good.md"), "utf8"),
    "---\nid: good\n---\n\n# keep this body\n",
  );
  assert.deepEqual(
    result.notes.map((note) => note.path),
    ["notes/good.md"],
  );
});

test("supervisor quarantine write does not include status, blocked-by, caused-by, or a body", () => {
  const cwd = setup();
  writeFileSync(
    join(cwd, "notes", "lineage.md"),
    [
      "---",
      "id: lineage",
      "status: ready-for-agent",
      "blocked-by: other",
      "caused-by: parent",
      "mystery: 1",
      "---",
      "",
      "# Body the supervisor must not copy",
      "status: still-a-body",
      "",
    ].join("\n"),
  );

  scan({ cwd, now: NOW });

  const quarantined = readFileSync(
    join(cwd, "quarantine", "lineage.md"),
    "utf8",
  );
  assert.equal(
    quarantined,
    "---\norigin-location: notes/lineage.md\nquarantined-at: 2026-09-01T18:00:00.000Z\nfault: unknown-key:status\n---\n",
  );
  assert.equal(quarantined.includes("blocked-by"), false);
  assert.equal(quarantined.includes("caused-by"), false);
  assert.equal(quarantined.includes("# Body"), false);
  assert.equal(/\nstatus:/.test(quarantined), false);
});
