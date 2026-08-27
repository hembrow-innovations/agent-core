---
name: planning
description: Interview the user on a design tree. Use when the user wants to plan or stress-test their thinking in a project that uses the management and docs skills. Working notes stay under .draconic/. Durable outcomes go in docs/.
---

# Planning with local management

Interview the user until you share an understanding. Map the work as a design tree. Every decision branches into the decisions that hang off it.

Do not build. Do not open a GitHub Issue. Do not write the interview into `docs/`.

## Store

Load **management** before any write under `.draconic/`. Load **docs** before any write under `docs/`. Load **domain-modeling** when a term or ADR belongs in the vault.

If `AGENTS.md` or `WORKSPACE.md` already names a tracker (`.scratch/`, GitHub Issues, `docs/planning/`), that file wins. Do not start a second tree.

## Rounds

The frontier is every decision whose prerequisites are already settled. Ask the whole frontier in one round. Number each question and give your recommended answer. Wait for the user's answers before the next round.

```
❓ **Q1** - **<question title>**: <question body, might be multiple paragraphs, including multiple choices>

➡️ <your recommended answer>

---

❓ **Q2** - **<question title>**: <question body, might be multiple paragraphs, including multiple choices>

➡️ <your recommended answer>
```

A question that depends on another question still open in this round belongs to a later round.

Finding facts is your job. Dispatch a sub-agent for anything you can look up. A running lookup is an unsettled prerequisite. Ask the rest of the frontier now. Decisions are the user's. Put each to them and wait. A three-persona panel round is **planning-arena**.

## After the frontier is empty

Stop. Do not act until the user confirms a shared understanding.

Then persist only what should outlive the chat.

- In-flight work. Load **management**. Copy the plan template into `.draconic/planning/plans/`. Status `draft` until you are ready to split tasks.
- Durable knowledge. Load **docs**. Write an ADR, spec, architecture note, or guide. Do not copy the interview or the plan into `docs/` as a plan.

If the conversation will not fit in one sitting, stop and load **planning-with-docs** or **wayfinder**.
