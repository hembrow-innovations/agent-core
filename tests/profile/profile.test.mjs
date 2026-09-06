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
	catalogFromSource,
	findPromptFile,
	findSkillDir,
	installAgents,
	installPlaybooks,
	installPrompts,
	listProfiles,
	listPromptIds,
	loadProfile,
	parseProfileYaml,
	planFromProfile,
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

test("loadProfile: defaults omit agents and prompts", () => {
	const root = tempRoot();
	writeYaml(root, "bare", "skills: []\n");

	const bare = loadProfile(root, "bare");
	assert.deepEqual(bare, {
		name: "bare",
		stacks: [],
		skills: [],
		agents: { kind: "omit" },
		prompts: { kind: "omit" },
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
		/leftover "mode:". the installer does not copy playbooks/,
	);
	writeYaml(root, "harness", "harness: pi\nskills: []\n");
	assert.throws(
		() => loadProfile(root, "harness"),
		/leftover "harness:". dest is always \.opencode/,
	);
	writeYaml(root, "old-pi", "pi: false\nskills: []\n");
	assert.throws(
		() => loadProfile(root, "old-pi"),
		/leftover "pi:". dest is always \.opencode/,
	);
	writeYaml(root, "commands", "commands: true\nskills: []\n");
	assert.throws(
		() => loadProfile(root, "commands"),
		/leftover "commands:". use prompts:/,
	);
	writeYaml(root, "extensions", "extensions:\n  - heio-todo\n");
	assert.throws(
		() => loadProfile(root, "extensions"),
		/leftover "extensions:". Pi packages are deprecated/,
	);
	writeYaml(root, "templates", "templates: true\nskills: []\n");
	assert.throws(
		() => loadProfile(root, "templates"),
		/leftover "templates:". dest is always \.opencode/,
	);
	writeYaml(root, "playbooks", "playbooks: all\nskills: []\n");
	assert.throws(() => loadProfile(root, "playbooks"), /leftover "playbooks:"/);
	writeYaml(root, "frameworks", "frameworks:\n  - hivemind\n");
	assert.throws(
		() => loadProfile(root, "frameworks"),
		/leftover "frameworks:". hivemind is not installed from this pack/,
	);
});

test("loadProfile: unknown key dies", () => {
	const root = tempRoot();
	writeYaml(root, "x", "foo: 1\nskills: []\n");
	assert.throws(() => loadProfile(root, "x"), /Unknown profile key "foo"/);
});

test("loadProfile: agents and prompts shapes", () => {
	const root = tempRoot();
	writeYaml(root, "bare", "skills: []\n");
	writeYaml(
		root,
		"listed",
		`agents:
  - architect
  - coder
prompts:
  - arena
`,
	);
	writeYaml(root, "all", "agents: all\nprompts: all\n");
	writeYaml(root, "bad-agents", "agents: true\n");
	writeYaml(root, "bare-pkg", "packages:\n  - heio-todo\n");
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
		/leftover "packages:". Pi packages are deprecated/,
	);
});

