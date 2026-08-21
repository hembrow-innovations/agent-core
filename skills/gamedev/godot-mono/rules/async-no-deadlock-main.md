---
title: Respect main-thread Godot API
impact: HIGH
impactDescription: crashes and deadlocks
tags: [async]
---

## Respect main-thread Godot API

Most Node/SceneTree APIs must run on the main thread. Don’t touch nodes from random thread-pool workers.

**Incorrect:** `Task.Run(() => node.Position = ...)`

**Correct:** Compute off-thread; apply results on main via `CallDeferred` / synchronize back to process frame.

Notes: Prefer Godot’s WorkerThreadPool patterns when doing threaded engine work.

