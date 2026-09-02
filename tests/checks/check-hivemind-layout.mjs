#!/usr/bin/env node
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadProfile } from "../lib/profile.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const errors = [];

const profilesDir = join(root, "profiles");
for (const name of readdirSync(profilesDir)) {
  if (name.startsWith(".") || name === "README.md") continue;
  const full = join(profilesDir, name);
  if (name.endsWith(".yaml") && statSync(full).isFile()) {
    errors.push(`leftover flat profile profiles/${name}`);
    continue;
  }
  if (!statSync(full).isDirectory()) {
    errors.push(`profiles/${name} is not a directory`);
    continue;
  }
  if (!existsSync(join(full, "profile.yaml"))) {
    errors.push(`missing profiles/${name}/profile.yaml`);
  }
}

const hivemindSrc = join(root, "frameworks", "hivemind");
if (!existsSync(join(hivemindSrc, "package.json"))) {
  errors.push("missing frameworks/hivemind/package.json");
}
if (!existsSync(join(hivemindSrc, "src", "cli.ts"))) {
  errors.push("missing frameworks/hivemind/src/cli.ts");
}

const core = loadProfile(root, "agentic-core");
if (!core.frameworks.includes("hivemind")) {
  errors.push("profile agentic-core missing frameworks: hivemind");
}
if (!existsSync(join(root, "profiles", "agentic-core", "hivemind.yaml"))) {
  errors.push("missing profiles/agentic-core/hivemind.yaml");
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

const dest = mkdtempSync(join(tmpdir(), "check-hivemind-layout-"));
try {
  const sentinel = "lanes: {}\n";
  mkdirSync(join(dest, ".hivemind"), { recursive: true });
  writeFileSync(join(dest, ".hivemind", "hivemind.yaml"), sentinel);
  const r = spawnSync(
    process.execPath,
    [
      join(root, "packages", "installer", "src", "cli.ts"),
      "install",
      dest,
      "--profile",
      "agentic-core",
    ],
    { encoding: "utf8" },
  );
  if (r.status !== 0) {
    console.error(r.stdout);
    console.error(r.stderr);
    process.exit(1);
  }
  const copied = join(dest, ".pi", "frameworks", "hivemind");
  if (!existsSync(join(copied, "package.json"))) {
    console.error("install did not write .pi/frameworks/hivemind/package.json");
    process.exit(1);
  }
  if (!existsSync(join(copied, "src", "cli.ts"))) {
    console.error("install did not write .pi/frameworks/hivemind/src/cli.ts");
    process.exit(1);
  }
  if (existsSync(join(copied, "src", "cli.test.ts"))) {
    console.error("install copied hivemind tests into dest");
    process.exit(1);
  }
  const yaml = readFileSync(join(dest, ".hivemind", "hivemind.yaml"), "utf8");
  if (yaml !== sentinel) {
    console.error("install overwrote an existing .hivemind/hivemind.yaml");
    process.exit(1);
  }
  console.log("check-hivemind-layout: ok");
} finally {
  rmSync(dest, { recursive: true, force: true });
}
