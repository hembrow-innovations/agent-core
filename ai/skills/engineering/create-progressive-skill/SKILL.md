---
name: create-progressive-skill
description: "Turn a knowledge pack or guide into a progressive-disclosure skill: small router SKILL.md plus on-demand rules/. Use for /create-progressive-skill or splitting a large guide."
disable-model-invocation: true
---

# Create a progressive-disclosure skill

Ship dozens of rules on disk. Put only a small router in context. Deep content is read on demand.

The user's argument is the brief: a topic, a path to a fat `SKILL.md` or guide, or "split X into a pack".

Layout, checklist, and anti-patterns: [`../create-skill/PROGRESSIVE.md`](../create-skill/PROGRESSIVE.md). Voice and invocation: [`../create-skill/SKILL.md`](../create-skill/SKILL.md). Read both before writing. Exemplar router: skill `vercel-react-best-practices` `SKILL.md` only, not its `rules/`.

## 1. Load the spec

Read the two create-skill files and the exemplar router.

**Done when** those three files are read.

## 2. Scope the brief

If the argument is empty, ask once for the pack to build. Then decide from the repo (ask only what you cannot observe):

- **Name.** kebab-case, matches the folder
- **Kind.** many independent rules (pack) vs ordered steps (playbook). A playbook stays a normal `SKILL.md` or a command. Stop and say so.
- **Invocation.** model-invoked when the agent should reach it mid-task; user-invoked only if it never fires except by name
- **Dest.** this pack: `ai/skills/<category>/<name>/`. Never edit `.pi/` or `.opencode/` copies here. A consuming project: that harness's skill dest (`.pi/skills/<name>/`, `.opencode/skills/<name>/`, `.claude/skills/<name>/`, `.agents/skills/<name>/`). Categories in this pack: `data`, `engineering`, `gamedev`, `principals`, `setup`, `testing`, `ui`, `workflow`
- **Stack.** what this repo already uses, and what not to introduce

**Done when** name, dest path, invocation, and "this is a pack" are decided. Stop if it is not a pack.

## 3. Collect

Gather raw rules from the brief, neighboring code, and any path the user named. Split into atomic failure modes: one pattern, one file. Prefix by category (`async-`, `auth-`, `rls-`, …). Give each an impact (`CRITICAL` | `HIGH` | `MEDIUM` | `LOW`) and a one-line summary.

Adapt every rule to this stack. Replace foreign APIs. Record prefer / careful / do not introduce for the router.

**Done when** every collected pattern has a rule id, impact, and one-line summary, and the stack caveats are written.

## 4. Write

Follow `PROGRESSIVE.md`. Write:

- `SKILL.md`. 50-150 lines. Frontmatter `name` + trigger-heavy `description`. Stack caveats, when to apply, priority bands, index (id + one line, grouped), how to use with explicit `rules/<id>.md` paths, the agent contract (pick 1-N ids, read only those files, do not bulk-read `rules/` or all of `AGENTS.md`). No full examples. No upstream essay.
- `rules/<prefix>-<slug>.md`. one concern, 20-80 lines, why → incorrect → correct → notes
- `AGENTS.md`. only if a long upstream needs parking. Label it reference-only

Do not copy a rule body into the router.

**Done when** the `PROGRESSIVE.md` checklist is all checked.

## 5. Verify the budget

- `SKILL.md` is at most 150 lines
- Every index id has a matching `rules/<id>.md`
- No rule file is missing from the index
- Spot-check one task from the brief: the agent would open 1-3 rule files, not the tree

If this pack: `pnpm exec agentic-core install . --profile agentic-core`.

**Done when** the checks pass and, in this pack, dest has the new skill.

## Reply

Name, dest path, rule count by priority, stack do-not-introduce list, and the spot-check task → rule ids.
