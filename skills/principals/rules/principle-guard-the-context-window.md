---
title: Guard the Context Window
impact: HIGH
impactDescription: Bulk dumps degrade the session
tags: [exec, context]
---

## Guard the Context Window

**Incorrect:** Read the 2k-line file or dump the screenshot into the main thread.
**Correct:** Route bulk to a subagent. Keep the summary. Skip files you will not use.

The context window is finite and non-renewable within a session. Every token that enters should earn its place.

**Why:** Context overflow degrades reasoning quality, creates compression artifacts, and halts progress. Unlike compute or time, context spent inside a session cannot be reclaimed.

**Pattern:**
- **Isolate large payloads.** Route verbose outputs, screenshots, and large documents to `subagents` or a summary file. The main context gets summaries, not raw data.
- **Don't read what you won't use.** Read selectively based on relevance. If a file isn't needed for the current task, skip it.
- **Keep frequently used content inline.** Templates and references used on every invocation belong in the skill file, not in separate files that cost a read each time.
- **Size phases and cap scope.** Limit files per phase, set turn budgets, account for mechanism costs.
