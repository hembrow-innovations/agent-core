# Vendored pstack index (OpenCode)

Installed from **agent-core** pstack pack.  
**Loaded by OpenCode from:** `.opencode/skills/`, `.opencode/agent/`, `.opencode/command/`.

## Entry

| Slash / agent | Path |
|---------------|------|
| agent `poteto` (primary) | `.opencode/agent/poteto.md` |
| `/poteto-mode` | `.opencode/command/poteto-mode.md` → skill `poteto-mode` |
| `/setup-pstack` | `.opencode/command/setup-pstack.md` |
| `/orchestrate` | `.opencode/command/orchestrate.md` |

## Skills (non-principle)

architect · arena · automate-me · blast-radius · bro · create-verification-skill · figure-it-out · how · interrogate · maintain-verification-skill · no-comments · poteto-mode · recall · reflect · setup-pstack · show-me-your-work · swarm · tdd · teach · technical-writing · typescript-best-practices · unslop · why

## Principles (21)

laziness-protocol · foundational-thinking · redesign-from-first-principles · subtract-before-you-add · minimize-reader-load · outcome-oriented-execution · experience-first · exhaust-the-design-space · build-the-lever · model-the-domain · boundary-discipline · type-system-discipline · make-operations-idempotent · migrate-callers-then-delete-legacy-apis · separate-before-serializing-shared-state · prove-it-works · fix-root-causes · sequence-verifiable-units · guard-the-context-window · never-block-on-the-human · encode-lessons-in-structure

## Playbooks (`poteto-mode/playbooks/`)

investigation · bug-fix · perf-issue · hillclimb · runtime-forensics · trace-forensics · feature · refactoring · prototype · visual-parity · authoring-a-skill · eval · babysit · shipping · autonomous-run · orchestrate · autopilot-full · autopilot-stack · session-pickup · pause-safely · multi-phase-plan · worktree-cleanup · opening-a-pr

## Agents (OpenCode Task `subagent_type`)

| Name | File | mode |
|------|------|------|
| poteto | `.opencode/agent/poteto.md` | primary |
| poteto-agent | `.opencode/agent/poteto-agent.md` | subagent |
| comment-sicko | `.opencode/agent/comment-sicko.md` | subagent (read-only) |

## Commands

See `.opencode/command/` — poteto-mode, how, why, architect, arena, swarm, interrogate, tdd, unslop, no-comments, setup-pstack, blast-radius, figure-it-out, show-me-your-work, teach, recall, reflect, technical-writing, orchestrate.

## Guide

Upstream Cursor guide lives in agent-core `pstack/docs/guide/`. OpenCode adapter notes are in skill `poteto-mode` (OpenCode runtime adapter section).

## Project-local (add after install)

| Path | Role |
|------|------|
| `.opencode/skills/verify-<app>/` | Project verify skill + feature map (`/create-verification-skill`) |
| `.opencode/rules/*` | Product + path + model map |
| `opencode.json` | skills.paths, MCP, instructions |
| `WORKFLOW.md` | How operators drive *this* project |
| `AGENTS.md` | Authority for engine, layout, hard stops |
