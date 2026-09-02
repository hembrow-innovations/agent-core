import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readdirSync,
	readFileSync,
	statSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
	findSkillDir,
	installAgents,
	installPlaybooks,
	installPiRuntime,
	installPrompts,
	listAgentIds,
	listProfiles,
	listPromptIds,
	loadProfile,
	mergePiSettings,
	mergePiSettingsPackages,
	packageRefSource,
	packageSource,
	parseProfileYaml,
	readPiPackages,
	readPlaybookMeta,
	renderPlaybookCatalog,
	resolvePlaybookIds,
	rewriteSkillPlaybooks,
} from "../lib/profile.mjs";

const REPO = fileURLToPath(new URL("../..", import.meta.url));
const INSTALLER = join(REPO, "packages", "installer", "src", "cli.ts");
const CORE_WITHOUT =
	"domain-modeling,wayfinder,tdd,handoff,improve-codebase-architecture,codebase-design,setup-matt-pocock-skills,research,prototype,planning,planning-with-docs,management,docs,unslop";

test("parseProfileYaml: comments, scalars, booleans, lists, all", () => {
	const got = parseProfileYaml(`
# header
mode: heio
playbooks: all
skills: [architect, arena]
empty: []
`);
	assert.deepEqual(got, {
		mode: "heio",
		playbooks: "all",
		skills: ["architect", "arena"],
		empty: [],
	});
});

test("parseProfileYaml: block lists skip empty items", () => {
	const got = parseProfileYaml(`
skills:
  - feature
  -
  - bug-fix
  -
`);
	assert.deepEqual(got.skills, ["feature", "bug-fix"]);
});

test("parseProfileYaml: inline list skips empty items", () => {
	const got = parseProfileYaml(`skills: [feature, , bug-fix]`);
	assert.deepEqual(got.skills, ["feature", "bug-fix"]);
});

test("parseProfileYaml: nested maps, lists of maps, and numbers", () => {
	const got = parseProfileYaml(`
settings:
  toolDescriptionMode: compact
  retry: 2
  timeout: 1.5
  nested:
    enabled: true
  items:
    - name: a
      n: 1
    - name: b
      n: 2
  defaultTools:
    - read
    - bash
`);
	assert.deepEqual(got, {
		settings: {
			toolDescriptionMode: "compact",
			retry: 2,
			timeout: 1.5,
			nested: { enabled: true },
			items: [
				{ name: "a", n: 1 },
				{ name: "b", n: 2 },
			],
			defaultTools: ["read", "bash"],
		},
	});
	assert.equal(typeof got.settings.retry, "number");
	assert.equal(typeof got.settings.timeout, "number");
});

test("parseProfileYaml: quoted numbers stay strings; leading zeros stay strings", () => {
	const got = parseProfileYaml(`a: "42"\nb: 01\nc: 0\n`);
	assert.equal(got.a, "42");
	assert.equal(got.b, "01");
	assert.equal(got.c, 0);
});

test("parseProfileYaml: colon without space stays a scalar list item", () => {
	const got = parseProfileYaml(`packages:
  - npm:pi-lens
  - local:@agentic-core/heio-boot
`);
	assert.deepEqual(got.packages, [
		"npm:pi-lens",
		"local:@agentic-core/heio-boot",
	]);
});

test("parseProfileYaml: flow maps still fail", () => {
	assert.throws(() => parseProfileYaml(`x: {a: 1}`), /Nested maps/);
});

test("parseProfileYaml: throws on anchors", () => {
	assert.throws(() => parseProfileYaml(`x: &foo bar`), /anchors/);
	assert.throws(() => parseProfileYaml(`x: *foo`), /anchors/);
});

test("parseProfileYaml: throws on unknown constructs", () => {
	assert.throws(
		() => parseProfileYaml(`x: |\n  hi`),
		/Block scalars|Cannot parse/,
	);
	assert.throws(() => parseProfileYaml(`???`), /Cannot parse/);
});

test("loadProfile: missing dies with available names", () => {
	const root = tempRoot();
	writeYaml(root, "core", "skills: []\n");
	assert.throws(() => loadProfile(root, "nope"), /Unknown profile "nope".*core/);
});

test("loadProfile: defaults omit settings", () => {
	const root = tempRoot();
	writeYaml(root, "bare", "skills: []\n");

	const bare = loadProfile(root, "bare");
	assert.deepEqual(bare, {
		name: "bare",
		skills: [],
		agents: { kind: "omit" },
		prompts: { kind: "omit" },
		packages: [],
		settings: null,
		frameworks: [],
	});
});

test("loadProfile: leftover playbooks key dies", () => {
	const root = tempRoot();
	writeYaml(root, "pb", "playbooks: all\nskills: []\n");
	assert.throws(
		() => loadProfile(root, "pb"),
		/leftover "playbooks:". the installer does not copy playbooks/,
	);
});

