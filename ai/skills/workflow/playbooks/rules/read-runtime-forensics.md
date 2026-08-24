---
title: Runtime forensics
impact: MEDIUM
impactDescription: Theorizing from source misses the live mechanism
tags: [read]
---

## Runtime forensics

Diagnose a runtime symptom from live instrumentation. The deliverable is a diagnosis, not a fix.

**Incorrect:** Guess from a source read. Ship a fix in this playbook. Re-run a dropped file as if it were live.

**Correct:** You own the diagnosis. Capture the live signal. Reduce it. Prove the mechanism. Map it to source.

1. Capture on the matching surface: CPU profile, heap snapshot, or CDP trace.
2. Reduce the artifact in a subagent. Keep the finding.
3. Prove the mechanism with live instrumentation or a hotfix without reload.
4. Map to file, symbol, and line.
5. Throughput checkpoint: `n/a, read-only forensics`.

Library: `ai/playbooks/runtime-forensics.md` (dest: `playbooks/runtime-forensics.md`).

Notes: A file already captured is `read-trace-forensics`. Once the cause is known, hand to `fix-bug` or `fix-perf`.
