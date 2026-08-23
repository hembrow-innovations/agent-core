# How to take an idea to done

This file is the rulebook for work in this workspace. The files under `.scratch/` are the source of truth. Chat is disposable. If a file has no `Mode` line, treat it as `Mode: think` and add the line. Do not start a second tree. Do not start coding.

Read this before you open a session that might last more than one sitting. Write in the files as you go. Come back tomorrow, next week, or after a different project, and pick up from `Where we left off`.

## The rule that stops early implementation

Every effort file carries two lines near the top:

```text
Status: idea
Mode: think
```

`Mode` is the hard gate.

- `think` means the agent may read, write notes, ask questions, and research. It must not edit product code, open an implementation PR, or write types into the repo. Design notes go under `.scratch/`.
- `build` means the human has unlocked implementation. The agent then follows a pstack or draconic-mode playbook.

Only you flip `Mode` to `build`. The `Mode` line on `idea.md` is canonical for the effort. If `idea.md` is missing, `session.md` wins. A phase file never unlocks code. An agent that wants to implement writes a request under `Where we left off` and waits.

`Status` on effort files is where the work sits on the pipeline. It is not permission to code. Issue files use `Status` the way the Matt Pocock tracker already does. That meaning is triage or wayfinder claim state, not the pipeline.

## Pipeline

Work moves through these statuses. You may jump back to any earlier status. You do not have to visit every one.

1. `inbox` or `idea`. Write the thought down. Stop.
2. `explore`. Learn what exists and why. Still `Mode: think`.
3. `plan`. Shape how this becomes real. Still `Mode: think`.
4. `ready`. You are satisfied the plan is enough. You flip `Mode` on `idea.md` to `build`. The status is still not permission by itself.
5. `implement`. A playbook writes code against the plan. Session pickup reads `Mode` first. A mid-flight branch does not override `think`.
6. `review`. Prove it on the real app. Interrogate the diff.
7. `done`, or jump back and iterate.

`parked` is the same files with a date and a reason you stopped. Pickup reads that section and continues.

```text
inbox ──► idea ──► explore ──► plan ──► ready ──► implement ──► review ──► done
  │         │         │         │                              │
  └─────────┴─────────┴─────────┴──────── parked ◄─────────────┘
                              ▲                                │
                              └──────────── iterate ───────────┘
```

## Where files live

Keep one tree. The Matt Pocock skills already look in `.scratch/`. Do not invent a second planning folder.

```text
.scratch/
  INDEX.md                        # one line per effort, updated when you create or park
  inbox/                          # dump and walk away
    2026-08-23-login-flash.md
  <effort-slug>/
    idea.md                       # the thought, allowed to stay rough
    explore.md                    # what, how, why
    session.md                    # the planning conversation
    spec.md                       # locked intent, when you have one
    map.md                        # wayfinder map, only when the fog is thick
    plan/
      overview.md                 # L1 outline
      phase-1-<slug>.md           # L3 unit, when you need it
    issues/
      01-<slug>.md
```

Create files when you have something to put in them. An idea can live as a single `idea.md` for months. Do not scaffold the whole tree up front.

Commit `.scratch/INDEX.md` and `.scratch/<effort-slug>/` when you want to resume on another machine. Leave `.scratch/inbox/` untracked if the dump is noisy. Pickup after a week starts at `INDEX.md`, not by guessing slugs.

One effort is one destination. If the idea splits into two destinations, split the directory. Do not pile two products into one `session.md`.

## Header every file shares

Put these lines under the title. Keep the names exactly like this so a future hook or skill can parse them.

```text
Status: plan
Mode: think
Level: L1
Updated: 2026-08-23
Parent: .scratch/<effort-slug>/
```

An inbox dump may omit `Level` and `Parent`.

Always keep a `Where we left off` section at the bottom of `idea.md`, `session.md`, and `plan/overview.md`. If those sections disagree, believe the file with the newest `Updated:` date. Then copy that next act into the others so they match.