test("loadProfile: leftover dest keys die", () => {
	const root = tempRoot();
	writeYaml(root, "mode", "mode: heio\nskills: []\n");
	assert.throws(
		() => loadProfile(root, "mode"),
		/leftover "mode:". dest playbooks live at \.pi\/playbooks/,
	);
	writeYaml(root, "harness", "harness: pi\nskills: []\n");
	assert.throws(
		() => loadProfile(root, "harness"),
		/leftover "harness:". dest is always \.pi/,
	);
	writeYaml(root, "old-pi", "pi: false\nskills: []\n");
	assert.throws(
		() => loadProfile(root, "old-pi"),
		/leftover "pi:". dest is always \.pi/,
	);
	writeYaml(root, "commands", "commands: true\nskills: []\n");
	assert.throws(
		() => loadProfile(root, "commands"),
		/leftover "commands:". dest is always \.pi/,
	);
	writeYaml(root, "extensions", "extensions:\n  - heio-todo\n");
	assert.throws(
		() => loadProfile(root, "extensions"),
		/leftover "extensions:". use packages:/,
	);
	writeYaml(root, "templates", "templates: true\nskills: []\n");
	assert.throws(
		() => loadProfile(root, "templates"),
		/leftover "templates:". dest is always \.pi/,
	);
	writeYaml(root, "playbooks", "playbooks: all\nskills: []\n");
	assert.throws(() => loadProfile(root, "playbooks"), /leftover "playbooks:"/);
});

test("loadProfile: unknown key dies", () => {
	const root = tempRoot();
	writeYaml(root, "x", "foo: 1\nskills: []\n");
	assert.throws(() => loadProfile(root, "x"), /Unknown profile key "foo"/);
});

test("loadProfile: packages, agents, and prompts shapes", () => {
	const root = tempRoot();
	writeYaml(root, "bare", "skills: []\n");
	writeYaml(
		root,
		"listed",
		`packages:
  - npm:pi-lens
  - local:@agentic-core/heio-boot
agents:
  - architect
  - coder
prompts:
  - arena
`,
	);
	writeYaml(root, "all", "agents: all\nprompts: all\n");
	writeYaml(root, "bad-agents", "agents: true\n");
	writeYaml(root, "bare-pkg", "packages:\n  - heio-todo\n");
	assert.deepEqual(loadProfile(root, "bare").packages, []);
	assert.deepEqual(loadProfile(root, "listed").packages, [
		{ kind: "npm", source: "npm:pi-lens" },
		{ kind: "local", name: "heio-boot" },
	]);
	assert.deepEqual(loadProfile(root, "listed").agents, {
		kind: "list",
		ids: ["architect", "coder"],
	});
	assert.deepEqual(loadProfile(root, "listed").prompts, {
		kind: "list",
		ids: ["arena"],
	});
	assert.deepEqual(loadProfile(root, "all").agents, { kind: "all" });
	assert.deepEqual(loadProfile(root, "all").prompts, { kind: "all" });
	assert.throws(() => loadProfile(root, "bad-agents"), /Invalid agents value/);
	assert.throws(
		() => loadProfile(root, "bare-pkg"),
		/Invalid package source: heio-todo/,
	);
	assert.equal(loadProfile(root, "bare").settings, null);
});

test("loadProfile: settings is an untyped map", () => {
	const root = tempRoot();
	writeYaml(
		root,
		"ok",
		`settings:
  toolDescriptionMode: compact
  retry: 2
  packages:
    - npm:extra
  unknownKey: true
`,
	);
	writeYaml(root, "nullish", "settings: null\n");
	writeYaml(root, "bad", "settings: all\n");
	writeYaml(root, "list", "settings:\n  - nope\n");
	const ok = loadProfile(root, "ok");
	assert.deepEqual(ok.settings, {
		toolDescriptionMode: "compact",
		retry: 2,
		packages: ["npm:extra"],
		unknownKey: true,
	});
	assert.equal(loadProfile(root, "nullish").settings, null);
	assert.throws(() => loadProfile(root, "bad"), /"settings" must be a map/);
	assert.throws(() => loadProfile(root, "list"), /"settings" must be a map/);
});

test("listProfiles sees directory stems and ignores leftover flat yaml", () => {
	const root = tempRoot();
	writeYaml(root, "core", "skills: []\n");
	writeYaml(root, "web", "skills: []\n");
	writeFileSync(join(root, "profiles", "README.md"), "hi\n");
	writeFileSync(join(root, "profiles", "foo.yaml"), "skills: []\n");
	assert.deepEqual(listProfiles(root), ["core", "web"]);
});

test("resolvePlaybookIds: all / list / omit / cli / unknown", () => {
	const available = ["investigation", "feature", "bug-fix", "opening-a-pr"];
	const omit = { kind: "omit" };
	const all = { kind: "all" };
	const list = { kind: "list", ids: ["investigation", "feature"] };
	const none = { playbooks: null, withPlaybooks: [], withoutPlaybooks: [] };

	assert.deepEqual(resolvePlaybookIds(omit, none, available), []);
	assert.deepEqual(resolvePlaybookIds(all, none, available), available);
	assert.deepEqual(resolvePlaybookIds(list, none, available), [
		"investigation",
		"feature",
	]);

	assert.deepEqual(
		resolvePlaybookIds(
			all,
			{ playbooks: ["bug-fix"], withPlaybooks: [], withoutPlaybooks: [] },
			available,
		),
		["bug-fix"],
	);
	assert.deepEqual(
		resolvePlaybookIds(
			list,
			{
				playbooks: null,
				withPlaybooks: ["opening-a-pr"],
				withoutPlaybooks: ["feature"],
			},
			available,
		),
		["investigation", "opening-a-pr"],
	);
	assert.throws(
		() =>
			resolvePlaybookIds(
				list,
				{ playbooks: ["nope"], withPlaybooks: [], withoutPlaybooks: [] },
				available,
			),
		/Unknown playbook "nope"/,
	);
	assert.throws(
		() => resolvePlaybookIds({ kind: "list", ids: ["missing"] }, none, available),
		/Unknown playbook "missing"/,
	);
});

