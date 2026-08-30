---
id: "architecture-heio-todo"
title: "Todo checklist store"
kind: architecture
description: "Session checklists live in the todo package. write, edit, and bash mutation of those paths are blocked."
domain: pack
area: architecture
tags: [architecture, todo]
created_at: "2026-08-26"
updated_at: "2026-08-30"
---

# Todo checklist store

## Overview

`@agentic-core/heio-todo` owns session checklist files. The live list is `.heio/sessions/<sessionId>/TODO.md`. The tool `heio_todo` writes and lists those files. Builtin `write`, `edit`, and bash mutation of those paths are blocked.

There is no `packages/lib`. Dest receives a vendor copy of this package as it is. See [[0008-todo-owns-checklist-store]] and [[architecture-pack-and-packages]].

## Context

A shared lib package used to hold the store so the installer could copy helpers into each vendor tree. Todo was the only consumer. Dest still needed a self-contained copy with no path back to this checkout.

The store moved into `packages/heio-todo`. Agents must not treat `.heio/TODO.md` as a playbook checklist. That file is a stub that points at the session files.

## Design

### Paths

`parseSessionId` brands a session id. It accepts `[A-Za-z0-9._-]+`. It rejects `.`, `..`, slashes, spaces, and empty strings.

```ts
// packages/heio-todo/src/store.ts parseSessionId
export function parseSessionId(raw: string): SessionId {
  if (raw === "." || raw === ".." || !SESSION_ID_PATTERN.test(raw)) {
    throw new Error(`invalid session id: ${raw}`);
  }
  return raw as SessionId;
}
```

- **stubTodoPath**: `.heio/TODO.md`
- **sessionTodoPath**: `.heio/sessions/<sessionId>/TODO.md`

### Write

`writeSessionChecklist` creates the session directory and writes the markdown with a trailing newline. It writes the stub only when the file is missing or differs from `STUB_TODO_MARKDOWN`. A second session keeps its own file. Only the writer session is replaced.

```ts
// packages/heio-todo/src/store.ts writeSessionChecklist
writeFileSync(sessionPath, withTrailingNewline(input.markdown), "utf8");
writeStubIfNeeded(stubPath);
```

The factory queues that write with `withFileMutationQueue` on the session path.

`action: "write"` requires `markdown`. A missing body returns `markdown is required for action write`. An invalid Pi session id returns `invalid session id: ...`.

### List

`listSessionChecklists` walks `.heio/sessions/`. It skips names that fail `parseSessionId` and skips entries that are not a `TODO.md` file. Title is the first non-empty line. Results sort by session id.

List text leads with this session's items, or `No checklist for this session.` Sibling rows are titles only and capped.

### Write block

`isProtectedTodoPath` is true for the stub and for `.heio/sessions/<id>/TODO.md`. Resolution matches builtin write and edit: unicode spaces, a leading `@`, home, and `file://`. Existing aliases are compared after `realpath` when that succeeds. Other `.heio/` files are not protected.

On `tool_call`, the factory blocks builtin `write` and `edit` against those paths, and bash that would redirect, tee, rm, mv, or cp them. `read` and read-only bash are left alone.

```ts
// packages/heio-todo/src/index.ts tool_call
if (event.toolName === "bash") {
  // block redirect, tee, rm, mv, cp of protected paths
}
if (event.toolName !== "write" && event.toolName !== "edit") return;
```

## Trade-offs

The package is both the store and the Pi extension. Dest vendor `src/` matches the source package. Tests sit next to the store.

It refuses a sibling lib and refuses using builtin `write` for the live checklist. Shared work units stay under `.heio/inbox` and `.heio/planning`. Those paths are not this store.

## Consequences

Install copies this package through the vendor path in [[spec-installer]]. Agents call `heio_todo`. They do not mutate `.heio/TODO.md` or `.heio/sessions/*/TODO.md` with `write`, `edit`, or bash.

Terms live in [[glossary]].
