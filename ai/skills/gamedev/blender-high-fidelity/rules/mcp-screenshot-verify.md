---
title: Screenshot after visual changes
impact: CRITICAL
impactDescription: proof over narration
tags: [mcp, qa]
---

## Screenshot after visual changes

Visual claims need pixels. Use `get_viewport_screenshot` after silhouette, material, and final passes.

**Incorrect:** "Looks good" with no image after modeling.

**Correct:** Capture 3/4 hero + elevated/top-down when validating farm readability; attach/inspect screenshots before SHIP.

Notes: If screenshot tool fails, fall back to AABB/height probes and report the gap honestly.
