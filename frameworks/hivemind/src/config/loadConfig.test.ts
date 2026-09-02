import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { loadConfig, loadConfigFile } from "./loadConfig.ts";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "../../../..");

function writeConfig(cwd: string, body: string): void {
    mkdirSync(join(cwd, ".hivemind"), { recursive: true });
    writeFileSync(join(cwd, ".hivemind", "hivemind.yaml"), body);
}

test("loadConfig throws when .hivemind/hivemind.yaml is missing", () => {
    const cwd = mkdtempSync(join(tmpdir(), "hivemind-load-missing-"));
    assert.throws(() => loadConfig(cwd), /Missing \.hivemind\/hivemind\.yaml/);
});

test("loadConfig ignores a root hivemind.yaml", () => {
    const cwd = mkdtempSync(join(tmpdir(), "hivemind-load-root-"));
    writeFileSync(join(cwd, "hivemind.yaml"), "folders: []\nlanes: {}\n");
    assert.throws(() => loadConfig(cwd), /Missing \.hivemind\/hivemind\.yaml/);
});

test("loadConfig throws on unknown top-level keys", () => {
    const cwd = mkdtempSync(join(tmpdir(), "hivemind-load-unknown-"));
    writeConfig(cwd, "folders: []\nlanes: {}\nunknown: 1\n");
    assert.throws(() => loadConfig(cwd), /Unknown key "unknown"/);
});

test("loadConfig rejects top-level concurrency", () => {
    const cwd = mkdtempSync(join(tmpdir(), "hivemind-load-global-conc-"));
    writeConfig(cwd, "concurrency: 2\nfolders: []\nlanes: {}\n");
    assert.throws(() => loadConfig(cwd), /Unknown key "concurrency"/);
});

test("loadConfig accepts empty lanes: {}", () => {
    const cwd = mkdtempSync(join(tmpdir(), "hivemind-load-empty-"));
    writeConfig(cwd, "folders: []\nlanes: {}\n");
    const cfg = loadConfig(cwd);
    assert.deepEqual(cfg.lanes, []);
});

test("loadConfig rejects lanes as a list", () => {
    const cwd = mkdtempSync(join(tmpdir(), "hivemind-load-list-"));
    writeConfig(
        cwd,
        [
            "folders: []",
            "lanes:",
            "  - lane: plan",
            "    type: single",
            "    cmd: /bin/echo",
            "    trigger:",
            "      status: ready",
            "    claim-status: active",
            "",
        ].join("\n"),
    );
    assert.throws(() => loadConfig(cwd), /"lanes" must be a map/);
});

test("loadConfig reads map lanes and per-lane concurrency", () => {
    const cwd = mkdtempSync(join(tmpdir(), "hivemind-load-map-"));
    writeConfig(
        cwd,
        [
            "folders: []",
            "lanes:",
            "  plan:",
            "    type: single",
            "    concurrency: 2",
            "    cmd: /bin/echo",
            "    trigger:",
            "      status: ready-for-agent",
            "    claim-status: active",
            "  build:",
            "    type: single",
            "    cmd: /bin/true",
            "    trigger:",
            "      status: active",
            "    claim-status: active",
            "",
        ].join("\n"),
    );
    const cfg = loadConfig(cwd);
    assert.deepEqual(
        cfg.lanes.map((lane) => [lane.lane, lane.type, lane.concurrency]),
        [
            ["plan", "single", 2],
            ["build", "single", 1],
        ],
    );
});

test("loadConfig merges actors from files and overlays hivemind.yaml", () => {
    const cwd = mkdtempSync(join(tmpdir(), "hivemind-load-actors-"));
    mkdirSync(join(cwd, ".hivemind", "actors"), { recursive: true });
    writeFileSync(
        join(cwd, ".hivemind", "actors", "planner.yaml"),
        [
            "cmd: /bin/echo file",
            "agent: from-file",
            "claim-status: active",
            "",
        ].join("\n"),
    );
    writeFileSync(
        join(cwd, ".hivemind", "actors", "roles.yaml"),
        [
            "builder:",
            "  cmd: /bin/echo builder",
            "  claim-status: active",
            "",
        ].join("\n"),
    );
    writeConfig(
        cwd,
        [
            "folders: []",
            "actors:",
            "  planner:",
            "    cmd: /bin/echo yaml",
            "    agent: from-yaml",
            "    claim-status: active",
            "lanes:",
            "  plan:",
            "    type: single",
            "    actor: planner",
            "    trigger:",
            "      status: ready",
            "  build:",
            "    type: single",
            "    actor: builder",
            "    trigger:",
            "      status: active",
            "",
        ].join("\n"),
    );
    const cfg = loadConfig(cwd);
    const plan = cfg.lanes.find((lane) => lane.lane === "plan");
    const build = cfg.lanes.find((lane) => lane.lane === "build");
    assert.equal(plan?.type, "single");
    if (plan?.type !== "single" || build?.type !== "single") {
        throw new Error("expected single lanes");
    }
    assert.equal(plan.cmd, "/bin/echo yaml");
    assert.equal(plan.agent, "from-yaml");
    assert.equal(build.cmd, "/bin/echo builder");
});

