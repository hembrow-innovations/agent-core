---
name: world-vault
description: World vault canon. Use when reading or writing lore notes, auditing continuity, consulting encyclopedia facts, or when fiction must not contradict the vault.
---

# Canon

The vault is the encyclopedia. Fiction links to it. Fiction does not rewrite it.

Read [`rules/layout.md`](rules/layout.md) before creating or moving a note. Read [`rules/continuity.md`](rules/continuity.md) before an audit or a continuity lane.

## Consult (every fiction lane)

1. From the brief, list every `[[WikiLink]]` and named entity. Completion: the list exists.
2. Read those notes in `10 Core/`, `20 Atlas/`, and `30 Characters/`. Follow one hop of links when the brief depends on them. Completion: you can state the facts the chapter may use, and the facts it must not invent.
3. If a needed fact is missing, do not invent it. Pick a weaker brief. Unattended lanes never ask and never wait on a lore ticket. Completion: no new cosmology, faction, or technology appeared only in the chapter.

## Branch: develop lore

In-session. Converted from the old develop-lore command.

1. Survey related notes with Glob/Grep, then read them. Completion: you know what the vault already says.
2. In-session only: ask when creative direction is actually open. Unattended lanes never ask. They do not run this branch. Completion: direction is known, or this branch did not run.
3. Write or edit lore in the matching folder, matching the template in `00 Meta/01 Templates/`. Neutral, factual, textbook voice. `[[WikiLinks]]` on every reference. Do not contradict established notes. Completion: the note parses, front matter has `type` and `status`, Related Notes lists connections.

New material is an extension. Leave hooks. Do not fill every silence.

## Branch: audit

In-session or Continuity lane. Converted from the old audit-consistency command.

1. Build a fact registry from the notes in scope. Completion: names, dates, causes, and claims are listed with source notes.
2. Cross-check using [`rules/continuity.md`](rules/continuity.md). Completion: every genuine conflict is written down. No false positives.
3. Write the report to `40 Production/44 Audits/` (lore) or `50 Book/53 Critique/` (chapter vs canon). Completion: the report names notes, quotes the conflict, and suggests a resolution that preserves the most lore.

You are not writing new lore in an audit.

## Fiction vs lore

- Lore (`10` to `30`): facts. No narrative voice.
- Production (`40`): scripts, ideas, old YouTube pipeline. Links back.
- Book (`50`): the novel. Links back. If the novel needs a new fact, ticket lore first, then write the page.

Canon wins. If the chapter and a lore note disagree, the chapter changes, unless the ticket's intent is to extend canon and the human (or a develop-lore sitting) already approved it.
