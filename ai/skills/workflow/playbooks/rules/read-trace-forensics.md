---
title: Trace forensics
impact: MEDIUM
impactDescription: Re-running a dropped capture invents a different dataset
tags: [read]
---

## Trace forensics

Diagnose a captured profiling artifact handed to you after the fact.

**Incorrect:** Re-run the program. Treat a frame with no source mapping as a diagnosis. Instrument the live process.

**Correct:** You own the diagnosis from the artifact. Load it. Shape it. Narrow. Attribute.

1. Identify the format and load it. Parse large artifacts in a subagent.
2. Transform into a queryable shape before you read.
3. Narrow to the hot path, retainer chain, or stuck thread.
4. Map to file, symbol, and line. Say so if the artifact has no symbols.
5. Confirm against a paired capture when you have one.
6. Hand back a cited diagnosis. No fix unless asked.

Library: `ai/playbooks/trace-forensics.md` (dest: `playbooks/trace-forensics.md`).

Notes: Live instrumentation is `read-runtime-forensics`.
