---
id: "architecture-draconic-todo"
title: "Todo checklist store"
kind: architecture
description: "Session checklists live in the todo package. write and edit of those paths are blocked."
domain: pack
area: architecture
tags: [architecture, todo]
created_at: "2026-08-26"
updated_at: "2026-08-26"
---

# Todo checklist store

## Overview

`@agentic-core/draconic-todo` owns session checklist files. The live list is `.draconic/sessions/<sessionId>/TODO.md`. The tool `draconic_todo` writes and lists those files. Builtin `write` and `edit` cannot touch them.

There is no `packages/lib`. Dest receives a vendor copy of this package as it is. See [[0008-todo-owns-checklist-store]] and [[architecture-pack-and-packages]].

## Context

A shared lib package used to hold the store so the installer could copy helpers into each vendor tree. Todo was the only consumer. Dest still needed a self-contained copy with no path back to this checkout.

The store moved into `packages/draconic-todo`. Agents must not treat `.draconic/TODO.md` as a playbook checklist. That file is a stub that points at the session files.

## Design

### Paths

`parseSessionId` brands a session id. It accepts `[A-Za-z0-9._-]+`. It rejects `.`, `..`, slashes, spaces, and empty strings.

```ts
// packages/draconic-todo/src/store.ts parseSessionId
export function parseSessionId(raw: string): SessionId {
  if (raw === "." || raw === ".." || !SESSION_ID_PATTERN.test(raw)) {
    throw new Error(`invalid session id: ${raw}`);
  }
  return raw as SessionId;
}
```

- **stubTodoPath**: `.draconic/TODO.md`
- **sessionTodoPath**: `.draconic/sessions/<sessionId>/TODO.md`

### Write

`writeSessionChecklist` creates the session directory, writes the markdown with a trailing newline, and always rewrites the stub to `STUB_TODO_MARKDOWN`. A second session keeps its own file. Only the writer session is replaced.

```ts
// packages/draconic-todo/src/store.ts writeSessionChecklist
writeFileSync(sessionPath, withTrailingNewline(input.markdown), "utf8");
writeFileSync(stubPath, STUB_TODO_MARKDOWN, "utf8");
```

The factory queues that write with `withFileMutationQueue` on the session path.

`action: "write"` requires `markdown`. A missing body returns `markdown is required for action write`. An invalid Pi session id returns `invalid session id: ...`.

### List

`listSessionChecklists` walks `.draconic/sessions/`. It skips names that fail `parseSessionId` and skips entries that are not a `TODO.md` file. Title is the first non-empty line. Results sort by session id.

Empty cwd text is `No session checklists.`

### Write block

`isProtectedTodoPath` is true for the stub and for `.draconic/sessions/<id>/TODO.md`. A leading `@` is stripped. Other `.draconic/` files are not protected.

On `tool_call`, the factory returns a block only for builtin `write` and `edit` against those paths. `read` is left alone.

```ts
// packages/draconic-todo/src/index.ts tool_call
if (event.toolName !== "write" && event.toolName !== "edit") return;
const path = toolPath(event.input);
if (!path) return;
if (!isProtectedTodoPath(ctx.cwd, path)) return;
return {
  block: true,
  reason: "Use draconic_todo. That path is a session checklist.",
};
```

## Trade-offs

The package is both the store and the Pi extension. Dest vendor `src/` matches the source package. Tests sit next to the store.

It refuses a sibling lib and refuses using builtin `write` for the live checklist. Shared work units stay under `.draconic/inbox` and `.draconic/planning`. Those paths are not this store.

## Consequences

Install copies this package through the vendor path in [[spec-installer]]. Agents call `draconic_todo`. They do not edit `.draconic/TODO.md` or `.draconic/sessions/*/TODO.md` with `write` or `edit`.

Terms live in [[glossary]].
