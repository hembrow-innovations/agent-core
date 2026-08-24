import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  RoleFileError,
  formatPeerCommand,
  parsePurpose,
  parseRoleFile,
  parseRoleStem,
  peerArgv,
  peerCommands,
} from "../../ai/pi/roles/argv.mjs";

const REPO = fileURLToPath(new URL("../..", import.meta.url));
const PACK_ROLES = join(REPO, "ai", "pi", "roles");

test("matching flags from one file", () => {
  const role = parseRoleFile(join(PACK_ROLES, "researcher.md"));
  const { argv } = peerArgv(role, { project: "default", extraPiArgs: [] });
  assert.deepEqual(argv.slice(0, 5), [
    "pi",
    "--cname",
    "researcher",
    "--purpose",
    "Finds evidence",
  ]);
  assert.equal(argv.includes("--agent"), false);
  assert.equal(argv[5], "--project");
  assert.equal(argv[6], "default");
  assert.equal(role.stem, "researcher");
  assert.equal(role.promptPath, join(PACK_ROLES, "researcher.md"));
});

test("never emits --name, --system-prompt, or --append-system-prompt", () => {
  const [cmd] = peerCommands({
    inputs: ["researcher"],
    rolesDir: PACK_ROLES,
    project: "default",
    extraPiArgs: ["--model", "grok-4.6"],
  });
  assert.equal(cmd.argv.includes("--name"), false);
  assert.equal(cmd.argv.includes("--system-prompt"), false);
  assert.equal(cmd.argv.includes("--append-system-prompt"), false);
  assert.deepEqual(cmd.argv.slice(-2), ["--model", "grok-4.6"]);
});

test("unknown frontmatter key including cname fails", () => {
  const dir = mkdtempSync(join(tmpdir(), "role-unknown-"));
  const path = join(dir, "researcher.md");
  writeFileSync(
    path,
    "---\npurpose: Finds evidence\ncname: researcher\n---\n\nbody\n",
  );
  assert.throws(
    () => parseRoleFile(path),
    (err) =>
      err instanceof RoleFileError &&
      err.code === "unknown_keys" &&
      Array.isArray(err.keys) &&
      err.keys.includes("cname"),
  );
});

test("bad stem fails", () => {
  assert.throws(
    () => parseRoleStem("Researcher"),
    (err) => err instanceof RoleFileError && err.code === "bad_stem",
  );
  assert.throws(
    () => parseRoleStem("../secret"),
    (err) => err instanceof RoleFileError && err.code === "bad_stem",
  );
  assert.throws(
    () => parseRoleStem("has_underscore"),
    (err) => err instanceof RoleFileError && err.code === "bad_stem",
  );
  const dir = mkdtempSync(join(tmpdir(), "role-stem-"));
  const path = join(dir, "Bad.md");
  writeFileSync(path, "---\npurpose: X\n---\n\nbody\n");
  assert.throws(
    () => parseRoleFile(path),
    (err) => err instanceof RoleFileError && err.code === "bad_stem",
  );
});

test("empty purpose fails", () => {
  assert.throws(
    () => parsePurpose(""),
    (err) => err instanceof RoleFileError && err.code === "empty_purpose",
  );
  assert.throws(
    () => parsePurpose('""'),
    (err) => err instanceof RoleFileError && err.code === "empty_purpose",
  );
  const dir = mkdtempSync(join(tmpdir(), "role-purpose-"));
  const path = join(dir, "researcher.md");
  writeFileSync(path, "---\npurpose:\n---\n\nbody\n");
  assert.throws(
    () => parseRoleFile(path),
    (err) => err instanceof RoleFileError && err.code === "empty_purpose",
  );
});

test("extra-args footgun reject", () => {
  const request = {
    inputs: ["researcher"],
    rolesDir: PACK_ROLES,
    project: "default",
  };
  assert.throws(
    () =>
      peerCommands({
        ...request,
        extraPiArgs: ["--system-prompt", "/tmp/other.md"],
      }),
    (err) => err instanceof RoleFileError && err.code === "forbidden_extra_arg",
  );
  assert.throws(
    () =>
      peerCommands({
        ...request,
        extraPiArgs: ["--append-system-prompt", "extra"],
      }),
    (err) => err instanceof RoleFileError && err.code === "forbidden_extra_arg",
  );
  assert.throws(
    () =>
      peerCommands({
        ...request,
        extraPiArgs: ["--system-prompt=/tmp/other.md"],
      }),
    (err) => err instanceof RoleFileError && err.code === "forbidden_extra_arg",
  );
});

test("format is pasteable", () => {
  const [cmd] = peerCommands({
    inputs: ["researcher"],
    rolesDir: PACK_ROLES,
    project: "default",
    extraPiArgs: [],
  });
  const line = formatPeerCommand(cmd);
  assert.equal(line.includes("\n"), false);
  assert.match(line, /--cname researcher/);
  assert.match(line, /--purpose 'Finds evidence'/);
  assert.doesNotMatch(line, /--agent/);
  assert.doesNotMatch(line, /--name/);
  assert.doesNotMatch(line, /--system-prompt/);
  assert.doesNotMatch(line, /--append-system-prompt/);

  const dir = mkdtempSync(join(tmpdir(), "role-quote-"));
  mkdirSync(dir, { recursive: true });
  const path = join(dir, "reviewer.md");
  writeFileSync(path, "---\npurpose: It's quoted\n---\n\nbody\n");
  const quoted = formatPeerCommand(
    peerArgv(parseRoleFile(path), { project: "default", extraPiArgs: [] }),
  );
  assert.match(quoted, /--purpose 'It'\\''s quoted'/);
});

test("matching dest agent file is passed as --agent", () => {
  const dest = mkdtempSync(join(tmpdir(), "role-agent-"));
  mkdirSync(join(dest, "agents"), { recursive: true });
  mkdirSync(join(dest, "roles"), { recursive: true });
  writeFileSync(
    join(dest, "roles", "researcher.md"),
    "---\npurpose: Finds evidence\n---\n\nbody\n",
  );
  writeFileSync(
    join(dest, "agents", "researcher.md"),
    "---\nname: researcher\n---\n\nFind evidence.\n",
  );
  const role = parseRoleFile(join(dest, "roles", "researcher.md"));
  const { argv } = peerArgv(role, { project: "default", extraPiArgs: [] });
  assert.equal(argv[argv.indexOf("--agent") + 1], "researcher");
});

test("cli prints after copy through a temp dest", () => {
  const dest = mkdtempSync(join(tmpdir(), "role-cli-"));
  cpSync(join(PACK_ROLES, "argv.mjs"), join(dest, "argv.mjs"));
  cpSync(join(PACK_ROLES, "researcher.md"), join(dest, "researcher.md"));
  const r = spawnSync(
    process.execPath,
    [join(dest, "argv.mjs"), "researcher"],
    {
      encoding: "utf8",
    },
  );
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /--cname researcher/);
  assert.equal(r.stdout.includes("--agent"), false);
  assert.equal(r.stdout.includes("--system-prompt"), false);
  assert.equal(r.stdout.includes("--append-system-prompt"), false);
});