test("loadProfile: leftover Pi runtime keys die", () => {
	const root = tempRoot();
	writeYaml(root, "set", "settings:\n  toolDescriptionMode: compact\n");
	writeYaml(root, "sys", "system-prompt: default\n");
	assert.throws(
		() => loadProfile(root, "set"),
		/leftover "settings:". Pi runtime is deprecated/,
	);
	assert.throws(
		() => loadProfile(root, "sys"),
		/leftover "system-prompt:". Pi runtime is deprecated/,
	);
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
	const pbDir = join(dest, ".opencode", "playbooks");
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
		join(REPO, "deprecated", "system-prompts", "default.md"),
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
	assert.equal(existsSync(join(REPO, "ai", "system-prompts")), false);
	assert.equal(
		existsSync(join(REPO, "deprecated", "system-prompts", "default.md")),
		true,
	);
	assert.equal(
		existsSync(join(REPO, "deprecated", "system-prompts", "heio-models.md")),
		false,
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

	const dest = mkdtempSync(join(tmpdir(), "opencode-agents-"));
	mkdirSync(join(dest, ".opencode", "agents"), { recursive: true });
	writeFileSync(join(dest, ".opencode", "agents", "leftover.md"), "gone\n");
	installAgents(root, dest, ["architect"]);
	assert.deepEqual(readdirSync(join(dest, ".opencode", "agents")).sort(), [
		"architect.md",
		"leftover.md",
	]);
	assert.equal(
		readFileSync(join(dest, ".opencode", "agents", "architect.md"), "utf8"),
		"architect body\n",
	);
});

test("installPrompts writes selected files from nested ai/prompts", () => {
	const root = tempRoot();
	mkdirSync(join(root, "ai", "prompts", "workflow"), { recursive: true });
	writeFileSync(
		join(root, "ai", "prompts", "workflow", "arena.md"),
		"arena body\n",
	);
	writeFileSync(join(root, "ai", "prompts", "swarm.md"), "swarm body\n");

	const dest = mkdtempSync(join(tmpdir(), "opencode-prompts-"));
	mkdirSync(join(dest, ".opencode", "commands"), { recursive: true });
	writeFileSync(join(dest, ".opencode", "commands", "leftover.md"), "gone\n");
	installPrompts(root, dest, ["arena"]);
	assert.deepEqual(readdirSync(join(dest, ".opencode", "commands")).sort(), [
		"arena.md",
		"leftover.md",
	]);
	assert.equal(
		readFileSync(join(dest, ".opencode", "commands", "arena.md"), "utf8"),
		"arena body\n",
	);
});

test("listPromptIds walks nested prompt markdown", () => {
	const root = tempRoot();
	mkdirSync(join(root, "ai", "prompts", "heio-stack"), { recursive: true });
	writeFileSync(
		join(root, "ai", "prompts", "heio-stack", "heio-slice.md"),
		"slice\n",
	);
	writeFileSync(join(root, "ai", "prompts", "arena.md"), "arena\n");
	writeFileSync(join(root, "ai", "prompts", "README.md"), "skip\n");
	assert.deepEqual(listPromptIds(root), ["arena", "heio-slice"]);
	assert.ok(
		findPromptFile(root, "heio-slice").endsWith(
			join("prompts", "heio-stack", "heio-slice.md"),
		),
	);
	assert.equal(findPromptFile(root, "no-such-prompt"), null);
});

test("listPromptIds rejects duplicate prompt stems", () => {
	const root = tempRoot();
	mkdirSync(join(root, "ai", "prompts", "a"), { recursive: true });
	mkdirSync(join(root, "ai", "prompts", "b"), { recursive: true });
	writeFileSync(join(root, "ai", "prompts", "a", "arena.md"), "a\n");
	writeFileSync(join(root, "ai", "prompts", "b", "arena.md"), "b\n");
	assert.throws(() => listPromptIds(root), /Duplicate prompt id: arena/);
});

test("findSkillDir reads skills/ only", () => {
	const playbooks = findSkillDir(REPO, "playbooks");
	assert.ok(
		playbooks.endsWith(join("skills", "workflow", "playbooks")),
		playbooks,
	);
	assert.equal(findSkillDir(REPO, "no-such-skill"), null);
});

test("findSkillDir reads stack skills", () => {
	const unpark = findSkillDir(REPO, "unpark");
	assert.ok(
		unpark.endsWith(join("stacks", "heio-stack", "skills", "unpark")),
		unpark,
	);
});

test("install --profile agentic-core writes the OpenCode dest pack", () => {
	const dest = mkdtempSync(join(tmpdir(), "install-opencode-"));
	const r = spawnSync(
		process.execPath,
		[INSTALLER, "install", dest, "--profile", "agentic-core"],
		{ encoding: "utf8" },
	);
	assert.equal(r.status, 0, r.stderr || r.stdout);
	assert.match(r.stdout, /Profile: agentic-core/);
	assert.doesNotMatch(r.stdout, /Harness:/);
	assert.equal(
		existsSync(join(dest, ".opencode", "skills", "heio-mode", "SKILL.md")),
		false,
	);
	assert.equal(
		existsSync(join(dest, ".opencode", "playbooks", "feature.md")),
		false,
	);
	assert.equal(existsSync(join(dest, ".pi")), false);
	assert.equal(existsSync(join(dest, ".opencode", "agents", "heio.md")), false);
	assert.equal(existsSync(join(dest, ".opencode", "settings.json")), false);
	assert.equal(existsSync(join(dest, "AGENTS.md")), false);
	assert.equal(existsSync(join(dest, ".claude")), false);
	assert.equal(existsSync(join(dest, ".agents")), false);
	assert.equal(existsSync(join(dest, ".heio")), false);
});

test("install --profile agentic-core writes .opencode only", () => {
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
		existsSync(join(dest, ".opencode", "skills", "heio-mode", "SKILL.md")),
		false,
	);
	assert.equal(
		existsSync(join(dest, ".opencode", "playbooks", "feature.md")),
		false,
	);
	assert.equal(existsSync(join(dest, ".opencode", "skills")), true);
	assert.equal(existsSync(join(dest, ".pi")), false);
	assert.equal(existsSync(join(dest, ".claude")), false);
	assert.equal(existsSync(join(dest, ".agents")), false);
});