```markdown
## Where we left off

- Last act: wrote the L1 outline and parked two open questions
- Next act: answer Q4 in session.md, then decide whether this needs a wayfinder map
- Open questions: auth provider, offline cache
- Do not: implement, open a PR
```

Pickup is reading that section and doing the next act. Nothing else.

## 1. Capture the idea

Write it down the same day. Rough is fine. You will change it.

Save to `.scratch/<effort-slug>/idea.md`, or dump into `.scratch/inbox/` if you do not have a slug yet.

The file answers four things, each in a few sentences:

- What you want to exist
- Who it is for
- Why now
- What "done" would look like if you saw it

It does not need architecture. It does not need tickets.

**Agent may.** Create or edit the markdown. Ask one clarifying question only when a missing preference would make the file lie.

**Agent must not.** Explore the codebase in depth. Plan phases. Touch product code.

**Stop when.** The idea is written and `Where we left off` says what would come next if you return.

Promote an inbox file by moving it to `.scratch/<effort-slug>/idea.md` and setting `Status: idea`.

## 2. Explore

Explore when you do not yet know what the system does, why it is shaped that way, or whether the idea fits.

Write findings to `.scratch/<effort-slug>/explore.md`. Link to files and commits. Do not paste dumps.

Run these in this order unless you already know the answer:

1. `/recall` if you have been here before.
2. `/how` for runtime behavior and ownership.
3. `/why` for the recorded reason a choice exists.
4. `/teach` when a summary is not enough and you want to understand it.
5. `/research` when the answer lives in official docs or an upstream API.

Stay in `Mode: think`. Exploration that starts editing the repo is implementation with extra steps.

**Stop when.** You can say what exists, what is missing, and whether the idea still holds. If it does not hold, change `idea.md` or park the effort.

## 3. Plan

Planning is a conversation recorded in markdown. It is not a prelude an agent is allowed to skip.

Use `.scratch/<effort-slug>/session.md` as the notebook you and the agent pass back and forth. Use `plan/` for the artifact that falls out of that notebook. Use `spec.md` when the intent is stable enough that later sessions should treat it as given.

### Planning levels

A session is complete for its level. It is not incomplete because a lower level does not exist yet.

| Level | Name | Lives in | Good enough when |
| --- | --- | --- | --- |
| L0 | Intent | `idea.md`, then `spec.md` | You know what and why. You could explain it to a stranger. |
| L1 | Outline | `plan/overview.md` | You can name the stages, such as build, test, and deploy. You know the order and the definition of done. |
| L2 | Design | `plan/overview.md` plus architect notes | Types, seams, and rejected alternatives are written. `/architect with checkpoint` has stopped before code. |
| L3 | Implementation | `plan/phase-N-<slug>.md` | Each phase names the files, the data shape, and how you will prove that phase. No code snippets. |

Stay at L0 or L1 for days or weeks if that is the work. A long L0 session is a real session. Do not let the agent "helpfully" drop to L3.

### How a planning session runs

This is the Matt Pocock planning skill, written to a file so you can leave and come back.

1. Open `session.md`. If it exists, read `Where we left off` and the last unanswered round. Do not restart the interview.
2. The agent asks the whole frontier for this level in one round. Facts it can look up are its job. Preferences are yours.
3. Each round is numbered and written into the file. The agent recommends an answer. You reply in the file or in chat. The agent appends your reply.
4. The agent updates `plan/` only when a decision has actually settled. It does not rewrite the whole plan every turn.
5. The session ends when you say so, or when the frontier for this level is empty. It does not end when the agent feels ready to code.

For work that will outlive one week, or that is too big for one session to hold, start a wayfinder map in `map.md`. Wayfinder tickets are decisions, not build slices. Resolve one ticket per session. Research tickets may run in parallel.

`/architect with checkpoint` is the move at L2. Say `with checkpoint` every time. Without it, architect proceeds into implementation. Write the design into `.scratch/`, not into product files. If the skill would edit the repo, stop and stay in `think`.

`/prototype` during `think` is allowed only as an isolated scratch. It must not write next to the real module. If the installed prototype skill cannot isolate, do not run it until `Mode` is `build`.

