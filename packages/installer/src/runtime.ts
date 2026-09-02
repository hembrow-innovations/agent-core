import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { openDestination, type Destination } from "./dest.ts";
import { packRoot } from "./pack.ts";

const STUB_APPEND_SYSTEM =
  "# Pi runtime\n\nThis file is the required pack stub. Identity is a dest `.pi/agents/` file. Boot appends it only after /agent or --agent.\n";

export function listSystemPromptStems(srcRoot: string): string[] {
  const dir = join(packRoot(srcRoot), "pi");
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((ent) => ent.isFile() && ent.name.endsWith(".md"))
    .map((ent) => ent.name.slice(0, -3))
    .sort();
}

export type RuntimeOpts = {
  systemPrompt?: string;
};

export function installPiRuntime(
  srcRoot: string,
  target: string,
  opts: { skills?: string[]; playbooks?: string[]; systemPrompt?: string } = {},
): void {
  writeRuntime(srcRoot, openDestination(target), {
    systemPrompt: opts.systemPrompt,
  });
}

export function writeRuntime(
  srcRoot: string,
  dest: Destination,
  opts: RuntimeOpts = {},
): void {
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

  const stem = opts.systemPrompt ?? "APPEND_SYSTEM";
  writeAppendSystem(
    dest,
    ".pi/APPEND_SYSTEM.md",
    readFileSync(join(pack, `${stem}.md`), "utf8"),
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

function writeAppendSystem(dest: Destination, rel: string, body: string): void {
  if (!dest.exists(rel)) {
    dest.writeText(rel, body);
    return;
  }
  const current = dest.readText(rel);
  if (current === body || !isLegacyAppendSystem(current)) return;
  dest.writeText(rel, body);
}

function isLegacyAppendSystem(text: string): boolean {
  return (
    text === STUB_APPEND_SYSTEM ||
    text.startsWith("# Draconic\n") ||
    /You are running draconic-mode on Pi/.test(text) ||
    /Read `\.pi\/skills\/draconic-mode\/SKILL\.md` in full/.test(text)
  );
}
