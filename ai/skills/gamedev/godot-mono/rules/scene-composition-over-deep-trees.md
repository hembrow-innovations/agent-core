---
title: Compose with instanced scenes
impact: HIGH
impactDescription: reusable units
tags: [scenes]
---

## Compose with instanced scenes

Build features as packed scenes (player, enemy, projectile) rather than one mega-scene tree edited by everyone.

**Incorrect:** Entire game level as one uninstanced hierarchy of hundreds of nodes hand-placed without scenes.

**Correct:** Level instances room/enemy/item scenes; each scene owns its scripts and unique names.

Notes: Keep scene roots stable as the public API of that prefab.

