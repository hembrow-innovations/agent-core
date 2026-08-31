---
title: Do not call Meshy from exported games
impact: CRITICAL
impactDescription: CORS 403 plus key theft
tags: [security, runtime]
---

## Do not call Meshy from exported games

Meshy blocks browser CORS (HTTP **403**). Even native exports that embed a key are a theft surface. Runtime generation is also too slow and too expensive for a ship loop.

**Incorrect:** `HTTPRequest` on a gameplay node hitting `api.meshy.ai` in a player build.

**Correct:** Generate in the editor or CI. Ship baked `res://` GLB/PackedScenes. If a live feature is required, proxy through **your** server that holds the key.

Notes: Prototype-only runtime calls still belong behind a debug flag that is compiled out of release.
