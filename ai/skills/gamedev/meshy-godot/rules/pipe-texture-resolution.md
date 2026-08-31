---
title: 2k default, 4k heroes, never 8k on mobile
impact: HIGH
impactDescription: texture memory dominates GLB size
tags: [pipeline, textures]
---

## 2k default, 4k heroes, never 8k on mobile

`texture_resolution` is `2k` / `4k` / `8k`. Higher is not free: VRAM, import time, and PCK size.

**Incorrect:** `8k` on every prop "for quality".

**Correct:** `2k` for props and background. `4k` for player-facing heroes if the platform has the budget. Avoid `8k` in Godot games.

Notes: `4k`/`8k` need meshy-6/7. meshy-5 is 2k. Deprecated `hd_texture` means 4k. Godot still VRAM-compresses on import (`mat-vram-srgb`).