`/figure-it-out` is for a large or cross-cutting effort that matches no playbook. It designs the run. It still does not flip `Mode`.

**Stop when.** The current level is written, `Where we left off` is current, and `Mode` is still `think` unless you flipped it.

## 4. Implement

You flip the header:

```text
Status: implement
Mode: build
```

Then start the sticky mode for this repo. In this workspace that is `/draconic-mode`. In a project installed with the pstack profile it is `/poteto-mode` or the `poteto` agent. They are the same playbooks.

The implementer reads `spec.md` and `plan/`, claims one ready unit, and follows the matching playbook. Docs lead code when a `docs/` tree exists.

Do not implement from chat while `session.md` is still the live artifact. Point the implementer at the files.

You may skip a written plan when the change is one or two files with an obvious approach. Only you write that skip into the effort file, and only after you have set `Mode: build`. An agent must not declare the skip.

## 5. Review and test

A unit is not done because it compiles.

1. Run the project build, typecheck, and lint when those exist.
2. Run the tests that cover the changed behavior.
3. Drive the real path with the project `verify-*` skill or harness.
4. Run `/interrogate` on contested or boundary-crossing diffs.
5. Run `/unslop` on PR bodies and docs. Run `/no-comments` before review.

Write the proof into the phase file or the issue under an `## Proof` heading. A sentence that says "tested" is not proof. A command and what you saw is.

Set `Status: review` while this is happening. Set `Status: done` only when you are satisfied.

## 6. Iterate

Iteration is a status change, not a new philosophy.

- The idea is wrong. Edit `idea.md`. Set `Status: idea`. Keep `Mode: think`.
- The plan missed a seam. Reopen `session.md`. Set `Status: plan`.
- The code is wrong. Open an issue under `issues/` or dump to `inbox/`. Stay in `build` if the fix is in scope. Flip back to `think` if the destination moved.
- You are done with this sitting but not with the work. Set `Status: parked`. Fill `Where we left off`.

## Dump an issue

When something breaks, or you notice a gap you cannot take now, write a file and stop. Do not start a planning session unless you want one.

Path: `.scratch/inbox/YYYY-MM-DD-<slug>.md`

```markdown
# Login flash on first paint

Status: inbox
Mode: think
Updated: 2026-08-23

## Seen

What happened, where, and how to see it again.

## Expected

What should have happened.

## Notes

Anything you do not want to forget. Links. Stack traces. "Happens only on cold start."

## Where we left off

- Last act: dumped this from the phone session
- Next act: reproduce, then promote into the auth effort or close
- Do not: implement
```

Promote it by moving the file to `.scratch/<effort-slug>/issues/NN-<slug>.md` and adding:

```text
Type: task
Status: needs-triage
Blocked by:
```

On issue files, `Status` is the Matt Pocock tracker field. Use `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, or `wontfix`. Wayfinder tickets use `claimed` or `resolved` instead. Do not put pipeline statuses such as `idea` or `implement` on issue files.

`ready-for-agent` still requires the parent effort's `idea.md` to be `Mode: build`.

Comments append under `## Comments`. Do not rewrite history. Add a new note.

## How agents work here

### Sticky mode

`/draconic-mode` (this repo) and `/poteto-mode` (pstack install) pick a playbook, copy its steps into the todo list, and stay on until you opt out. Casual chat can be short. Any engineering task re-enters the playbook.

The agent names the playbook. You keep talking in plain English.

### Playbook map

