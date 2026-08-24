import { existsSync, readFileSync, realpathSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const STEM_RE = /^[a-z][a-z0-9-]{0,63}$/;
const FORBIDDEN_EXTRA = /^(?:--system-prompt|--append-system-prompt)(?:=|$)/;

/** @typedef {string & { readonly __brand: "RoleStem" }} RoleStem */
/** @typedef {string & { readonly __brand: "Purpose" }} Purpose */

/** @typedef {{
 *   readonly stem: RoleStem,
 *   readonly purpose: Purpose,
 *   readonly promptPath: string,
 * }} LivingRole */

/** @typedef {{
 *   readonly inputs: readonly string[],
 *   readonly rolesDir: string,
 *   readonly project: string,
 *   readonly extraPiArgs: readonly string[],
 * }} PeerRequest */

/** @typedef {{ readonly argv: readonly string[] }} PeerCommand */

/** @typedef {"empty_inputs" | "not_found" | "not_markdown" | "bad_stem" | "bad_frontmatter" | "missing_purpose" | "empty_purpose" | "unknown_keys" | "empty_prompt" | "empty_project" | "forbidden_extra_arg" | "forbidden_helper_flag"} RoleErrorCode */

export class RoleFileError extends Error {
  /**
   * @param {{ code: RoleErrorCode, message: string, path?: string, keys?: readonly string[] }} args
   */
  constructor(args) {
    super(args.message);
    this.name = "RoleFileError";
    this.code = args.code;
    this.path = args.path;
    this.keys = args.keys;
  }
}

/**
 * @param {string} raw
 * @returns {RoleStem}
 */
export function parseRoleStem(raw) {
  if (!STEM_RE.test(raw)) {
    throw new RoleFileError({
      code: "bad_stem",
      message: `invalid role stem: ${raw}`,
    });
  }
  return /** @type {RoleStem} */ (raw);
}

/**
 * @param {string} raw
 * @returns {Purpose}
 */
export function parsePurpose(raw) {
  const text = stripWrappingQuotes(raw.trim()).trim();
  if (!text) {
    throw new RoleFileError({
      code: "empty_purpose",
      message: "purpose is empty",
    });
  }
  return /** @type {Purpose} */ (text);
}

/**
 * @param {string} path
 * @returns {LivingRole}
 */
export function parseRoleFile(path) {
  const abs = resolve(path);
  if (!abs.endsWith(".md")) {
    throw new RoleFileError({
      code: "not_markdown",
      message: `not a markdown role file: ${abs}`,
      path: abs,
    });
  }
  if (!existsSync(abs)) {
    throw new RoleFileError({
      code: "not_found",
      message: `role file not found: ${abs}`,
      path: abs,
    });
  }
  const { purpose } = parseRoleText(readFileSync(abs, "utf8"), abs);
  return {
    stem: parseRoleStem(basename(abs, ".md")),
    purpose,
    promptPath: abs,
  };
}

/**
 * @param {string} input
 * @param {string} rolesDir
 * @returns {LivingRole}
 */
export function resolveRole(input, rolesDir) {
  const path = STEM_RE.test(input)
    ? join(rolesDir, `${input}.md`)
    : resolve(input);
  if (!existsSync(path)) {
    throw new RoleFileError({
      code: "not_found",
      message: `role file not found: ${path}`,
      path,
    });
  }
  return parseRoleFile(path);
}

/**
 * @param {LivingRole} role
 * @param {Pick<PeerRequest, "project" | "extraPiArgs">} request
 * @returns {PeerCommand}
 */
export function peerArgv(role, request) {
  const extra = request.extraPiArgs ?? [];
  assertSafeExtraArgs(extra);
  return {
    argv: [
      "pi",
      "--cname",
      role.stem,
      "--purpose",
      role.purpose,
      "--agent",
      resolveAgentStem(role),
      "--project",
      request.project,
      ...extra,
    ],
  };
}

/**
 * @param {LivingRole} role
 * @returns {string}
 */
function resolveAgentStem(role) {
  const named = join(
    dirname(role.promptPath),
    "..",
    "agents",
    `${role.stem}.md`,
  );
  if (existsSync(named)) return role.stem;
  return "draconic";
}

/**
 * @param {PeerRequest} request
 * @returns {PeerCommand[]}
 */
export function peerCommands(request) {
  if (request.inputs.length === 0) {
    throw new RoleFileError({
      code: "empty_inputs",
      message: "name at least one role stem or path",
    });
  }
  if (typeof request.project !== "string" || request.project.trim() === "") {
    throw new RoleFileError({
      code: "empty_project",
      message: "project is empty",
    });
  }
  return request.inputs.map((input) =>
    peerArgv(resolveRole(input, request.rolesDir), {
      project: request.project,
      extraPiArgs: request.extraPiArgs,
    }),
  );
}

/**
 * @param {PeerCommand} command
 * @returns {string}
 */
export function formatPeerCommand(command) {
  return command.argv.map(posixQuote).join(" ");
}

/**
 * @param {readonly string[]} argv
 * @param {string} cwd
 * @param {string} selfDir
 * @returns {PeerRequest}
 */
export function parseCli(argv, cwd, selfDir) {
  /** @type {string[]} */
  const inputs = [];
  let project = "default";
  /** @type {string[]} */
  let extraPiArgs = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--") {
      extraPiArgs = argv.slice(i + 1);
      break;
    }
    if (a === "--project") {
      const val = argv[i + 1];
      if (val == null || val.startsWith("-")) {
        throw new RoleFileError({
          code: "empty_project",
          message: "--project needs a name",
        });
      }
      project = val;
      i += 1;
      continue;
    }
    if (
      a === "--cname" ||
      a === "--purpose" ||
      a.startsWith("--cname=") ||
      a.startsWith("--purpose=")
    ) {
      throw new RoleFileError({
        code: "forbidden_helper_flag",
        message:
          "--cname and --purpose belong to pi; the helper emits them from the role file",
      });
    }
    if (a.startsWith("-")) {
      throw new RoleFileError({
        code: "forbidden_helper_flag",
        message: `unknown helper flag: ${a}`,
      });
    }
    inputs.push(STEM_RE.test(a) ? a : resolve(cwd, a));
  }
  return {
    inputs,
    rolesDir: selfDir,
    project,
    extraPiArgs,
  };
}

