---
title: Non-destructive until export prep
impact: HIGH
impactDescription: iteration speed
tags: [model, modifiers]
---

## Non-destructive until export prep

Keep Mirror/Boolean/Bevel live while exploring.

**Incorrect:** Apply mirror on first pass; delete blockout early.

**Correct:** Preferred stack bottom→top: Mirror → Array → Solidify → Boolean → Bevel → Weighted Normal → Subdiv (only if topo supports). Apply for export when locked.