test("loadConfig fails on duplicate actor names across files", () => {
    const cwd = mkdtempSync(join(tmpdir(), "hivemind-load-dup-actor-"));
    mkdirSync(join(cwd, ".hivemind", "actors"), { recursive: true });
    writeFileSync(
        join(cwd, ".hivemind", "actors", "a.yaml"),
        "cmd: /bin/echo a\nclaim-status: active\n",
    );
    writeFileSync(
        join(cwd, ".hivemind", "actors", "a.yml"),
        "cmd: /bin/echo b\nclaim-status: active\n",
    );
    writeConfig(
        cwd,
        [
            "folders: []",
            "lanes:",
            "  plan:",
            "    type: single",
            "    actor: a",
            "    trigger:",
            "      status: ready",
            "",
        ].join("\n"),
    );
    assert.throws(() => loadConfig(cwd), /Duplicate actor "a"/);
});

test("loadConfig parses a pipeline lane", () => {
    const cwd = mkdtempSync(join(tmpdir(), "hivemind-load-pipe-"));
    writeConfig(
        cwd,
        [
            "folders: []",
            "lanes:",
            "  workflow:",
            "    type: pipeline",
            "    concurrency: 1",
            "    cooldown: 90s",
            "    claim-status: active",
            "    trigger:",
            "      status: ready-for-agent",
            "    stages:",
            "      - stage: plan",
            "        cmd: /bin/echo plan",
            "      - stage: build",
            "        cmd: /bin/echo build",
            "",
        ].join("\n"),
    );
    const cfg = loadConfig(cwd);
    const lane = cfg.lanes[0];
    assert.equal(lane?.type, "pipeline");
    if (lane?.type !== "pipeline") throw new Error("expected pipeline");
    assert.equal(lane.concurrency, 1);
    assert.equal(lane.cooldownMs, 90_000);
    assert.deepEqual(
        lane.stages.map((stage) => stage.stage),
        ["plan", "build"],
    );
});

test("profiles/agentic-core/hivemind.yaml names .heio/ folders, quarantine, sealed/ready, Plan/Tasker/Build/Review; Mint omitted or disable", () => {
    const text = readFileSync(
        join(REPO, "profiles", "agentic-core", "hivemind.yaml"),
        "utf8",
    );
    assert.match(text, /\.heio\/tickets/);
    assert.match(text, /\.heio\/quarantine/);
    assert.match(text, /sealed/);
    assert.match(text, /ready/);
    assert.match(text, /^ {2}plan:/m);
    assert.match(text, /^ {2}tasker:/m);
    assert.match(text, /^ {2}build:/m);
    assert.match(text, /^ {2}review:/m);
    assert.equal(/\n {2}mint:/m.test(text), false);
    assert.doesNotMatch(text, /^disable:\s*\[\s*\]/m);
    assert.doesNotMatch(text, /^concurrency:/m);
});

test("loadConfigFile accepts the agentic-core heio-stack template", () => {
    const cfg = loadConfigFile({
        file: join(REPO, "profiles", "agentic-core", "hivemind.yaml"),
    });
    assert.deepEqual(
        cfg.lanes.map((lane) => lane.lane),
        ["plan", "tasker", "build", "review"],
    );
    for (const lane of cfg.lanes) {
        assert.equal(lane.type, "single");
        assert.equal(typeof lane.claimStatus, "string");
        assert.notEqual(lane.claimStatus, "");
        assert.equal(typeof lane.concurrency, "number");
    }
    const review = cfg.lanes.find((lane) => lane.lane === "review");
    assert.equal(review?.type, "single");
    if (review?.type !== "single") throw new Error("expected single");
    assert.equal(review.scalars["mint-status"], "ready-for-human");
    const mintLane = cfg.lanes.some((lane) => lane.lane === "mint");
    assert.equal(mintLane && !cfg.disable.includes("mint"), false);
    assert.equal(cfg.watch, undefined);
    assert.equal(cfg.history, ".heio/logs/hivemind.tsv");
});

test("loadConfig omits watch as folders when the key is absent", () => {
    const cwd = mkdtempSync(join(tmpdir(), "hivemind-load-watch-omit-"));
    writeConfig(cwd, "folders: []\nlanes: {}\n");
    assert.equal(loadConfig(cwd).watch, undefined);
});

test("loadConfig stores watch directories and strips glob suffixes", () => {
    const cwd = mkdtempSync(join(tmpdir(), "hivemind-load-watch-"));
    writeConfig(
        cwd,
        "folders: []\nlanes: {}\nwatch:\n  - .heio/tickets\n  - .heio/planning/**/*.md\n",
    );
    assert.deepEqual(loadConfig(cwd).watch, [
        ".heio/tickets",
        ".heio/planning",
    ]);
});

test("loadConfig omits history when the key is absent", () => {
    const cwd = mkdtempSync(join(tmpdir(), "hivemind-load-history-omit-"));
    writeConfig(cwd, "folders: []\nlanes: {}\n");
    assert.equal(loadConfig(cwd).history, undefined);
});

test("loadConfig stores a history path", () => {
    const cwd = mkdtempSync(join(tmpdir(), "hivemind-load-history-"));
    writeConfig(
        cwd,
        "folders: []\nlanes: {}\nhistory: .heio/logs/hivemind.tsv\n",
    );
    assert.equal(loadConfig(cwd).history, ".heio/logs/hivemind.tsv");
});