/**
 * @param {readonly string[]} argv
 * @returns {number}
 */
export function main(argv) {
  try {
    const selfDir = dirname(fileURLToPath(import.meta.url));
    const request = parseCli(argv, process.cwd(), selfDir);
    for (const command of peerCommands(request)) {
      console.log(formatPeerCommand(command));
    }
    return 0;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(message);
    return 1;
  }
}

/**
 * @param {string} text
 * @param {string} path
 */
function parseRoleText(text, path) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  if (lines[0] !== "---") {
    throw new RoleFileError({
      code: "bad_frontmatter",
      message: `missing frontmatter: ${path}`,
      path,
    });
  }
  /** @type {string[]} */
  const fmLines = [];
  let close = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === "---") {
      close = i;
      break;
    }
    fmLines.push(lines[i]);
  }
  if (close === -1) {
    throw new RoleFileError({
      code: "bad_frontmatter",
      message: `missing frontmatter close: ${path}`,
      path,
    });
  }
  /** @type {string[]} */
  const keys = [];
  /** @type {string | null} */
  let purposeRaw = null;
  for (const line of fmLines) {
    if (line.trim() === "") continue;
    const m = line.match(/^([^:]+?)\s*:\s*(.*)$/);
    if (!m) {
      throw new RoleFileError({
        code: "bad_frontmatter",
        message: `invalid frontmatter line in ${path}`,
        path,
      });
    }
    const key = m[1].trim();
    keys.push(key);
    if (key === "purpose") purposeRaw = m[2];
  }
  const unknown = keys.filter((k) => k !== "purpose");
  if (unknown.length) {
    throw new RoleFileError({
      code: "unknown_keys",
      message: `unknown frontmatter keys: ${unknown.join(", ")}`,
      path,
      keys: unknown,
    });
  }
  if (purposeRaw === null) {
    throw new RoleFileError({
      code: "missing_purpose",
      message: `missing purpose: ${path}`,
      path,
    });
  }
  let purpose;
  try {
    purpose = parsePurpose(purposeRaw);
  } catch (err) {
    if (err instanceof RoleFileError && err.code === "empty_purpose") {
      throw new RoleFileError({
        code: "empty_purpose",
        message: `empty purpose: ${path}`,
        path,
      });
    }
    throw err;
  }
  const body = lines
    .slice(close + 1)
    .join("\n")
    .trim();
  if (!body) {
    throw new RoleFileError({
      code: "empty_prompt",
      message: `empty prompt: ${path}`,
      path,
    });
  }
  return { purpose, body };
}

/**
 * @param {readonly string[]} extraPiArgs
 */
function assertSafeExtraArgs(extraPiArgs) {
  for (const arg of extraPiArgs) {
    if (FORBIDDEN_EXTRA.test(arg)) {
      throw new RoleFileError({
        code: "forbidden_extra_arg",
        message:
          "extra args must not contain --system-prompt or --append-system-prompt",
      });
    }
  }
}

/**
 * @param {string} text
 */
function stripWrappingQuotes(text) {
  if (text.length >= 2) {
    const a = text[0];
    const b = text[text.length - 1];
    if ((a === '"' && b === '"') || (a === "'" && b === "'")) {
      return text.slice(1, -1);
    }
  }
  return text;
}

/**
 * @param {string} token
 */
function posixQuote(token) {
  if (token === "") return "''";
  if (/^[A-Za-z0-9_./:@%+=,-]+$/.test(token)) return token;
  return `'${token.replace(/'/g, `'\\''`)}'`;
}

function isMainModule() {
  if (!process.argv[1]) return false;
  try {
    return (
      realpathSync(fileURLToPath(import.meta.url)) ===
      realpathSync(process.argv[1])
    );
  } catch {
    return false;
  }
}

if (isMainModule()) {
  process.exit(main(process.argv.slice(2)));
}
