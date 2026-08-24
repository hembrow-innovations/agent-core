---
title: Signal bus only when it earns its keep
impact: MEDIUM
impactDescription: global coupling risk
tags: [signals, architecture]
---

## Signal bus only when it earns its keep

A global event bus autoload can decouple distant systems; it can also hide dependencies.

**Incorrect:** Every interaction routes through `Events.emit("thing", ...)` with stringly events.

**Correct:** Direct signals for parent/child and local systems; a small typed bus for cross-cutting game events (run_started, settings_changed).

Notes: In C#, typed bus methods beat magic strings.