| You are doing | Status | Mode | Playbook or skill |
| --- | --- | --- | --- |
| Writing the thought down | `idea` | `think` | This file. No playbook. |
| How does this work | `explore` | `think` | investigation, `/how` |
| Why is it shaped this way | `explore` | `think` | investigation, `/why` |
| Catch me up | any | `think` | `/recall`, then session pickup if a branch is mid-flight |
| Interview me about the design | `plan` | `think` | `/planning`, `/planning-with-docs` |
| Name the words we mean | `plan` | `think` | `/domain-modeling`, `/domain-modeling-with-docs` |
| The work is bigger than one session | `plan` | `think` | `/wayfinder` |
| Settle types and seams | `plan` | `think` | `/architect with checkpoint` |
| Compare two designs | `plan` | `think` | `/arena` notes under `.scratch/`, or `/prototype` only if isolated |
| No playbook fits | `plan` | `think` | `/figure-it-out` |
| Build a named unit | `implement` | `build` | feature |
| Preserve behavior, change shape | `implement` | `build` | refactoring |
| A defect with a repro | `implement` | `build` | bug-fix |
| Measured slowness | `implement` | `build` | perf-issue, hillclimb |
| Many stacked units | `implement` | `build` | multi-phase-plan, then orchestrate |
| Overnight drain of ready units | `implement` | `build` | autonomous-run or autopilot-stack |
| Prove the diff | `review` | `build` | `/interrogate`, project `verify-*` |
| Leave for the night | any | either | pause-safely |
| Resume a branch or transcript | any | either | session-pickup |

### Subagents

Spawn with the Task tool.

- `draconic-agent` or `poteto-agent` for a parallel unit that must follow the same style. It must load the mode skill first.
- `explore` for read-only search.
- `comment-sicko` for comment slaughter, usually through `/no-comments`.

Do not substitute a bare `general` agent when rigor is required. Give each writer its own worktree under `.draconic/worktrees/` when two of them might touch the same files.

### Planning skills from Matt Pocock

These live under `skills/engineering/` and stay in `Mode: think`:

- `planning` interviews you in rounds on a design tree.
- `planning-with-docs` writes those rounds into a markdown file and waits for your replies in the file.
- `wayfinder` charts a map of decision tickets when one session cannot hold the work.
- `domain-modeling` keeps `CONTEXT.md` and ADRs honest.
- `domain-modeling-with-docs` does the same work in the `docs/` vault from the docs skill. Glossary at `docs/overview/glossary.md`. ADRs at `docs/decisions/adr/`.
- `research` sends a background agent at primary sources and writes a cited note.
- `handoff` compacts the chat into a pickup doc. Prefer updating `Where we left off` in the effort files instead, so pickup does not depend on a temp file.

Setup for those skills is `/setup-matt-pocock-skills`. This workspace uses the local markdown tracker, which is `.scratch/`.

### Decision trail

Long, autonomous, or multi-phase work logs one row per decision through `/show-me-your-work`. In this repo the log is `.draconic/decisions.tsv`. In a project installed from the pstack profile, follow that project's `WORKFLOW.md`. The effort files hold the plan. The TSV holds what was chosen and where the proof lives.

## Project packs

Install from this repo with a profile. The profile is the set. Do not hand-copy folders into a project.

| Profile | What you get |
| --- | --- |
| `core` | Engineering and productivity skills, including planning |
| `web` | `core`, plus `playwright-cli` and `react-testing` |
| `mobile` | `core`, plus `maestro` and `react-testing` |
| `pstack` | Full pstack playbooks, poteto agents and commands, OpenCode templates |
| `godot` | `pstack` plus `godot-mono` |
| `full` | Everything |

After install, fill `AGENTS.md` for that project. Copy this file to the project root as `WORKSPACE.md` if the project should follow the same pipeline. Create a project `verify-*` skill with `/create-verification-skill`.

### What each kind of thing is for

- A skill is a playbook an agent loads when the task matches.
- A command is the slash entry that loads that skill.
- An agent is a sticky persona or a Task `subagent_type`.
- A hook is automation at a lifecycle event. This repo's `hooks/` folder has only a README. Nothing runs yet. The first hook worth adding is one that refuses product-code writes while any open effort is `Mode: think`. Until that hook exists, the `Mode` line is a rule, not a lock.
- A rule under `.opencode/rules/` is always-on project policy. `AGENTS.md` wins on layout and tooling.

Keep project-local skills in the project. `verify-myapp` belongs there, not here.

## Pickup after a gap

