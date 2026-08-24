---
title: Investigation
impact: CRITICAL
impactDescription: An investigation that opens a PR is the wrong playbook
tags: [read]
---

## Investigation

Read-only question. Cited explanation or a recommendation. No code change.

**Incorrect:** Start editing. Run Feature or Bug fix because the answer might imply a change. Skip `how`.

**Correct:** You own the answer. Route through `how` (and `why` for motivation). Write the cited output. Stop.

1. `how` in Explain mode for a narrow question, Critique mode for "are we sure?". Add `why` for motivation.
2. Throughput checkpoint is one line: `n/a, read-only investigation`.
3. Produce the `how` shape, or a tradeoffs table if the ask is a choice.
4. Apply `unslop` to the reply.

No PR. No babysit. No `architect` unless the investigation precedes a code change. Then hand back and re-route.

Library: `ai/playbooks/investigation.md` (dest: `playbooks/investigation.md`).

Notes: A defect to fix is `fix-bug`. Live instrumentation is `read-runtime-forensics`.
