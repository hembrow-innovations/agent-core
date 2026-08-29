---
name: design-tree
description: Design tree interview. Counterpart and notebook are branches.
disable-model-invocation: true
---

# Design tree

Interview until you share an understanding. Map the work as a **design tree**. Every settled decision opens the decisions that hang off it. The **frontier** is every decision whose prerequisites are already settled.

This skill plans. Stop at persist. Implementation is a later session.

Load **management** before any write under `.heio/`. Load **docs** before any write under `docs/`. Load **domain-modeling** when a term or ADR belongs in the vault.

## 1. Pick

Name the **counterpart**. The **notebook** follows. Say both in one line before the first round.

- **user** in this chat. Default.
- **user** in a file. Copy the management plan template to `.heio/planning/plans/`. Status `draft`. Keep the template headings. Append `## Rounds`. Write every round there. Never rewrite an earlier round. Objectives hold the destination. Approach holds standing notes. Phases stay empty until persist.
- **product** peer. Read [references/counterpart-product.md](references/counterpart-product.md) before round one.
- **panel**. Read [references/counterpart-panel.md](references/counterpart-panel.md) before round one.
- The tree will not fit in one sitting. Read [references/wayfinder.md](references/wayfinder.md) and follow that file instead of steps 2–3.

Done when counterpart and notebook are named, or when wayfinder has taken over.

## 2. Frontier

Finding facts is your job. Dispatch a lookup for anything you can observe. A running lookup is an unsettled prerequisite. Ask the rest of the frontier now.

Ask the whole frontier in one **round**. Number each question. Give a recommended answer. A question that depends on another still open in this round waits for a later round.

```markdown
❓ **Q1** - **<title>**: <body>

➡️ <recommended answer>
```

Wait for the counterpart. Record the answers in the notebook. Append the next frontier.

Done when every open decision has a recorded answer, no lookup is in flight, and the counterpart has confirmed a shared understanding.

## 3. Persist

**Promote** first. Then close.

- Durable knowledge. Load **docs**. Write an ADR, spec, architecture note, or guide. Kind must change. The interview stays in `.heio/`.
- In-flight work. Load **management**. Copy the plan template if the notebook is not already that file. Status `draft` until child tasks exist, `active` while any child is open, `complete` after promote. Then close-move.

A plan may go `complete` only when `docs/` holds the durable outcome, or the plan records `skip: no durable outcome`.

Execution slices. Load **to-issues** after the plan is `active`.

Done when the promote gate has passed and any execution plan is a management plan note.