test("renderPlaybookCatalog: with and without when", () => {
	assert.equal(
		renderPlaybookCatalog([
			{ id: "feature", title: "Feature", when: "New behavior." },
		]),
		"- **Feature.** New behavior. `playbooks/feature.md`.",
	);
	assert.equal(
		renderPlaybookCatalog([{ id: "feature", title: "Feature", when: "" }]),
		"- **Feature.** `playbooks/feature.md`.",
	);
});

test("rewriteSkillPlaybooks: replaces between markers and throws if missing", () => {
	const dir = mkdtempSync(join(tmpdir(), "skill-"));
	const skill = join(dir, "SKILL.md");
	writeFileSync(
		skill,
		"intro\n<!-- playbooks:start -->\n- old\n<!-- playbooks:end -->\noutro\n",
	);
	rewriteSkillPlaybooks(dir, [
		{ id: "feature", title: "Feature", when: "New." },
	]);
	assert.equal(
		readFileSync(skill, "utf8"),
		"intro\n<!-- playbooks:start -->\n- **Feature.** New. `playbooks/feature.md`.\n<!-- playbooks:end -->\noutro\n",
	);
	writeFileSync(skill, "no markers\n");
	assert.throws(
		() => rewriteSkillPlaybooks(dir, []),
		/Missing playbooks markers/,
	);
});

