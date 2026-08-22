import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000;

function run(
  command: string,
  args: string[],
  opts: { cwd: string; signal?: AbortSignal; timeoutMs: number },
): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: opts.cwd,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
    }, opts.timeoutMs);
    const onAbort = () => child.kill("SIGTERM");
    opts.signal?.addEventListener("abort", onAbort);
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });
    child.on("error", (err) => {
      clearTimeout(timer);
      opts.signal?.removeEventListener("abort", onAbort);
      reject(err);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      opts.signal?.removeEventListener("abort", onAbort);
      resolve({ stdout, stderr, code: code ?? 1 });
    });
  });
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "child";
}

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "draconic_spawn",
    label: "Draconic spawn",
    description:
      "Run a child Pi agent on a scoped unit of work. Use for arena arms, swarm workers, interrogate reviewers, how explorers, or delegated implementation. Returns the child's final text.",
    parameters: Type.Object({
      prompt: Type.String({
        description:
          "Full standalone instructions. Include file paths, success criteria, and the prove-it-works bar.",
      }),
      model: Type.Optional(
        Type.String({
          description: "Optional provider/model id. Omit for inherit-parent.",
        }),
      ),
      readonly: Type.Optional(
        Type.Boolean({
          description: "If true, child only gets read, grep, find, and ls.",
        }),
      ),
      worktree: Type.Optional(
        Type.Boolean({
          description: "If true, run in a new git worktree under .draconic/worktrees.",
        }),
      ),
      name: Type.Optional(Type.String({ description: "Short label for this child." })),
    }),
    async execute(_toolCallId, params, signal, _onUpdate, ctx) {
      const cwd = ctx.cwd;
      const label = slug(params.name || `spawn-${Date.now()}`);
      let childCwd = cwd;

      if (params.worktree) {
        const root = join(cwd, ".draconic", "worktrees");
        mkdirSync(root, { recursive: true });
        const dest = join(root, label);
        if (!existsSync(dest)) {
          const branch = `draconic/${label}`;
          const added = await run("git", ["worktree", "add", "-b", branch, dest], {
            cwd,
            signal,
            timeoutMs: 30_000,
          });
          if (added.code !== 0) {
            const retry = await run("git", ["worktree", "add", dest], {
              cwd,
              signal,
              timeoutMs: 30_000,
            });
            if (retry.code !== 0) {
              return {
                content: [
                  {
                    type: "text" as const,
                    text: `Failed to create worktree at ${dest}.\n${added.stderr}\n${retry.stderr}`,
                  },
                ],
                details: { ok: false },
              };
            }
          }
        }
        childCwd = dest;
      }

      const sessionDir = join(cwd, ".draconic", "sessions");
      mkdirSync(sessionDir, { recursive: true });

      const args = [
        "-p",
        "--approve",
        "--no-extensions",
        "--session-dir",
        sessionDir,
        "--name",
        label,
      ];
      if (params.model && params.model !== "inherit-parent" && params.model !== "auto") {
        args.push("--model", params.model);
      }
      if (params.readonly) {
        args.push("--tools", "read,grep,find,ls");
      }
      args.push("--", params.prompt);

      try {
        const result = await run("pi", args, {
          cwd: childCwd,
          signal,
          timeoutMs: DEFAULT_TIMEOUT_MS,
        });
        const text = [result.stdout.trim(), result.stderr.trim()].filter(Boolean).join("\n\n");
        return {
          content: [
            {
              type: "text" as const,
              text: text || `(child exited ${result.code} with no output)`,
            },
          ],
          details: {
            ok: result.code === 0,
            code: result.code,
            cwd: childCwd,
            name: label,
          },
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: "text" as const, text: `spawn failed: ${message}` }],
          details: { ok: false },
        };
      }
    },
  });

  pi.registerTool({
    name: "draconic_todo",
    label: "Draconic todo",
    description:
      "Write the draconic checklist to .draconic/TODO.md. First item on a multi-step task must be reading draconic-mode principles. Keep skipped items as `- [ ] skip: reason`.",
    parameters: Type.Object({
      markdown: Type.String({ description: "Full TODO.md contents." }),
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      const dir = join(ctx.cwd, ".draconic");
      mkdirSync(dir, { recursive: true });
      const path = join(dir, "TODO.md");
      writeFileSync(path, params.markdown.endsWith("\n") ? params.markdown : `${params.markdown}\n`, "utf8");
      return {
        content: [{ type: "text" as const, text: `Wrote ${path}` }],
        details: { path },
      };
    },
  });
}