1. Read this file if you have forgotten the rules.
2. Read `.scratch/INDEX.md`. Pick the effort.
3. Read that effort's `idea.md` `Mode` line. Then read the `Where we left off` with the newest `Updated:` date.
4. Run `/recall` if the chat history has facts the files lack. Copy anything durable into the files.
5. If a branch is mid-flight and `Mode` is `build`, use session-pickup. Do not redo finished units. If `Mode` is `think`, ignore the branch and continue the notes.
6. Do the next act. Do not flip `Mode` unless you mean to.

## What this file is not

It is not a substitute for a playbook. Once `Mode` is `build`, draconic-mode or poteto-mode owns the steps.

It is not a second issue tracker. GitHub and GitLab stay valid. The local markdown tree is the default because you asked to dump an issue into a file and pick it up later.

It is not permission for an agent to grow a skill, command, or hook set while capturing an idea. Those are separate efforts, with their own `Mode`.

## Templates

Copy these. Fill the blanks.

### Index

Keep this at `.scratch/INDEX.md`. One line per effort. Update it when you create, park, or finish.

```markdown
# Efforts

- `auth-session`. Status: plan. Mode: think. Next: answer Q4 in session.md
- `inbox/2026-08-23-login-flash`. Status: inbox. Mode: think. Next: reproduce
```

### Idea

```markdown
# <short name>

Status: idea
Mode: think
Level: L0
Updated: YYYY-MM-DD

## What

What you want to exist. A few sentences. Allowed to be wrong.

## Who

Who this is for, including the person who will maintain it.

## Why now

What changed. What happens if you do nothing.

## Done looks like

A check you could run or a thing you could see.

## Out of scope

What this is not, if you already know.

## Where we left off

- Last act:
- Next act:
- Open questions:
- Do not: implement
```

### Explore note

```markdown
# Explore: <short name>

Status: explore
Mode: think
Level: L0
Updated: YYYY-MM-DD
Parent: .scratch/<effort-slug>/

## What exists

Facts, with paths.

## How it works

Runtime flow. Link `/how` output if you saved it.

## Why it is this way

Cited reasons, or "nobody wrote this down."

## Fit

Does the idea still hold. What would have to change.

## Where we left off

- Last act:
- Next act:
- Do not: implement
```

### Session (planning notebook)

```markdown
# Session: <short name>

Status: plan
Mode: think
Level: L1
Updated: YYYY-MM-DD
Parent: .scratch/<effort-slug>/

## Destination

One or two lines. What "the way is clear" means for this session.

## Settled

- Decision: reason

## Round 1

### Q1. <title>

<question>

Recommended: <answer>

Your reply:

---

## Where we left off

- Last act:
- Next act:
- Open questions:
- Do not: implement
```

### Plan overview (L1, grows to L2)

```markdown
# Plan: <short name>

Status: plan
Mode: think
Level: L1
Updated: YYYY-MM-DD
Parent: .scratch/<effort-slug>/

## Context

Problem and why now.

## Scope

In. Explicitly out.

## Stages

1. <stage>. Done when <check>
2. <stage>. Done when <check>

## Alternatives

What you considered. What you picked. Why.

## Verification

Project commands and the real path you will drive.

## Applicable skills

Named skills the implementer must load.

## Where we left off

- Last act:
- Next act:
- Do not: implement
```

### Phase (L3)

```markdown
# Phase N: <short name>

Parent: .scratch/<effort-slug>/plan/overview.md
Phase-status: drafted
Mode: think

Phase-status is `drafted`, `ready`, or `shipped`. It is not the effort pipeline. `ready` here means the phase plan is written. It does not mean `Mode: build`.

## Goal

What this phase accomplishes.

## Changes

Files and why. Not how. No code snippets.

## Data shape

The key types or schemas, one line each.

## Proof

Static check:

Runtime check:
```

### Issue

```markdown
# <short name>

Status: inbox
Mode: think
Updated: YYYY-MM-DD
Type: task

## Seen

## Expected

## Notes

## Comments

## Where we left off

- Last act: dumped
- Next act:
- Do not: implement
```
