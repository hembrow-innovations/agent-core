---
title: Never export unapplied scale
impact: CRITICAL
impactDescription: Godot transform bugs
tags: [pitfall]
---

## Never export unapplied scale

**Incorrect:** Visual size via scale 0.12 left unapplied → animation/collider skew.

**Correct:** Apply scale; re-check dimensions in meters.