test("installPlaybooks: selected files only, second run converges", () => {
	const root = tempRoot();
	mkdirSync(join(root, "ai", "playbooks"), { recursive: true });
	writeFileSync(
		join(root, "ai", "playbooks", "feature.md"),
		"---\ntitle: Feature\nwhen: New.\n---\n\n### Feature\n",
	);
	writeFileSync(
		join(root, "ai", "playbooks", "bug-fix.md"),
		"---\ntitle: Bug fix\nwhen: A defect.\n---\n\n### Bug fix\n",
	);
	writeFileSync(
		join(root, "ai", "playbooks", "eval.md"),
		"---\ntitle: Eval\nwhen: Test a skill.\n---\n\n### Eval\n",
	);

	const dest = mkdtempSync(join(tmpdir(), "dest-"));
	const pbDir = join(dest, ".pi", "playbooks");
	mkdirSync(pbDir, { recursive: true });
	writeFileSync(join(pbDir, "eval.md"), "stale\n");
	writeFileSync(join(pbDir, "leftover.md"), "gone\n");

	const ids = ["feature", "bug-fix"];
	installPlaybooks(root, dest, ids);
	const first = snapshotInstall(dest);
	installPlaybooks(root, dest, ids);
	assert.deepEqual(snapshotInstall(dest), first);

	assert.deepEqual(readdirSync(pbDir).sort(), [
		"bug-fix.md",
		"eval.md",
		"feature.md",
		"leftover.md",
	]);
	assert.match(readFileSync(join(pbDir, "feature.md"), "utf8"), /### Feature/);
	assert.doesNotMatch(readFileSync(join(pbDir, "bug-fix.md"), "utf8"), /Eval/);
});

test("readPlaybookMeta: frontmatter and heading fallback", () => {
	const root = tempRoot();
	mkdirSync(join(root, "ai", "playbooks"), { recursive: true });
	writeFileSync(
		join(root, "ai", "playbooks", "feature.md"),
		"---\ntitle: Feature\nwhen: New or changed behavior.\n---\n\n### Feature\nbody\n",
	);
	writeFileSync(
		join(root, "ai", "playbooks", "bare.md"),
		"### Bare title\nbody\n",
	);
	assert.deepEqual(readPlaybookMeta(root, "feature"), {
		id: "feature",
		title: "Feature",
		when: "New or changed behavior.",
	});
	assert.deepEqual(readPlaybookMeta(root, "bare"), {
		id: "bare",
		title: "Bare title",
		when: "",
	});
});

for (const name of listProfiles(REPO)) {
	test(`install --profile ${name} matches the yaml`, () => {
		const profile = loadProfile(REPO, name);
		const dest = mkdtempSync(join(tmpdir(), `install-${name}-`));
		const r = spawnSync(
			process.execPath,
			[INSTALLER, "install", dest, "--profile", name],
			{ encoding: "utf8" },
		);
		assert.equal(r.status, 0, r.stderr || r.stdout);
		assert.match(r.stdout, new RegExp(`Profile: ${name}`));
		assertInstallMatchesYaml(dest, profile);
	});
}

test("always-on text does not dump dest heio-mode", () => {
	const append = readFileSync(
		join(REPO, "ai", "system-prompts", "default.md"),
		"utf8",
	);
	assert.doesNotMatch(
		append,
		/Read `\.pi\/skills\/heio-mode\/SKILL\.md` in full/,
	);
	assert.doesNotMatch(append, /running heio-mode on Pi/);
});

test("repo profiles resolve every listed skill from skills/", () => {
	for (const name of listProfiles(REPO)) {
		const p = loadProfile(REPO, name);
		for (const skill of p.skills) {
			const dir = findSkillDir(REPO, skill);
			assert.ok(dir, `${name}: ${skill}`);
			assert.doesNotMatch(dir, /\/pi\/skills\//);
		}
	}
	assert.equal(existsSync(join(REPO, "ai", "pi")), false);
	assert.equal(
		existsSync(join(REPO, "ai", "system-prompts", "default.md")),
		true,
	);
	assert.equal(
		existsSync(join(REPO, "ai", "system-prompts", "heio-models.md")),
		false,
	);
	assert.deepEqual(readPiPackages(join(REPO, "ai", "pi")), []);
});

test("installPiRuntime writes boot, does not write models, and leaves prompts alone", () => {
	const root = tempRoot();
	mkdirSync(join(root, "ai", "system-prompts"), { recursive: true });
	writeFileSync(join(root, "ai", "system-prompts", "default.md"), "boot\n");

	const dest = mkdtempSync(join(tmpdir(), "pi-rt-"));
	installPiRuntime(root, dest, { skills: ["how"], playbooks: ["orchestrate"] });
	assert.equal(
		readFileSync(join(dest, ".pi", "APPEND_SYSTEM.md"), "utf8"),
		"boot\n",
	);
	assert.equal(existsSync(join(dest, ".pi", "heio-models.md")), false);
	assert.equal(existsSync(join(dest, ".pi", "prompts", "how.md")), false);

	writeFileSync(join(dest, ".pi", "APPEND_SYSTEM.md"), "custom\n");
	writeFileSync(join(dest, ".pi", "heio-models.md"), "picked\n");
	mkdirSync(join(dest, ".pi", "prompts"), { recursive: true });
	writeFileSync(join(dest, ".pi", "prompts", "leftover.md"), "stale\n");
	installPiRuntime(root, dest, { skills: ["how"], playbooks: ["orchestrate"] });
	assert.equal(
		readFileSync(join(dest, ".pi", "APPEND_SYSTEM.md"), "utf8"),
		"custom\n",
	);
	assert.equal(
		readFileSync(join(dest, ".pi", "heio-models.md"), "utf8"),
		"picked\n",
	);
	assert.equal(existsSync(join(dest, ".pi", "prompts", "leftover.md")), true);
});

test("installPiRuntime does not write dest heio-models.md from the previous filename", () => {
	const root = tempRoot();
	mkdirSync(join(root, "ai", "system-prompts"), { recursive: true });
	writeFileSync(join(root, "ai", "system-prompts", "default.md"), "boot\n");

	const dest = mkdtempSync(join(tmpdir(), "pi-rt-models-mig-"));
	mkdirSync(join(dest, ".pi"), { recursive: true });
	writeFileSync(join(dest, ".pi", "draconic-models.md"), "picked\n");
	installPiRuntime(root, dest);
	assert.equal(existsSync(join(dest, ".pi", "draconic-models.md")), false);
	assert.equal(existsSync(join(dest, ".pi", "heio-models.md")), false);
});

test("installPiRuntime does not merge pack packages into settings.json", () => {
	const root = tempRoot();
	mkdirSync(join(root, "ai", "system-prompts"), { recursive: true });
	writeFileSync(join(root, "ai", "system-prompts", "default.md"), "boot\n");
	writeFileSync(
		join(root, "ai", "system-prompts", "packages.json"),
		JSON.stringify(["npm:pi-lens", "npm:pi-web-access", "npm:pi-subagents"]),
	);

	const dest = mkdtempSync(join(tmpdir(), "pi-rt-pkg-"));
	installPiRuntime(root, dest);
	assert.equal(existsSync(join(dest, ".pi", "settings.json")), false);
});

test("readPiPackages rejects a bad pack list", () => {
	const root = tempRoot();
	mkdirSync(join(root, "ai", "pi"), { recursive: true });
	writeFileSync(join(root, "ai", "pi", "packages.json"), "{}\n");
	assert.throws(
		() => readPiPackages(join(root, "ai", "pi")),
		/must be a JSON array/,
	);
});

test("mergePiSettingsPackages is idempotent and keeps object-form sources", () => {
	const dest = join(mkdtempSync(join(tmpdir(), "pi-merge-")), "settings.json");
	mergePiSettingsPackages(dest, ["npm:pi-lens"]);
	mergePiSettingsPackages(dest, ["npm:pi-lens"]);
	assert.deepEqual(JSON.parse(readFileSync(dest, "utf8")), {
		packages: ["npm:pi-lens"],
	});
	assert.equal(packageSource({ source: "npm:pi-lens" }), "npm:pi-lens");
});

test("mergePiSettings deep-merges objects, set-unions arrays, keeps dest extras", () => {
	const dest = join(
		mkdtempSync(join(tmpdir(), "pi-settings-")),
		"settings.json",
	);
	writeFileSync(
		dest,
		`${JSON.stringify(
			{
				keep: "dest",
				nested: { a: 1, b: 2 },
				defaultTools: ["custom", "read"],
				retry: 1,
			},
			null,
			2,
		)}\n`,
	);
	mergePiSettings(dest, {
		nested: { b: 9, c: 3 },
		defaultTools: ["read", "bash"],
		retry: 2,
		toolDescriptionMode: "compact",
	});
	assert.deepEqual(JSON.parse(readFileSync(dest, "utf8")), {
		keep: "dest",
		nested: { a: 1, b: 9, c: 3 },
		defaultTools: ["custom", "read", "bash"],
		retry: 2,
		toolDescriptionMode: "compact",
	});
	mergePiSettings(dest, {
		defaultTools: ["read", "bash"],
		retry: 2,
	});
	assert.deepEqual(JSON.parse(readFileSync(dest, "utf8")).defaultTools, [
		"custom",
		"read",
		"bash",
	]);
});

test("mergePiSettings creates dest settings and preserves number types", () => {
	const dest = join(
		mkdtempSync(join(tmpdir(), "pi-settings-new-")),
		"settings.json",
	);
	mergePiSettings(dest, { retry: 2, nested: { timeout: 1.5 } });
	const got = JSON.parse(readFileSync(dest, "utf8"));
	assert.deepEqual(got, { retry: 2, nested: { timeout: 1.5 } });
	assert.equal(typeof got.retry, "number");
	assert.equal(typeof got.nested.timeout, "number");
});

test("installPiRuntime rewrites a dest APPEND_SYSTEM that still matches the old persona", () => {
	const root = tempRoot();
	mkdirSync(join(root, "ai", "system-prompts"), { recursive: true });
	writeFileSync(join(root, "ai", "system-prompts", "default.md"), "new stub\n");

	const dest = mkdtempSync(join(tmpdir(), "pi-rt-append-mig-"));
	mkdirSync(join(dest, ".pi"), { recursive: true });
	writeFileSync(
		join(dest, ".pi", "APPEND_SYSTEM.md"),
		"# Draconic\n\nYou are running draconic-mode on Pi for this project.\n",
	);
	installPiRuntime(root, dest);
	assert.equal(
		readFileSync(join(dest, ".pi", "APPEND_SYSTEM.md"), "utf8"),
		"new stub\n",
	);

	writeFileSync(join(dest, ".pi", "APPEND_SYSTEM.md"), "custom persona\n");
	installPiRuntime(root, dest);
	assert.equal(
		readFileSync(join(dest, ".pi", "APPEND_SYSTEM.md"), "utf8"),
		"custom persona\n",
	);
});

test("installPiRuntime rewrites a dest APPEND_SYSTEM that still names the dest router", () => {
	const root = tempRoot();
	mkdirSync(join(root, "ai", "system-prompts"), { recursive: true });
	writeFileSync(join(root, "ai", "system-prompts", "default.md"), "new stub\n");

	const dest = mkdtempSync(join(tmpdir(), "pi-rt-append-variant-"));
	mkdirSync(join(dest, ".pi"), { recursive: true });
	writeFileSync(
		join(dest, ".pi", "APPEND_SYSTEM.md"),
		`# Draconic\n\nYou are running draconic-mode on Pi for this project.\n\n1. Read \`.pi/skills/draconic-mode/SKILL.md\` in full.\nWrite .draconic/TODO.md.\n`,
	);
	installPiRuntime(root, dest);
	assert.equal(
		readFileSync(join(dest, ".pi", "APPEND_SYSTEM.md"), "utf8"),
		"new stub\n",
	);
});

test("installAgents writes selected files and keeps dest extras", () => {
	const root = tempRoot();
	mkdirSync(join(root, "ai", "agents", "architect"), { recursive: true });
	mkdirSync(join(root, "ai", "agents", "coder"), { recursive: true });
	writeFileSync(
		join(root, "ai", "agents", "architect", "architect.md"),
		"architect body\n",
	);
	writeFileSync(join(root, "ai", "agents", "coder", "coder.md"), "coder body\n");

	const dest = mkdtempSync(join(tmpdir(), "pi-agents-"));
	mkdirSync(join(dest, ".pi", "agents"), { recursive: true });
	writeFileSync(join(dest, ".pi", "agents", "leftover.md"), "gone\n");
	installAgents(root, dest, ["architect"]);
	assert.deepEqual(readdirSync(join(dest, ".pi", "agents")).sort(), [
		"architect.md",
		"leftover.md",
	]);
	assert.equal(
		readFileSync(join(dest, ".pi", "agents", "architect.md"), "utf8"),
		"architect body\n",
	);
});

test("installPrompts writes selected files from ai/prompts", () => {
	const root = tempRoot();
	mkdirSync(join(root, "ai", "prompts"), { recursive: true });
	writeFileSync(join(root, "ai", "prompts", "arena.md"), "arena body\n");
	writeFileSync(join(root, "ai", "prompts", "swarm.md"), "swarm body\n");

	const dest = mkdtempSync(join(tmpdir(), "pi-prompts-"));
	mkdirSync(join(dest, ".pi", "prompts"), { recursive: true });
	writeFileSync(join(dest, ".pi", "prompts", "leftover.md"), "gone\n");
	installPrompts(root, dest, ["arena"]);
	assert.deepEqual(readdirSync(join(dest, ".pi", "prompts")).sort(), [
		"arena.md",
		"leftover.md",
	]);
	assert.equal(
		readFileSync(join(dest, ".pi", "prompts", "arena.md"), "utf8"),
		"arena body\n",
	);
});

test("installPiRuntime removes leftover dest roles", () => {
	const root = tempRoot();
	mkdirSync(join(root, "ai", "system-prompts"), { recursive: true });
	writeFileSync(join(root, "ai", "system-prompts", "default.md"), "boot\n");

	const dest = mkdtempSync(join(tmpdir(), "pi-rt-roles-"));
	mkdirSync(join(dest, ".pi", "roles"), { recursive: true });
	writeFileSync(join(dest, ".pi", "roles", "architect.md"), "old role\n");
	writeFileSync(join(dest, ".pi", "roles", "argv.mjs"), "old helper\n");
	installPiRuntime(root, dest);
	assert.equal(existsSync(join(dest, ".pi", "roles")), false);
});

test("installPiRuntime dies when the pack is incomplete", () => {
	const root = tempRoot();
	mkdirSync(join(root, "ai", "system-prompts"), { recursive: true });
	const dest = mkdtempSync(join(tmpdir(), "pi-rt-missing-"));
	assert.throws(
		() => installPiRuntime(root, dest),
		/Pi pack missing: expected ai\/system-prompts\/default.md/,
	);
});

test("findSkillDir reads skills/ only", () => {
	const playbooks = findSkillDir(REPO, "playbooks");
	assert.ok(
		playbooks.endsWith(join("skills", "workflow", "playbooks")),
		playbooks,
	);
	assert.equal(findSkillDir(REPO, "no-such-skill"), null);
});

test("install --profile agentic-core writes the Pi runtime pack", () => {
	const dest = mkdtempSync(join(tmpdir(), "install-pi-"));
	const r = spawnSync(
		process.execPath,
		[INSTALLER, "install", dest, "--profile", "agentic-core"],
		{ encoding: "utf8" },
	);
	assert.equal(r.status, 0, r.stderr || r.stdout);
	assert.match(r.stdout, /Profile: agentic-core/);
	assert.doesNotMatch(r.stdout, /Harness:/);
	assert.equal(
		existsSync(join(dest, ".pi", "skills", "heio-mode", "SKILL.md")),
		false,
	);
	assert.equal(existsSync(join(dest, ".pi", "playbooks", "feature.md")), false);
	assert.equal(existsSync(join(dest, ".pi", "roles")), false);
	assert.equal(existsSync(join(dest, ".pi", "agents", "heio.md")), false);
	const profile = loadProfile(REPO, "agentic-core");
	const npmRoot = join(dest, ".pi", "npm", "local", "@agentic-core");
	for (const pkg of profile.packages) {
		if (pkg.kind !== "local") continue;
		assert.equal(
			existsSync(join(npmRoot, pkg.name, "src", "index.ts")),
			true,
			pkg.name,
		);
	}
	assert.equal(existsSync(join(npmRoot, "heio-coms")), false);
	assert.equal(existsSync(join(npmRoot, "heio-teams")), false);
	assert.equal(existsSync(join(dest, ".pi", "vendor", "@agentic-core")), false);
	const append = readFileSync(join(dest, ".pi", "APPEND_SYSTEM.md"), "utf8");
	assert.doesNotMatch(append, /running heio-mode on Pi/);
	assert.doesNotMatch(
		append,
		/Read `\.pi\/skills\/heio-mode\/SKILL\.md` in full/,
	);
	assert.equal(existsSync(join(dest, ".pi", "heio-models.md")), false);
	assert.deepEqual(
		JSON.parse(readFileSync(join(dest, ".pi", "settings.json"), "utf8")),
		expectedSettings(profile),
	);
	assert.match(
		r.stdout,
		/Pi installs project packages from \.pi\/settings\.json/,
	);
	assert.equal(existsSync(join(dest, "AGENTS.md")), false);
	assert.equal(existsSync(join(dest, ".opencode")), false);
	assert.equal(existsSync(join(dest, ".claude")), false);
	assert.equal(existsSync(join(dest, ".agents")), false);
	assert.equal(existsSync(join(dest, ".heio")), false);
});

test("agentic-core hivemind.yaml is a full heio-stack template", () => {
	const yaml = readFileSync(
		join(REPO, "profiles", "agentic-core", "hivemind.yaml"),
		"utf8",
	);
	assert.match(yaml, /\.heio\/tickets/);
	assert.match(yaml, /\.heio\/planning/);
	assert.match(yaml, /\.heio\/archive/);
	assert.match(yaml, /\.heio\/quarantine/);
	assert.match(yaml, /sealed/i);
	assert.match(yaml, /\bready\b/);
	assert.match(yaml, /^ {2}plan:/m);
	assert.match(yaml, /^ {2}tasker:/m);
	assert.match(yaml, /^ {2}build:/m);
	assert.match(yaml, /^ {2}review:/m);
	assert.match(yaml, /claim-status:/);
	assert.match(yaml, /mint-status:\s*ready-for-human/);
	assert.match(yaml, /\{\{agent\}\}/);
	assert.match(yaml, /\{\{prompt\}\}/);
	const mintLane = /^ {2}mint:/m.test(yaml);
	const mintDisabled = /(?:^|\n)disable:[\s\S]*\bmint\b/.test(yaml);
	assert.equal(mintLane && !mintDisabled, false);
	assert.deepEqual(loadProfile(REPO, "agentic-core").frameworks, ["hivemind"]);
});

test("install --profile agentic-core writes .pi only", () => {
	const dest = mkdtempSync(join(tmpdir(), "install-agentic-core-"));
	const r = spawnSync(
		process.execPath,
		[INSTALLER, "install", dest, "--profile", "agentic-core"],
		{ encoding: "utf8" },
	);
	assert.equal(r.status, 0, r.stderr || r.stdout);
	assert.match(r.stdout, /Profile: agentic-core/);
	assert.doesNotMatch(r.stdout, /Harness:/);
	assert.equal(
		existsSync(join(dest, ".pi", "skills", "heio-mode", "SKILL.md")),
		false,
	);
	assert.equal(existsSync(join(dest, ".pi", "playbooks", "feature.md")), false);
	assert.equal(existsSync(join(dest, ".pi", "skills")), true);
	assert.equal(existsSync(join(dest, ".opencode")), false);
	assert.equal(existsSync(join(dest, ".claude")), false);
	assert.equal(existsSync(join(dest, ".agents")), false);
});

test("install --profile life-engine writes .pi only", () => {
	const dest = mkdtempSync(join(tmpdir(), "install-life-engine-"));
	const r = spawnSync(
		process.execPath,
		[INSTALLER, "install", dest, "--profile", "life-engine"],
		{ encoding: "utf8" },
	);
	assert.equal(r.status, 0, r.stderr || r.stdout);
	assert.match(r.stdout, /Profile: life-engine/);
	assert.doesNotMatch(r.stdout, /Harness:/);
	assert.equal(
		existsSync(join(dest, ".pi", "skills", "heio-mode", "SKILL.md")),
		false,
	);
	assert.equal(existsSync(join(dest, ".pi", "playbooks", "feature.md")), false);
	assert.equal(existsSync(join(dest, ".pi", "skills")), true);
	assert.equal(existsSync(join(dest, ".pi", "vendor", "@agentic-core")), false);
	assert.equal(existsSync(join(dest, ".opencode")), false);
	assert.equal(existsSync(join(dest, ".claude")), false);
	assert.equal(existsSync(join(dest, ".agents")), false);
});

test("install --profile agentic-core --without diagnose omits the diagnose skill", () => {
	const dest = mkdtempSync(join(tmpdir(), "install-pi-without-"));
	const r = spawnSync(
		process.execPath,
		[
			INSTALLER,
			"install",
			dest,
			"--profile",
			"agentic-core",
			"--without",
			"diagnose",
		],
		{ encoding: "utf8" },
	);
	assert.equal(r.status, 0, r.stderr || r.stdout);
	assert.equal(
		existsSync(join(dest, ".pi", "skills", "diagnose", "SKILL.md")),
		false,
	);
});

test("install --profile agentic-core writes .pi/skills", () => {
	const dest = mkdtempSync(join(tmpdir(), "install-core-"));
	const r = spawnSync(
		process.execPath,
		[
			INSTALLER,
			"install",
			dest,
			"--profile",
			"agentic-core",
			"--without",
			CORE_WITHOUT,
		],
		{ encoding: "utf8" },
	);
	assert.equal(r.status, 0, r.stderr || r.stdout);
	assert.equal(
		existsSync(join(dest, ".pi", "skills", "heio-stack", "SKILL.md")),
		true,
	);
	assert.equal(existsSync(join(dest, ".pi", "APPEND_SYSTEM.md")), true);
	assert.equal(existsSync(join(dest, ".opencode")), false);
	assert.equal(existsSync(join(dest, ".claude")), false);
	assert.equal(existsSync(join(dest, ".agents")), false);
});

test("install --harness dies", () => {
	const dest = mkdtempSync(join(tmpdir(), "install-bad-harness-"));
	const r = spawnSync(
		process.execPath,
		[INSTALLER, "install", dest, "--profile", "core", "--harness", "pi"],
		{ encoding: "utf8" },
	);
	assert.notEqual(r.status, 0);
	assert.match(r.stderr, /Unknown flag: --harness/);
});

test("install uses profiles yaml only and does not write preference stubs", () => {
	const dest = mkdtempSync(join(tmpdir(), "install-"));
	const r = spawnSync(
		process.execPath,
		[
			INSTALLER,
			"install",
			dest,
			"--profile",
			"agentic-core",
			"--without",
			"domain-modeling,wayfinder,tdd,handoff,improve-codebase-architecture,codebase-design,setup-matt-pocock-skills,research,prototype,planning,planning-with-docs,management,docs,unslop",
		],
		{ encoding: "utf8" },
	);
	assert.equal(r.status, 0, r.stderr || r.stdout);
	assert.match(r.stdout, /Profile: agentic-core/);
	assert.doesNotMatch(r.stdout, /prefs/);
	assert.equal(existsSync(join(dest, "AGENTS.md")), false);
	assert.equal(existsSync(join(dest, "CLAUDE.md")), false);
	assert.equal(
		existsSync(join(dest, ".github", "copilot-instructions.md")),
		false,
	);
	assert.equal(existsSync(join(dest, ".pi", "APPEND_SYSTEM.md")), true);
	assert.equal(existsSync(join(dest, ".opencode")), false);
	assert.equal(existsSync(join(dest, ".claude")), false);
	assert.equal(existsSync(join(REPO, "preferences")), false);
});

test("pstack source tree is gone and heio install resolves", () => {
	const r = spawnSync(
		process.execPath,
		[join(REPO, "tests", "checks", "check-no-pstack.mjs")],
		{
			encoding: "utf8",
		},
	);
	assert.equal(r.status, 0, r.stderr || r.stdout);
});

test("ported life-engine skills keep the management/docs split", () => {
	const r = spawnSync(
		process.execPath,
		[join(REPO, "tests", "checks", "check-ported-skills.mjs")],
		{
			encoding: "utf8",
		},
	);
	assert.equal(r.status, 0, r.stderr || r.stdout);
});

test("hivemind layout keeps profile dirs and frameworks dest", () => {
	const r = spawnSync(
		process.execPath,
		[join(REPO, "tests", "checks", "check-hivemind-layout.mjs")],
		{
			encoding: "utf8",
		},
	);
	assert.equal(r.status, 0, r.stderr || r.stdout);
});

test("check-profile-dirs prints directory-profile oracle tokens", () => {
	const r = spawnSync(
		process.execPath,
		[join(REPO, "tests", "checks", "check-profile-dirs.mjs")],
		{
			encoding: "utf8",
		},
	);
	assert.equal(r.status, 0, r.stderr || r.stdout);
	assert.match(
		r.stdout,
		/loadProfile\(root, "agentic-core"\) reads profiles\/agentic-core\/profile\.yaml/,
	);
	assert.match(
		r.stdout,
		/listProfiles sees directory stems; leftover profiles\/foo\.yaml is not a profile/,
	);
});

test("root npm scripts call one scripts mjs file each", () => {
	const pkg = JSON.parse(readFileSync(join(REPO, "package.json"), "utf8"));
	for (const [name, value] of Object.entries(pkg.scripts)) {
		assert.match(value, /^scripts\/[a-z0-9-]+\.mjs$/, `${name}: ${value}`);
		assert.equal(existsSync(join(REPO, value)), true, value);
	}
});

test("try-teams outside tmux prints the bar and exits 0", () => {
	const env = { ...process.env };
	delete env.TMUX;
	const r = spawnSync(
		process.execPath,
		[join(REPO, "deprecated", "scripts", "try-teams.mjs")],
		{ encoding: "utf8", env },
	);
	assert.equal(r.status, 0, r.stderr);
	assert.match(r.stdout, /Teams living bar/);
	assert.match(r.stdout, /node deprecated\/scripts\/try-teams\.mjs/);
	assert.match(r.stdout, /Not inside tmux/);
	assert.doesNotMatch(r.stdout, /bash scripts\/try-teams\.sh/);
});

test("scripts root holds npm entrypoints only", () => {
	const allowed = new Set(["test.mjs", "typecheck.mjs"]);
	const scripts = join(REPO, "scripts");
	const rootFiles = readdirSync(scripts).filter((name) => {
		const full = join(scripts, name);
		return !name.startsWith(".") && !statSync(full).isDirectory();
	});
	for (const name of rootFiles) {
		assert.equal(allowed.has(name), true, name);
	}
	assert.equal(existsSync(join(scripts, "checks")), false);
	assert.equal(existsSync(join(scripts, "lib")), false);
	assert.equal(existsSync(join(scripts, "fixtures")), false);
	assert.equal(
		existsSync(join(REPO, "tests", "checks", "check-no-pstack.mjs")),
		true,
	);
	assert.equal(
		existsSync(join(REPO, "tests", "checks", "check-ported-skills.mjs")),
		true,
	);
	assert.equal(
		existsSync(join(REPO, "tests", "checks", "check-hivemind-layout.mjs")),
		true,
	);
	assert.equal(existsSync(join(REPO, "tests", "lib", "profile.mjs")), true);
	assert.equal(
		existsSync(join(REPO, "deprecated", "scripts", "try-coms.mjs")),
		true,
	);
	const shellFiles = [];
	walkFiles(scripts, (file) => {
		if (file.endsWith(".sh")) shellFiles.push(file.replace(REPO + "/", ""));
	});
	assert.deepEqual(shellFiles, []);
});

function walkFiles(dir, visit) {
	for (const ent of readdirSync(dir, { withFileTypes: true })) {
		if (ent.name.startsWith(".")) continue;
		const full = join(dir, ent.name);
		if (ent.isDirectory()) walkFiles(full, visit);
		else visit(full);
	}
}

function destDirNames(dest, rel) {
	const root = join(dest, rel);
	if (!existsSync(root)) return [];
	return readdirSync(root, { withFileTypes: true })
		.filter((ent) => ent.isDirectory())
		.map((ent) => ent.name)
		.sort();
}

function destMarkdownStems(dest, rel) {
	const root = join(dest, rel);
	if (!existsSync(root)) return [];
	return readdirSync(root, { withFileTypes: true })
		.filter((ent) => ent.isFile() && ent.name.endsWith(".md"))
		.map((ent) => ent.name.slice(0, -3))
		.sort();
}

function expectedNamedIds(selection, available) {
	if (selection.kind === "omit") return [];
	if (selection.kind === "all") return [...available];
	return [...new Set(selection.ids)];
}

function expectedSettings(profile) {
	const packages = profile.packages.map(packageRefSource);
	if (packages.length === 0 && profile.settings == null) return null;
	return {
		...(packages.length > 0 ? { packages } : {}),
		...(profile.settings ?? {}),
	};
}

function assertInstallMatchesYaml(dest, profile) {
	const skills = destDirNames(dest, ".pi/skills");
	assert.deepEqual(skills, [...new Set(profile.skills)].sort());
	for (const name of skills) {
		assert.equal(
			existsSync(join(dest, ".pi", "skills", name, "SKILL.md")),
			true,
			name,
		);
	}

	assert.deepEqual(
		destMarkdownStems(dest, ".pi/agents"),
		expectedNamedIds(profile.agents, listAgentIds(REPO)).sort(),
	);
	assert.deepEqual(
		destMarkdownStems(dest, ".pi/prompts"),
		expectedNamedIds(profile.prompts, listPromptIds(REPO)).sort(),
	);

	const localNames = profile.packages
		.filter((pkg) => pkg.kind === "local")
		.map((pkg) => pkg.name)
		.sort();
	assert.deepEqual(
		destDirNames(dest, ".pi/npm/local/@agentic-core"),
		localNames,
	);

	const settingsPath = join(dest, ".pi", "settings.json");
	const expected = expectedSettings(profile);
	if (expected == null) {
		assert.equal(existsSync(settingsPath), false);
		return;
	}
	assert.deepEqual(JSON.parse(readFileSync(settingsPath, "utf8")), expected);
}

function tempRoot() {
	const root = mkdtempSync(join(tmpdir(), "profile-"));
	mkdirSync(join(root, "profiles"));
	return root;
}

function writeYaml(root, name, body) {
	const dir = join(root, "profiles", name);
	mkdirSync(dir, { recursive: true });
	writeFileSync(join(dir, "profile.yaml"), body);
}

function snapshotInstall(dest) {
	const pbDir = join(dest, ".pi", "playbooks");
	const out = { playbooks: {} };
	for (const name of readdirSync(pbDir).sort()) {
		out.playbooks[name] = readFileSync(join(pbDir, name), "utf8");
	}
	return out;
}