test("install --profile life-engine writes .opencode only", () => {
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
		existsSync(join(dest, ".opencode", "skills", "heio-mode", "SKILL.md")),
		false,
	);
	assert.equal(
		existsSync(join(dest, ".opencode", "playbooks", "feature.md")),
		false,
	);
	assert.equal(existsSync(join(dest, ".opencode", "skills")), true);
	assert.equal(existsSync(join(dest, ".pi")), false);
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
		existsSync(join(dest, ".opencode", "skills", "diagnose", "SKILL.md")),
		false,
	);
});

test("install --profile agentic-core writes .opencode/skills", () => {
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
		existsSync(join(dest, ".opencode", "skills", "heio-stack", "SKILL.md")),
		true,
	);
	assert.equal(existsSync(join(dest, ".opencode", "APPEND_SYSTEM.md")), false);
	assert.equal(existsSync(join(dest, ".pi")), false);
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
	assert.equal(existsSync(join(dest, ".opencode", "skills")), true);
	assert.equal(existsSync(join(dest, ".pi")), false);
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

test("check-rounds-os prints check-rounds-os: ok", () => {
	const r = spawnSync(
		process.execPath,
		[join(REPO, "tests", "checks", "check-rounds-os.mjs")],
		{
			encoding: "utf8",
		},
	);
	assert.equal(r.status, 0, r.stderr || r.stdout);
	assert.match(r.stdout, /check-rounds-os: ok/);
});

test("check-rounds-loop prints check-rounds-loop: ok", () => {
	const r = spawnSync(
		process.execPath,
		[join(REPO, "tests", "checks", "check-rounds-loop.mjs")],
		{
			encoding: "utf8",
		},
	);
	assert.equal(r.status, 0, r.stderr || r.stdout);
	assert.match(r.stdout, /check-rounds-loop: ok/);
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

function assertInstallMatchesYaml(dest, profile) {
	const plan = planFromProfile(
		profile,
		{
			kind: "install",
			target: dest,
			profile: profile.name,
			with: [],
			without: [],
		},
		catalogFromSource(REPO),
	);
	const skills = destDirNames(dest, ".opencode/skills");
	assert.deepEqual(skills, plan.skills);
	for (const name of skills) {
		assert.equal(
			existsSync(join(dest, ".opencode", "skills", name, "SKILL.md")),
			true,
			name,
		);
	}

	assert.deepEqual(destMarkdownStems(dest, ".opencode/agents"), plan.agentIds);
	assert.deepEqual(
		destMarkdownStems(dest, ".opencode/commands"),
		plan.promptIds,
	);
	assert.equal(existsSync(join(dest, ".pi")), false);
	assert.equal(existsSync(join(dest, ".opencode", "settings.json")), false);
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
	const pbDir = join(dest, ".opencode", "playbooks");
	const out = { playbooks: {} };
	for (const name of readdirSync(pbDir).sort()) {
		out.playbooks[name] = readFileSync(join(pbDir, name), "utf8");
	}
	return out;
}
