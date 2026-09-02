import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { createJournal } from "./journal.ts";

const NOW = new Date("2026-09-02T11:54:26.000Z");

test("record writes a human line and a TSV row with header", () => {
  const cwd = mkdtempSync(join(tmpdir(), "hivemind-journal-"));
  const historyPath = join(cwd, "logs", "hivemind.tsv");
  const lines: string[] = [];
  const journal = createJournal({
    historyPath,
    writeLine: (line) => {
      lines.push(line);
    },
    now: () => NOW,
  });

  journal.record({
    kind: "claim",
    lane: "plan",
    path: "tickets/agent.md",
    runId: "run-1",
  });

  assert.deepEqual(lines, ["hivemind claim plan tickets/agent.md"]);
  assert.equal(
    readFileSync(historyPath, "utf8"),
    [
      "ts\taction\tlane\tpath\trun_id\tdetail",
      "2026-09-02T11:54:26.000Z\tclaim\tplan\ttickets/agent.md\trun-1\t",
      "",
    ].join("\n"),
  );
});

test("second record appends without a second header", () => {
  const cwd = mkdtempSync(join(tmpdir(), "hivemind-journal-append-"));
  const historyPath = join(cwd, "hivemind.tsv");
  const journal = createJournal({
    historyPath,
    writeLine: () => {},
    now: () => NOW,
  });

  journal.record({
    kind: "scan",
    notes: 2,
    quarantined: 1,
  });
  journal.record({
    kind: "quarantine",
    path: "tickets/bad.md",
    fault: "parse-error",
  });

  assert.equal(
    readFileSync(historyPath, "utf8"),
    [
      "ts\taction\tlane\tpath\trun_id\tdetail",
      "2026-09-02T11:54:26.000Z\tscan\t\t\t\tnotes=2 quarantined=1",
      "2026-09-02T11:54:26.000Z\tquarantine\t\ttickets/bad.md\t\tparse-error",
      "",
    ].join("\n"),
  );
});

test("tabs and newlines in fields become spaces", () => {
  const cwd = mkdtempSync(join(tmpdir(), "hivemind-journal-escape-"));
  const historyPath = join(cwd, "hivemind.tsv");
  const journal = createJournal({
    historyPath,
    writeLine: () => {},
    now: () => NOW,
  });

  journal.record({
    kind: "quarantine",
    path: "tickets/bad.md",
    fault: "unknown-key:mystery\twith\nnewline",
  });

  const rows = readFileSync(historyPath, "utf8").trim().split("\n");
  assert.equal(rows.length, 2);
  assert.equal(rows[1]?.split("\t").length, 6);
  assert.equal(rows[1]?.includes("\twith"), false);
  assert.match(rows[1] ?? "", /unknown-key:mystery with newline/);
});

test("omitted history path still prints and does not write a file", () => {
  const cwd = mkdtempSync(join(tmpdir(), "hivemind-journal-stderr-"));
  const lines: string[] = [];
  const journal = createJournal({
    writeLine: (line) => {
      lines.push(line);
    },
    now: () => NOW,
  });

  journal.record({
    kind: "skip",
    lane: "plan",
    path: "tickets/agent.md",
    reason: "cmd-skip",
  });
  journal.record({
    kind: "spawn",
    lane: "plan",
    path: "tickets/agent.md",
    runId: "run-1",
  });
  journal.record({
    kind: "exit",
    lane: "plan",
    path: "tickets/agent.md",
    runId: "run-1",
    status: 0,
  });

  assert.deepEqual(lines, [
    "hivemind skip plan tickets/agent.md cmd-skip",
    "hivemind spawn plan tickets/agent.md",
    "hivemind exit plan tickets/agent.md status=0",
  ]);
  assert.equal(existsSync(join(cwd, "hivemind.tsv")), false);
});
