import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import {
    mkdirSync,
    mkdtempSync,
    readdirSync,
    readFileSync,
    writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { loadConfig } from "./loadConfig.ts";
import { matchNotes } from "./matcher.ts";
import { spawnMatches } from "./once.ts";
import { scan } from "./scan.ts";

const CLI = fileURLToPath(import.meta.url).replace(/once\.test\.ts$/, "cli.ts");

type Proc = { status: number | null; stdout: string; stderr: string };

function once(cwd: string, env?: NodeJS.ProcessEnv): Proc {
    const proc = spawnSync(
        process.execPath,
        ["--experimental-strip-types", CLI, "once"],
        { cwd, encoding: "utf8", env },
    );
    return {
        status: proc.status,
        stdout: stdioText(proc.stdout),
        stderr: stdioText(proc.stderr),
    };
}

function stdioText(value: string | Buffer | null | undefined): string {
    if (value === null || value === undefined) return "";
    return typeof value === "string" ? value : value.toString("utf8");
}

function writeTicket(cwd: string, name: string, status: string): void {
    writeFileSync(
        join(cwd, "tickets", name),
        `---\nid: ${name.replace(/\.md$/, "")}\nstatus: ${status}\n---\n\n# ${name}\n`,
    );
}

function setupMatchProject(cmd: string): string {
    const cwd = mkdtempSync(join(tmpdir(), "hivemind-once-"));
    mkdirSync(join(cwd, "tickets"));
    mkdirSync(join(cwd, "quarantine"));
    writeFileSync(
        join(cwd, "hivemind.yaml"),
        [
            "folders:",
            "  - path: tickets",
            "    schema: ticket",
            "    required: [id, status]",
            "  - path: quarantine",
            "    schema: quarantine",
            "    required: [origin-location, quarantined-at, fault]",
            "lanes:",
            "  - lane: plan",
            `    cmd: ${cmd}`,
            "    trigger:",
            "      status: ready-for-agent",
            "    claim-status: active",
            "",
        ].join("\n"),
    );
    return cwd;
}

test("lane trigger.status ready-for-agent ignores ready-for-human", () => {
    const cwd = setupMatchProject("/bin/echo agent-matched");
    writeTicket(cwd, "human.md", "ready-for-human");
    writeTicket(cwd, "agent.md", "ready-for-agent");

    const proc = once(cwd);

    assert.equal(proc.status, 0, proc.stderr);
    const echoed = (proc.stdout.match(/agent-matched/g) ?? []).length;
    assert.equal(echoed, 1);
    assert.equal(
        readFileSync(join(cwd, "tickets", "human.md"), "utf8").includes(
            "status: ready-for-human",
        ),
        true,
    );
});

test("two once processes cannot both CAS-claim the same matching file", async () => {
    const cwd = mkdtempSync(join(tmpdir(), "hivemind-cas-"));
    mkdirSync(join(cwd, "tickets"));
    mkdirSync(join(cwd, "quarantine"));
    writeFileSync(
        join(cwd, "record.mjs"),
        [
            "import { writeFileSync } from 'node:fs';",
            "import { join } from 'node:path';",
            "import { randomUUID } from 'node:crypto';",
            "writeFileSync(join('spawns', randomUUID() + '.flag'), '1');",
            "",
        ].join("\n"),
    );
    mkdirSync(join(cwd, "spawns"));
    writeFileSync(
        join(cwd, "hivemind.yaml"),
        [
            "folders:",
            "  - path: tickets",
            "    schema: ticket",
            "    required: [id, status]",
            "  - path: quarantine",
            "    schema: quarantine",
            "    required: [origin-location, quarantined-at, fault]",
            "lanes:",
            "  - lane: plan",
            "    cmd:",
            `      - ${process.execPath}`,
            "      - record.mjs",
            "    trigger:",
            "      status: ready-for-agent",
            "    claim-status: active",
            "",
        ].join("\n"),
    );
    writeTicket(cwd, "only.md", "ready-for-agent");

    const [first, second] = await Promise.all([onceAsync(cwd), onceAsync(cwd)]);
    assert.equal(first.status, 0, first.stderr);
    assert.equal(second.status, 0, second.stderr);

    const claimed = readFileSync(join(cwd, "tickets", "only.md"), "utf8");
    assert.match(claimed, /^status: active$/m);
    assert.match(claimed, /^claimed-by: /m);
    assert.equal(claimed.match(/^status: /gm)?.length, 1);
    const flags = readdirSync(join(cwd, "spawns")).filter((name) =>
        name.endsWith(".flag"),
    );
    assert.equal(flags.length, 1);
});

test("unset {{env.SECRET}} does not spawn and never logs the value", () => {
    const cwd = setupMatchProject('/bin/echo "{{env.MISSING}}"');
    writeTicket(cwd, "agent.md", "ready-for-agent");
    const env: NodeJS.ProcessEnv = {
        ...process.env,
        LEAK: "super-secret-value",
    };
    delete env["MISSING"];
    delete env["SECRET"];

    const proc = once(cwd, env);

    assert.equal(proc.status, 0, proc.stderr);
    const logs = `${proc.stdout}${proc.stderr}`;
    assert.equal(logs.includes("super-secret-value"), false);
    assert.equal((proc.stdout.match(/agent-matched/g) ?? []).length, 0);
    assert.equal(proc.stdout.includes("{{env.MISSING}}"), false);
    assert.match(
        readFileSync(join(cwd, "tickets", "agent.md"), "utf8"),
        /^status: ready-for-agent$/m,
    );
});

test("cmd with metacharacters in an interpolated path does not invoke a shell", () => {
    const cwd = mkdtempSync(join(tmpdir(), "hivemind-meta-"));
    mkdirSync(join(cwd, "tickets"));
    mkdirSync(join(cwd, "quarantine"));
    writeFileSync(
        join(cwd, "hivemind.yaml"),
        [
            "folders:",
            "  - path: tickets",
            "    schema: ticket",
            "    required: [id, status]",
            "  - path: quarantine",
            "    schema: quarantine",
            "    required: [origin-location, quarantined-at, fault]",
            "lanes:",
            "  - lane: plan",
            '    cmd: "/bin/echo {{prompt}}"',
            '    prompt: "foo; echo HACKED"',
            "    trigger:",
            "      status: ready-for-agent",
            "    claim-status: active",
            "",
        ].join("\n"),
    );
    writeFileSync(join(cwd, "foo; echo HACKED"), "x\n");
    writeTicket(cwd, "agent.md", "ready-for-agent");

    const proc = once(cwd);

    assert.equal(proc.status, 0, proc.stderr);
    assert.equal(proc.stdout.includes("foo\nHACKED"), false);
    assert.equal(proc.stdout.trim(), "foo; echo HACKED");
});

test("interpolated spaces stay one argv", () => {
    const cwd = mkdtempSync(join(tmpdir(), "hivemind-spaces-"));
    mkdirSync(join(cwd, "tickets"));
    mkdirSync(join(cwd, "quarantine"));
    writeFileSync(
        join(cwd, "record.mjs"),
        "import { writeFileSync } from 'node:fs';\nwriteFileSync('argv.json', JSON.stringify(process.argv.slice(2)));\n",
    );
    writeFileSync(
        join(cwd, "hivemind.yaml"),
        [
            "folders:",
            "  - path: tickets",
            "    schema: ticket",
            "    required: [id, status]",
            "  - path: quarantine",
            "    schema: quarantine",
            "    required: [origin-location, quarantined-at, fault]",
            "lanes:",
            "  - lane: plan",
            `    cmd: ${process.execPath} record.mjs "{{prompt}}"`,
            '    prompt: "hello world"',
            "    trigger:",
            "      status: ready-for-agent",
            "    claim-status: active",
            "",
        ].join("\n"),
    );
    writeFileSync(join(cwd, "hello world"), "x\n");
    writeTicket(cwd, "agent.md", "ready-for-agent");

    const proc = once(cwd);

    assert.equal(proc.status, 0, proc.stderr);
    assert.deepEqual(JSON.parse(readFileSync(join(cwd, "argv.json"), "utf8")), [
        "hello world",
    ]);
});

test("overlapping live exclusive/scope skip", async () => {
    const cwd = mkdtempSync(join(tmpdir(), "hivemind-excl-"));
    mkdirSync(join(cwd, "tickets"));
    mkdirSync(join(cwd, "quarantine"));
    mkdirSync(join(cwd, "spawns"));
    writeFileSync(
        join(cwd, "record.mjs"),
        [
            "import { writeFileSync } from 'node:fs';",
            "import { join } from 'node:path';",
            "import { randomUUID } from 'node:crypto';",
            "writeFileSync(join('spawns', randomUUID() + '.flag'), String(process.pid));",
            "await new Promise((resolve) => setTimeout(resolve, 400));",
            "",
        ].join("\n"),
    );
    writeFileSync(
        join(cwd, "hivemind.yaml"),
        [
            "concurrency: 2",
            "folders:",
            "  - path: tickets",
            "    schema: ticket",
            "    required: [id, status]",
            "  - path: quarantine",
            "    schema: quarantine",
            "    required: [origin-location, quarantined-at, fault]",
            "lanes:",
            "  - lane: plan",
            "    cmd:",
            `      - ${process.execPath}`,
            "      - record.mjs",
            "    trigger:",
            "      status: ready-for-agent",
            "    exclusive:",
            "      - tickets",
            "    claim-status: active",
            "",
        ].join("\n"),
    );
    writeTicket(cwd, "one.md", "ready-for-agent");
    writeTicket(cwd, "two.md", "ready-for-agent");

    const proc = once(cwd);
    assert.equal(proc.status, 0, proc.stderr);
    const flags = readdirSync(join(cwd, "spawns")).filter((name) =>
        name.endsWith(".flag"),
    );
    assert.equal(flags.length, 1);
    const claimed = ["one.md", "two.md"].filter((name) =>
        readFileSync(join(cwd, "tickets", name), "utf8").includes(
            "status: active",
        ),
    );
    assert.equal(claimed.length, 1);
});

test("child is one unit; supervisor does not loop tickets inside the child", () => {
    const cwd = mkdtempSync(join(tmpdir(), "hivemind-unit-"));
    mkdirSync(join(cwd, "tickets"));
    mkdirSync(join(cwd, "quarantine"));
    mkdirSync(join(cwd, "spawns"));
    writeFileSync(
        join(cwd, "record.mjs"),
        [
            "import { writeFileSync } from 'node:fs';",
            "import { join } from 'node:path';",
            "writeFileSync(join('spawns', process.pid + '.flag'), process.argv.join('\\0'));",
            "",
        ].join("\n"),
    );
    writeFileSync(
        join(cwd, "hivemind.yaml"),
        [
            "concurrency: 1",
            "folders:",
            "  - path: tickets",
            "    schema: ticket",
            "    required: [id, status]",
            "  - path: quarantine",
            "    schema: quarantine",
            "    required: [origin-location, quarantined-at, fault]",
            "lanes:",
            "  - lane: plan",
            "    cmd:",
            `      - ${process.execPath}`,
            "      - record.mjs",
            "    trigger:",
            "      status: ready-for-agent",
            "    claim-status: active",
            "",
        ].join("\n"),
    );
    writeTicket(cwd, "one.md", "ready-for-agent");
    writeTicket(cwd, "two.md", "ready-for-agent");

    const proc = once(cwd);
    assert.equal(proc.status, 0, proc.stderr);
    const flags = readdirSync(join(cwd, "spawns")).filter((name) =>
        name.endsWith(".flag"),
    );
    assert.equal(flags.length, 1);
    const flag = flags[0];
    if (flag === undefined) throw new Error("expected a spawn flag");
    const payload = readFileSync(join(cwd, "spawns", flag), "utf8");
    const both = payload.includes("one.md") && payload.includes("two.md");
    assert.equal(both, false);
    const statuses = ["one.md", "two.md"].map((name) =>
        readFileSync(join(cwd, "tickets", name), "utf8"),
    );
    const active = statuses.filter((text) => /^status: active$/m.test(text));
    const ready = statuses.filter((text) =>
        /^status: ready-for-agent$/m.test(text),
    );
    assert.equal(active.length, 1);
    assert.equal(ready.length, 1);
});

test("missing prompt file does not spawn and does not claim", () => {
    const cwd = mkdtempSync(join(tmpdir(), "hivemind-prompt-"));
    mkdirSync(join(cwd, "tickets"));
    mkdirSync(join(cwd, "quarantine"));
    writeFileSync(
        join(cwd, "hivemind.yaml"),
        [
            "folders:",
            "  - path: tickets",
            "    schema: ticket",
            "    required: [id, status]",
            "  - path: quarantine",
            "    schema: quarantine",
            "    required: [origin-location, quarantined-at, fault]",
            "lanes:",
            "  - lane: plan",
            "    cmd: /bin/echo spawned",
            "    prompt: missing.md",
            "    trigger:",
            "      status: ready-for-agent",
            "    claim-status: active",
            "",
        ].join("\n"),
    );
    writeTicket(cwd, "agent.md", "ready-for-agent");

    const proc = once(cwd);
    assert.equal(proc.status, 0, proc.stderr);
    assert.equal(proc.stdout.includes("spawned"), false);
    assert.match(
        readFileSync(join(cwd, "tickets", "agent.md"), "utf8"),
        /^status: ready-for-agent$/m,
    );
});

test("live claimed-by skip does not re-spawn the same path", () => {
    const cwd = setupMatchProject("/bin/echo spawned");
    writeTicket(cwd, "agent.md", "ready-for-agent");
    const config = loadConfig(cwd);
    const { notes } = scan({ cwd, config });
    const matches = matchNotes({ lanes: config.lanes, notes });
    const spawned: unknown[] = [];
    const n = spawnMatches({
        cwd,
        concurrency: 2,
        matches,
        env: process.env,
        spawnChild: (argv) => {
            spawned.push(argv);
        },
        live: [
            {
                exclusive: [],
                wait: new Promise(() => {}),
                kill: () => {},
                done: false,
                path: "tickets/agent.md",
            },
        ],
    });
    assert.equal(n, 0);
    assert.deepEqual(spawned, []);
    assert.match(
        readFileSync(join(cwd, "tickets", "agent.md"), "utf8"),
        /^status: ready-for-agent$/m,
    );
});

function onceAsync(cwd: string): Promise<Proc> {
    return new Promise((resolve) => {
        const child = spawn(
            process.execPath,
            ["--experimental-strip-types", CLI, "once"],
            {
                cwd,
            },
        );
        let stdout = "";
        let stderr = "";
        child.stdout.on("data", (chunk: Buffer | string) => {
            stdout += chunk.toString();
        });
        child.stderr.on("data", (chunk: Buffer | string) => {
            stderr += chunk.toString();
        });
        child.on("close", (status) => {
            resolve({ status, stdout, stderr });
        });
    });
}
