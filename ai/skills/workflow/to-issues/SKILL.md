---
name: to-issues
description: Break a plan, spec, or PRD into independently-grabbable management issues and tasks using tracer-bullet vertical slices. Use when the user wants to convert a plan into issues, create implementation tickets, or break work into issues.
---

# To Issues

Break a plan into independently-grabbable notes using vertical slices (tracer bullets).

Load **management** before any write under `.heio/`. Load **docs** for glossary terms and ADRs. Load **planning-workflow** if the loop is unclear.

If `AGENTS.md` or `WORKSPACE.md` already names a tracker (`.scratch/`, `docs/planning/`, GitHub Issues), that file wins. Do not start a second tree.

## Process

### 1. Gather context

Work from conversation context. If the user passes a plan or issue id, read that note under `.heio/` (include `closed/`).

### 2. Explore the codebase (optional)

Use glossary vocabulary discovered under `docs/`. Respect ADRs in the area.

Look for prefactoring that makes the implementation easier. Make the change easy, then make the easy change.

### 3. Draft vertical slices

Each unit is a thin vertical slice through all layers end to end, not one horizontal layer.

Slices may be **HITL** (needs a human decision) or **AFK** (an agent can implement). Prefer AFK.

- Each slice delivers a narrow but complete path (schema, API, UI, tests as needed)
- A completed slice is demoable or verifiable alone
- Each slice is sized to fit a single fresh context window
- Any prefactoring comes first. It is its own first slice and blocks the rest
- Prefer many thin slices over few thick ones

#### Wide refactors are the exception

A wide refactor is one mechanical change whose blast radius fans across the codebase. Do not force it into a tracer bullet. Sequence it as expand, then migrate, then contract.

- **Expand** adds the new form beside the old. Nothing breaks. `blocked_by` is usually empty.
- **Migrate** moves call sites in batches sized by blast radius (per package or directory). Each batch is its own note. `blocked_by` wikilinks the expand unit. Batches stay green because the old form still exists.
- **Contract** deletes the old form once no caller remains. `blocked_by` wikilinks every migrate batch.

If batches cannot be green alone, keep the sequence but land them on a shared integration branch, and have every batch block a final integrate-and-verify unit. Green is promised only there.

### 4. Choose kind

- Source is already a **plan**. Split into **tasks** on that plan.
- Source is a **PRD or issue** that is one effort. Promote it. Create a plan and tasks.
- Source fans into independent problems. Create **issues**. Tag AFK slices `ready-for-agent`. Tag HITL slices `ready-for-human` or `needs-info`.

Do not design the solution inside an issue. That belongs on the plan.

### 5. Show the slices, then publish

Present a numbered list. For each slice, give Title, Kind (issue or task), Type (HITL or AFK), Blocked by, and User stories covered.

If the user is present, ask about granularity, dependencies, merge or split, and HITL vs AFK. If they already approved a breakdown, publish.

Copy the matching **management** template. **management** owns `<N>`, placement, and frontmatter.

- Publish blockers first so `blocked_by` can wikilink real ids
- AFK-ready issues: `status: open` + tag `ready-for-agent`
- Tasks: `status: ready` when unblocked, `hold` when blocked
- Do not close or rewrite a parent issue unless the user asks

## Body extras

Keep the management template headings. Add these sections when they carry information the template does not.

```markdown
## Parent

Wikilink to the parent plan, issue, or PRD.

## What to build

End-to-end behavior of this vertical slice, not layer-by-layer implementation.
Avoid file paths and snippets. Exception: prototype-derived state machines,
schemas, or type shapes that encode a decision more precisely than prose.

## Acceptance criteria

- [ ] Criterion 1
- [ ] Criterion 2

## Blocked by

- [[issue-N-slug]] or [[task-N-slug]] or "None. Can start immediately."
```
