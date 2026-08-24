---
title: Do not default to Unity patterns
impact: HIGH
impactDescription: avoids fighting the scene tree
tags: [hybrid, architecture]
---

## Do not default to Unity patterns

Godot composition is scenes + nodes. Avoid forcing Unity-style entity component soup, singleton `Find` scans, or a single `GameManager` Update loop unless measured need.

**Incorrect:** One C# `GameManager` that finds all enemies each frame and mutates them.

**Correct:** Enemies as scenes; systems subscribe to signals/groups or process their own subtree; manager coordinates high-level state only.

Notes: Autoloads are fine as façades—not as a dumping ground for all gameplay.

