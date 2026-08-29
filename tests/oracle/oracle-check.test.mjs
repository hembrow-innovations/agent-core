import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const SCRIPT = fileURLToPath(
  new URL(
    "../../ai/skills/workflow/oracle/scripts/oracle-check.mjs",
    import.meta.url,
  ),
);

const PASS = `node -e "console.log('oracle passed')"`;
const FAIL_EXIT = `node -e "process.exit(1)"`;
const FAIL_TOKEN = `node -e "console.log('nope'); process.exit(0)"`;
const SIDE_EFFECT = `node -e "require('fs').writeFileSync('ran.txt','yes'); console.log('oracle passed')"`;

function workspace() {
  return mkdtempSync(join(tmpdir(), "oracle-check-"));
}

function writeLedger(cwd, body, relative = "oracles.md") {
  const path = join(cwd, relative);
  mkdirSync(join(path, ".."), { recursive: true });
  writeFileSync(path, body);
  return path;
}

function oracle({
  id = "O1",
  checked = false,
  title = "does the thing",
  check = PASS,
  expect = "oracle passed",
  evidence = "pending",
  abandon,
}) {
  const box = checked ? "x" : " ";
  let text = `- [${box}] ${id}: ${title}\n`;
  if (abandon !== undefined) {
    text += `  ABANDON: ${abandon}\n`;
    return text;
  }
  text += `  CHECK: ${check}\n`;
  text += `  EXPECT: ${expect}\n`;
  text += `  EVIDENCE: ${evidence}\n`;
  return text;
}

function ledger(...items) {
  return `# Oracles: test\n\n${items.join("\n")}`;
}

function run(args, cwd) {
  return spawnSync(process.execPath, [SCRIPT, ...args], {
    encoding: "utf8",
    cwd,
    timeout: 15000,
  });
}

test("missing ledger is an error", () => {
  const cwd = workspace();
  const r = run(["missing.md"], cwd);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /missing\.md/);
});

test("ledger with no oracles is an error", () => {
  const cwd = workspace();
  writeLedger(cwd, "# Oracles: empty\n\nno oracles here\n");
  const r = run(["oracles.md"], cwd);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /no oracles/i);
});

test("duplicate ids are an error", () => {
  const cwd = workspace();
  writeLedger(cwd, ledger(oracle({ id: "O1" }), oracle({ id: "O1" })));
  const r = run(["--status", "oracles.md"], cwd);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /duplicate/i);
});

test("runnable oracle without CHECK is an error", () => {
  const cwd = workspace();
  writeLedger(
    cwd,
    `# Oracles: test\n\n- [ ] O1: does the thing\n  EXPECT: oracle passed\n  EVIDENCE: pending\n`,
  );
  const r = run(["--status", "oracles.md"], cwd);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /CHECK/i);
});

test("runnable oracle without EXPECT is an error", () => {
  const cwd = workspace();
  writeLedger(
    cwd,
    `# Oracles: test\n\n- [ ] O1: does the thing\n  CHECK: ${PASS}\n  EVIDENCE: pending\n`,
  );
  const r = run(["--status", "oracles.md"], cwd);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /EXPECT/i);
});

test("blank ABANDON reason is an error", () => {
  const cwd = workspace();
  writeLedger(cwd, ledger(oracle({ abandon: "" })));
  const r = run(["--status", "oracles.md"], cwd);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /ABANDON/i);
});

test("--status does not execute CHECK", () => {
  const cwd = workspace();
  writeLedger(cwd, ledger(oracle({ check: SIDE_EFFECT })));
  const r = run(["--status", "oracles.md"], cwd);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /UNMET O1/);
  assert.equal(r.stdout.includes("ran.txt") || false, false);
  let ran = false;
  try {
    readFileSync(join(cwd, "ran.txt"));
    ran = true;
  } catch {
    ran = false;
  }
  assert.equal(ran, false);
});

test("checked box with pending evidence is unmet", () => {
  const cwd = workspace();
  writeLedger(cwd, ledger(oracle({ checked: true, evidence: "pending" })));
  const r = run(["--status", "oracles.md"], cwd);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /UNMET O1/);
});

