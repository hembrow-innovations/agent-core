import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
	existsSync,
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
import {
	findSkillDir,
	installAgents,
	installPlaybooks,
	installPiRuntime,
	installPrompts,
	listProfiles,
	loadProfile,
	mergePiSettingsPackages,
	packageSource,
	parseProfileYaml,
	readPiPackages,
	readPlaybookMeta,
	renderPlaybookCatalog,
	resolvePlaybookIds,
	rewriteSkillPlaybooks,
} from "../../scripts/profile.mjs";

const REPO = fileURLToPath(new URL("../..", import.meta.url));
const INSTALLER = join(REPO, "packages", "installer", "src", "cli.ts");
const CORE_WITHOUT =
	"domain-modeling,wayfinder,tdd,handoff,improve-codebase-architecture,codebase-design,setup-matt-pocock-skills,research,prototype,planning,planning-with-docs,management,docs,unslop";

test("parseProfileYaml: comments, scalars, booleans, lists, all", () => {
	const got = parseProfileYaml(`
# header
mode: draconic
playbooks: all
skills: [architect, arena]
empty: []
`);
	assert.deepEqual(got, {
		mode: "draconic",
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

test("parseProfileYaml: throws on nested maps", () => {
	assert.throws(
		() =>
			parseProfileYaml(`
playbooks:
  kind: all
`),
		/Nested maps/,
	);
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

test("loadProfile: defaults and playbooks shapes", () => {
	const root = tempRoot();
	writeYaml(root, "bare", "skills: []\n");
	writeYaml(root, "all", "playbooks: all\n");
	writeYaml(
		root,
		"listed",
		`playbooks:
  - investigation
  - feature
`,
	);
	writeYaml(root, "empty", "playbooks: []\n");

	const bare = loadProfile(root, "bare");
	assert.deepEqual(bare, {
		name: "bare",
		skills: [],
		playbooks: { kind: "omit" },
		agents: { kind: "omit" },
		prompts: { kind: "omit" },
		packages: [],
	});

	assert.deepEqual(loadProfile(root, "all").playbooks, { kind: "all" });
	assert.deepEqual(loadProfile(root, "listed").playbooks, {
		kind: "list",
		ids: ["investigation", "feature"],
	});
	assert.deepEqual(loadProfile(root, "empty").playbooks, {
		kind: "list",
		ids: [],
	});
});

test("loadProfile: leftover dest keys die", () => {
	const root = tempRoot();
	writeYaml(root, "mode", "mode: draconic\nskills: []\n");
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
	writeYaml(root, "extensions", "extensions:\n  - draconic-todo\n");
	assert.throws(
		() => loadProfile(root, "extensions"),
		/leftover "extensions:". use packages:/,
	);
	writeYaml(root, "templates", "templates: true\nskills: []\n");
	assert.throws(
		() => loadProfile(root, "templates"),
		/leftover "templates:". dest is always \.pi/,
	);
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
  - vendor/@agentic-core/draconic-todo
agents:
  - architect
  - coder
prompts:
  - arena
`,
	);
	writeYaml(root, "all", "agents: all\nprompts: all\n");
	writeYaml(root, "bad-agents", "agents: true\n");
	writeYaml(root, "bare-pkg", "packages:\n  - draconic-todo\n");
	assert.deepEqual(loadProfile(root, "bare").packages, []);
	assert.deepEqual(loadProfile(root, "listed").packages, [
		{ kind: "npm", source: "npm:pi-lens" },
		{ kind: "vendor", name: "draconic-todo" },
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
		/Invalid package source: draconic-todo/,
	);
});

test("listProfiles skips README", () => {
	const root = tempRoot();
	writeYaml(root, "core", "skills: []\n");
	writeYaml(root, "web", "skills: []\n");
	writeFileSync(join(root, "profiles", "README.md"), "hi\n");
	assert.deepEqual(listProfiles(root), ["core", "web"]);
});

test("resolvePlaybookIds: all / list / omit / cli / unknown", () => {
	const available = ["investigation", "feature", "bug-fix", "opening-a-pr"];
	const omit = { playbooks: { kind: "omit" } };
	const all = { playbooks: { kind: "all" } };
	const list = {
		playbooks: { kind: "list", ids: ["investigation", "feature"] },
	};
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
		() =>
			resolvePlaybookIds(
				{ playbooks: { kind: "list", ids: ["missing"] } },
				none,
				available,
			),
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

	assert.deepEqual(readdirSync(pbDir).sort(), ["bug-fix.md", "feature.md"]);
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

test("repo life-engine profile loads", () => {
	const p = loadProfile(REPO, "life-engine");
	assert.deepEqual(p.playbooks, { kind: "all" });
	const ported = [
		"behaviour-contracts",
		"diagnose",
		"tanstack-query",
		"tanstack-ui",
		"thermo-review",
		"to-issues",
		"triage",
		"typography",
		"vault-pack",
		"webapp-testing",
		"create-skill",
	];
	for (const name of ported) assert.ok(p.skills.includes(name), name);
	const missing = p.skills.filter((name) => !skillHasMarkdown(REPO, name));
	assert.deepEqual(missing, []);
});

test("repo agentic-core profile loads", () => {
	const p = loadProfile(REPO, "agentic-core");
	assert.deepEqual(p.playbooks, { kind: "all" });
	const needed = [
		"create-skill",
		"diagnose",
		"thermo-review",
		"research",
		"codebase-design",
	];
	for (const name of needed) assert.ok(p.skills.includes(name), name);
	const banned = [
		"godot-mono",
		"vault-pack",
		"playwright-cli",
		"supabase",
		"frontend-design",
		"tanstack-ui",
	];
	for (const name of banned) assert.equal(p.skills.includes(name), false, name);
	const missing = p.skills.filter((name) => !skillHasMarkdown(REPO, name));
	assert.deepEqual(missing, []);
});

test("repo profiles list npm and vendor packages", () => {
	const expected = [
		{ kind: "npm", source: "npm:pi-lens" },
		{ kind: "npm", source: "npm:pi-web-access" },
		{ kind: "npm", source: "npm:pi-subagents" },
		{ kind: "npm", source: "npm:@ff-labs/pi-fff" },
		{ kind: "vendor", name: "draconic-todo" },
		{ kind: "vendor", name: "draconic-coms" },
		{ kind: "vendor", name: "draconic-boot" },
		{ kind: "vendor", name: "draconic-teams" },
	];
	for (const name of ["agentic-core", "life-engine"]) {
		const p = loadProfile(REPO, name);
		assert.deepEqual(p.packages, expected);
		assert.deepEqual(p.agents, { kind: "all" });
		assert.deepEqual(p.prompts, { kind: "all" });
	}
});

test("always-on text does not dump dest draconic-mode", () => {
	const append = readFileSync(
		join(REPO, "ai", "pi", "APPEND_SYSTEM.md"),
		"utf8",
	);
	const agent = readFileSync(
		join(REPO, "ai", "agents", "draconic", "draconic.md"),
		"utf8",
	);
	for (const text of [append, agent]) {
		assert.doesNotMatch(
			text,
			/Read `\.pi\/skills\/draconic-mode\/SKILL\.md` in full/,
		);
		assert.doesNotMatch(text, /running draconic-mode on Pi/);
	}
});

test("repo agentic-core profile resolves every skill from skills/", () => {
	const p = loadProfile(REPO, "agentic-core");
	const needed = [...p.skills];
	for (const name of needed) {
		assert.ok(findSkillDir(REPO, name), name);
		assert.doesNotMatch(findSkillDir(REPO, name), /\/pi\/skills\//);
	}
	assert.equal(existsSync(join(REPO, "ai", "pi", "skills")), false);
	assert.equal(existsSync(join(REPO, "ai", "pi", "install.mjs")), false);
	assert.equal(existsSync(join(REPO, "ai", "pi", "packages.json")), true);
	assert.equal(existsSync(join(REPO, "ai", "pi", "APPEND_SYSTEM.md")), true);
	assert.equal(existsSync(join(REPO, "ai", "pi", "draconic-models.md")), true);
	assert.deepEqual(readPiPackages(join(REPO, "ai", "pi")), [
		"npm:pi-lens",
		"npm:pi-web-access",
		"npm:pi-subagents",
	]);
});

test("installPiRuntime writes boot and models and leaves prompts alone", () => {
	const root = tempRoot();
	mkdirSync(join(root, "ai", "pi", "extensions"), { recursive: true });
	mkdirSync(join(root, "ai", "pi", "prompts"), { recursive: true });
	writeFileSync(
		join(root, "ai", "pi", "extensions", "boot.ts"),
		"export default function () {}\n",
	);
	writeFileSync(join(root, "ai", "pi", "APPEND_SYSTEM.md"), "boot\n");
	writeFileSync(join(root, "ai", "pi", "draconic-models.md"), "models\n");
	writeFileSync(join(root, "ai", "pi", "prompts", "how.md"), "how\n");

	const dest = mkdtempSync(join(tmpdir(), "pi-rt-"));
	installPiRuntime(root, dest, { skills: ["how"], playbooks: ["orchestrate"] });
	assert.equal(
		readFileSync(join(dest, ".pi", "APPEND_SYSTEM.md"), "utf8"),
		"boot\n",
	);
	assert.equal(
		readFileSync(join(dest, ".pi", "draconic-models.md"), "utf8"),
		"models\n",
	);
	assert.equal(existsSync(join(dest, ".pi", "prompts", "how.md")), false);

	writeFileSync(join(dest, ".pi", "APPEND_SYSTEM.md"), "custom\n");
	writeFileSync(join(dest, ".pi", "draconic-models.md"), "picked\n");
	mkdirSync(join(dest, ".pi", "prompts"), { recursive: true });
	writeFileSync(join(dest, ".pi", "prompts", "leftover.md"), "stale\n");
	installPiRuntime(root, dest, { skills: ["how"], playbooks: ["orchestrate"] });
	assert.equal(
		readFileSync(join(dest, ".pi", "APPEND_SYSTEM.md"), "utf8"),
		"custom\n",
	);
	assert.equal(
		readFileSync(join(dest, ".pi", "draconic-models.md"), "utf8"),
		"picked\n",
	);
	assert.equal(existsSync(join(dest, ".pi", "prompts", "leftover.md")), true);
});

test("installPiRuntime does not merge pack packages into settings.json", () => {
	const root = tempRoot();
	mkdirSync(join(root, "ai", "pi", "extensions"), { recursive: true });
	writeFileSync(
		join(root, "ai", "pi", "extensions", "boot.ts"),
		"export default function () {}\n",
	);
	writeFileSync(join(root, "ai", "pi", "APPEND_SYSTEM.md"), "boot\n");
	writeFileSync(join(root, "ai", "pi", "draconic-models.md"), "models\n");
	writeFileSync(
		join(root, "ai", "pi", "packages.json"),
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

test("installPiRuntime rewrites a dest APPEND_SYSTEM that still matches the old persona", () => {
	const root = tempRoot();
	mkdirSync(join(root, "ai", "pi", "extensions"), { recursive: true });
	mkdirSync(join(root, "ai", "pi", "prompts"), { recursive: true });
	writeFileSync(
		join(root, "ai", "pi", "extensions", "boot.ts"),
		"export default function () {}\n",
	);
	writeFileSync(join(root, "ai", "pi", "APPEND_SYSTEM.md"), "new stub\n");
	writeFileSync(join(root, "ai", "pi", "draconic-models.md"), "models\n");

	const dest = mkdtempSync(join(tmpdir(), "pi-rt-append-mig-"));
	mkdirSync(join(dest, ".pi"), { recursive: true });
	writeFileSync(
		join(dest, ".pi", "APPEND_SYSTEM.md"),
		readFileSync(
			join(REPO, "scripts", "fixtures", "legacy-append-system.md"),
			"utf8",
		),
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
	mkdirSync(join(root, "ai", "pi", "extensions"), { recursive: true });
	mkdirSync(join(root, "ai", "pi", "prompts"), { recursive: true });
	writeFileSync(
		join(root, "ai", "pi", "extensions", "boot.ts"),
		"export default function () {}\n",
	);
	writeFileSync(join(root, "ai", "pi", "APPEND_SYSTEM.md"), "new stub\n");
	writeFileSync(join(root, "ai", "pi", "draconic-models.md"), "models\n");

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

test("installAgents writes selected files and prunes dest leftovers", () => {
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
	]);
	assert.equal(
		readFileSync(join(dest, ".pi", "prompts", "arena.md"), "utf8"),
		"arena body\n",
	);
});

test("installPiRuntime removes leftover dest roles", () => {
	const root = tempRoot();
	mkdirSync(join(root, "ai", "pi"), { recursive: true });
	writeFileSync(join(root, "ai", "pi", "APPEND_SYSTEM.md"), "boot\n");
	writeFileSync(join(root, "ai", "pi", "draconic-models.md"), "models\n");

	const dest = mkdtempSync(join(tmpdir(), "pi-rt-roles-"));
	mkdirSync(join(dest, ".pi", "roles"), { recursive: true });
	writeFileSync(join(dest, ".pi", "roles", "architect.md"), "old role\n");
	writeFileSync(join(dest, ".pi", "roles", "argv.mjs"), "old helper\n");
	installPiRuntime(root, dest);
	assert.equal(existsSync(join(dest, ".pi", "roles")), false);
});

test("installPiRuntime dies when the pack is incomplete", () => {
	const root = tempRoot();
	mkdirSync(join(root, "ai", "pi", "extensions"), { recursive: true });
	const dest = mkdtempSync(join(tmpdir(), "pi-rt-missing-"));
	assert.throws(
		() => installPiRuntime(root, dest),
		/Pi pack missing: expected ai\/pi\/APPEND_SYSTEM.md/,
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
		existsSync(join(dest, ".pi", "skills", "draconic-mode", "SKILL.md")),
		false,
	);
	assert.equal(existsSync(join(dest, ".pi", "playbooks", "feature.md")), true);
	assert.equal(existsSync(join(dest, ".pi", "roles")), false);
	assert.equal(existsSync(join(dest, ".pi", "agents", "draconic.md")), true);
	assert.equal(existsSync(join(dest, ".pi", "agents", "architect.md")), true);
	assert.equal(existsSync(join(dest, ".pi", "prompts", "arena.md")), true);
	assert.doesNotMatch(
		readFileSync(join(dest, ".pi", "agents", "draconic.md"), "utf8"),
		/Skill|Task/,
	);
	const vendorRoot = join(dest, ".pi", "vendor", "@agentic-core");
	assert.equal(
		existsSync(join(vendorRoot, "draconic-todo", "src", "index.ts")),
		true,
	);
	assert.equal(
		existsSync(join(vendorRoot, "draconic-coms", "src", "index.ts")),
		true,
	);
	assert.equal(
		existsSync(join(vendorRoot, "draconic-boot", "src", "index.ts")),
		true,
	);
	assert.equal(
		existsSync(join(vendorRoot, "draconic-teams", "src", "index.ts")),
		true,
	);
	assert.equal(existsSync(join(vendorRoot, "lib")), false);
	const append = readFileSync(join(dest, ".pi", "APPEND_SYSTEM.md"), "utf8");
	assert.doesNotMatch(append, /running draconic-mode on Pi/);
	assert.doesNotMatch(
		append,
		/Read `\.pi\/skills\/draconic-mode\/SKILL\.md` in full/,
	);
	assert.match(
		readFileSync(join(dest, ".pi", "draconic-models.md"), "utf8"),
		/feature, refactoring:/,
	);
	assert.deepEqual(
		JSON.parse(readFileSync(join(dest, ".pi", "settings.json"), "utf8")),
		{
			packages: [
				"npm:pi-lens",
				"npm:pi-web-access",
				"npm:pi-subagents",
				"npm:@ff-labs/pi-fff",
				"vendor/@agentic-core/draconic-todo",
				"vendor/@agentic-core/draconic-coms",
				"vendor/@agentic-core/draconic-boot",
				"vendor/@agentic-core/draconic-teams",
			],
		},
	);
	assert.match(
		r.stdout,
		/Pi installs project packages from \.pi\/settings\.json/,
	);
	assert.equal(existsSync(join(dest, "AGENTS.md")), false);
	assert.equal(existsSync(join(dest, ".opencode")), false);
	assert.equal(existsSync(join(dest, ".claude")), false);
	assert.equal(existsSync(join(dest, ".agents")), false);
	assert.equal(existsSync(join(dest, ".draconic")), false);
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
		existsSync(join(dest, ".pi", "skills", "draconic-mode", "SKILL.md")),
		false,
	);
	assert.equal(existsSync(join(dest, ".pi", "playbooks", "feature.md")), true);
	assert.equal(
		existsSync(join(dest, ".pi", "skills", "create-skill", "SKILL.md")),
		true,
	);
	assert.equal(
		existsSync(join(dest, ".pi", "skills", "diagnose", "SKILL.md")),
		true,
	);
	assert.equal(
		existsSync(join(dest, ".pi", "skills", "godot-mono", "SKILL.md")),
		false,
	);
	assert.equal(
		existsSync(join(dest, ".pi", "skills", "vault-pack", "SKILL.md")),
		false,
	);
	assert.equal(
		existsSync(join(dest, ".pi", "skills", "playwright-cli", "SKILL.md")),
		false,
	);
	assert.equal(
		existsSync(join(dest, ".pi", "skills", "supabase", "SKILL.md")),
		false,
	);
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
		existsSync(join(dest, ".pi", "skills", "draconic-mode", "SKILL.md")),
		false,
	);
	assert.equal(existsSync(join(dest, ".pi", "playbooks", "feature.md")), true);
	assert.equal(
		existsSync(join(dest, ".pi", "skills", "vault-pack", "SKILL.md")),
		true,
	);
	const vendorRoot = join(dest, ".pi", "vendor", "@agentic-core");
	assert.equal(
		existsSync(join(vendorRoot, "draconic-todo", "src", "index.ts")),
		true,
	);
	assert.equal(existsSync(join(vendorRoot, "lib")), false);
	assert.equal(existsSync(join(dest, ".opencode")), false);
	assert.equal(existsSync(join(dest, ".claude")), false);
	assert.equal(existsSync(join(dest, ".agents")), false);
});

test("install --profile agentic-core --without how omits the how skill", () => {
	const dest = mkdtempSync(join(tmpdir(), "install-pi-without-"));
	const r = spawnSync(
		process.execPath,
		[INSTALLER, "install", dest, "--profile", "agentic-core", "--without", "how"],
		{ encoding: "utf8" },
	);
	assert.equal(r.status, 0, r.stderr || r.stdout);
	assert.equal(
		existsSync(join(dest, ".pi", "skills", "how", "SKILL.md")),
		false,
	);
	assert.equal(existsSync(join(dest, ".pi", "prompts", "how.md")), false);
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
		existsSync(join(dest, ".pi", "skills", "create-skill", "SKILL.md")),
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

test("pstack source tree is gone and draconic install resolves", () => {
	const r = spawnSync(
		process.execPath,
		[join(REPO, "scripts", "check-no-pstack.mjs")],
		{
			encoding: "utf8",
		},
	);
	assert.equal(r.status, 0, r.stderr || r.stdout);
});

test("ported life-engine skills keep the management/docs split", () => {
	const r = spawnSync(
		process.execPath,
		[join(REPO, "scripts", "check-ported-skills.mjs")],
		{
			encoding: "utf8",
		},
	);
	assert.equal(r.status, 0, r.stderr || r.stdout);
});

function skillHasMarkdown(root, name) {
	return walkSkillMarkdown(join(root, "ai", "skills"), name);
}

function walkSkillMarkdown(dir, name) {
	if (!existsSync(dir)) return false;
	if (existsSync(join(dir, name, "SKILL.md"))) return true;
	for (const ent of readdirSync(dir, { withFileTypes: true })) {
		if (!ent.isDirectory() || ent.name.startsWith(".")) continue;
		const full = join(dir, ent.name);
		if (existsSync(join(full, "SKILL.md"))) continue;
		if (walkSkillMarkdown(full, name)) return true;
	}
	return false;
}

function tempRoot() {
	const root = mkdtempSync(join(tmpdir(), "profile-"));
	mkdirSync(join(root, "profiles"));
	return root;
}

function writeYaml(root, name, body) {
	writeFileSync(join(root, "profiles", `${name}.yaml`), body);
}

function snapshotInstall(dest) {
	const pbDir = join(dest, ".pi", "playbooks");
	const out = { playbooks: {} };
	for (const name of readdirSync(pbDir).sort()) {
		out.playbooks[name] = readFileSync(join(pbDir, name), "utf8");
	}
	return out;
}
