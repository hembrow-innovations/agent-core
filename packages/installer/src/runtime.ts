import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { openDestination, type Destination } from "./dest.ts";
import { packRoot } from "./pack.ts";

const STUB_APPEND_SYSTEM =
  "# Pi runtime\n\nThis file is the required pack stub. Identity is a dest `.pi/agents/` file. Boot appends it only after /agent or --agent.\n";

export function installPiRuntime(
  srcRoot: string,
  target: string,
  _opts: { skills?: string[]; playbooks?: string[] } = {},
): void {
  writeRuntime(srcRoot, openDestination(target));
}

export function writeRuntime(srcRoot: string, dest: Destination): void {
  const pack = join(packRoot(srcRoot), "pi");
  const required = ["APPEND_SYSTEM.md", "heio-models.md"];
  for (const name of required) {
    if (!existsSync(join(pack, name))) {
      throw new Error(`Pi pack missing: expected ai/pi/${name}`);
    }
  }

  const previousModels = ".pi/draconic-models.md";
  const models = ".pi/heio-models.md";
  if (dest.exists(previousModels) && !dest.exists(models)) {
    dest.writeText(models, dest.readText(previousModels));
  }
  dest.removeLeftovers();

  writeAppendSystem(
    dest,
    ".pi/APPEND_SYSTEM.md",
    readFileSync(join(pack, "APPEND_SYSTEM.md"), "utf8"),
    srcRoot,
  );
  dest.writeText(models, readFileSync(join(pack, "heio-models.md"), "utf8"), {
    ifMissing: true,
  });
  dest.ensureGitignore();
}

export function readPiPackages(pack: string): string[] {
  const file = join(pack, "packages.json");
  if (!existsSync(file)) return [];
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(file, "utf8"));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Pi pack packages.json is not JSON: ${message}`);
  }
  if (
    !Array.isArray(raw) ||
    raw.some((item) => typeof item !== "string" || item.trim() === "")
  ) {
    throw new Error(
      "Pi pack packages.json must be a JSON array of package sources",
    );
  }
  return raw.map((item) => item.trim());
}

function writeAppendSystem(
  dest: Destination,
  rel: string,
  body: string,
  srcRoot: string,
): void {
  if (!dest.exists(rel)) {
    dest.writeText(rel, body);
    return;
  }
  const current = dest.readText(rel);
  if (current === body || !isLegacyAppendSystem(current, srcRoot)) return;
  dest.writeText(rel, body);
}

function isLegacyAppendSystem(text: string, srcRoot: string): boolean {
  const fixture = join(
    srcRoot,
    "scripts",
    "fixtures",
    "legacy-append-system.md",
  );
  const legacy = existsSync(fixture) ? readFileSync(fixture, "utf8") : "";
  return (
    (legacy !== "" && text === legacy) ||
    text === STUB_APPEND_SYSTEM ||
    text.startsWith("# Draconic\n") ||
    /You are running draconic-mode on Pi/.test(text) ||
    /Read `\.pi\/skills\/draconic-mode\/SKILL\.md` in full/.test(text)
  );
}