test("run records met evidence and exits 0", () => {
  const cwd = workspace();
  writeLedger(cwd, ledger(oracle({})));
  const r = run(["oracles.md"], cwd);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /ALL MET/);
  const body = readFileSync(join(cwd, "oracles.md"), "utf8");
  assert.match(body, /^- \[x\] O1:/m);
  assert.match(body, /EVIDENCE: met exit=0 match=yes sha256=/);
});

test("nonzero exit is unmet", () => {
  const cwd = workspace();
  writeLedger(cwd, ledger(oracle({ check: FAIL_EXIT })));
  const r = run(["oracles.md"], cwd);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /UNMET O1/);
  const body = readFileSync(join(cwd, "oracles.md"), "utf8");
  assert.match(body, /^- \[ \] O1:/m);
  assert.match(body, /EVIDENCE: unmet /);
});

test("exit 0 without EXPECT token is unmet", () => {
  const cwd = workspace();
  writeLedger(cwd, ledger(oracle({ check: FAIL_TOKEN })));
  const r = run(["oracles.md"], cwd);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /UNMET O1/);
});

test("EXPECT is a literal token, not a regex", () => {
  const cwd = workspace();
  writeLedger(
    cwd,
    ledger(
      oracle({
        check: `node -e "console.log('fooXbar')"`,
        expect: "foo.bar",
      }),
    ),
  );
  const r = run(["oracles.md"], cwd);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /UNMET O1/);
});

test("default run skips oracles that already have met evidence", () => {
  const cwd = workspace();
  writeLedger(
    cwd,
    ledger(
      oracle({
        checked: true,
        check: SIDE_EFFECT,
        evidence:
          "met exit=0 match=yes sha256=deadbeef bytes=1 at=2020-01-01T00:00:00Z",
      }),
    ),
  );
  const r = run(["oracles.md"], cwd);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /ALL MET/);
  let ran = false;
  try {
    readFileSync(join(cwd, "ran.txt"));
    ran = true;
  } catch {
    ran = false;
  }
  assert.equal(ran, false);
});

test("--reverify re-runs met oracles and overwrites fake evidence", () => {
  const cwd = workspace();
  writeLedger(
    cwd,
    ledger(
      oracle({
        checked: true,
        check: FAIL_EXIT,
        evidence:
          "met exit=0 match=yes sha256=deadbeef bytes=1 at=2020-01-01T00:00:00Z",
      }),
    ),
  );
  const r = run(["--reverify", "oracles.md"], cwd);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /UNMET O1/);
  const body = readFileSync(join(cwd, "oracles.md"), "utf8");
  assert.match(body, /^- \[ \] O1:/m);
  assert.match(body, /EVIDENCE: unmet /);
});

test("ABANDON is a handoff, never ALL MET, and does not run CHECK", () => {
  const cwd = workspace();
  writeLedger(
    cwd,
    ledger(
      oracle({ id: "O1", check: PASS }),
      `- [ ] O2: cannot prove\n  CHECK: ${SIDE_EFFECT}\n  EXPECT: oracle passed\n  ABANDON: no staging credentials\n  EVIDENCE: pending\n`,
    ),
  );
  const r = run(["--reverify", "oracles.md"], cwd);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /HANDOFF REQUIRED O2/);
  let ran = false;
  try {
    readFileSync(join(cwd, "ran.txt"));
    ran = true;
  } catch {
    ran = false;
  }
  assert.equal(ran, false);
});

test("default ledger path is .heio/oracles.md", () => {
  const cwd = workspace();
  writeLedger(cwd, ledger(oracle({})), ".heio/oracles.md");
  const r = run([], cwd);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /ALL MET/);
});

test("--status and --reverify together is an error", () => {
  const cwd = workspace();
  writeLedger(cwd, ledger(oracle({})));
  const r = run(["--status", "--reverify", "oracles.md"], cwd);
  assert.equal(r.status, 2);
});

test("unknown flag is an error", () => {
  const cwd = workspace();
  const r = run(["--approve", "oracles.md"], cwd);
  assert.equal(r.status, 2);
});
