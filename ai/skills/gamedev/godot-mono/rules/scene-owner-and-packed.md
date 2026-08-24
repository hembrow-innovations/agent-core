---
title: Owner and packing discipline
impact: MEDIUM
impactDescription: broken save/pack
tags: [scenes]
---

## Owner and packing discipline

Nodes created in code must set `Owner` appropriately if they should save with the packed scene. Editable children and inherited scenes need care when overriding.

**Incorrect:** Runtime `AddChild` without understanding whether the node is ephemeral or should persist in editor-made scenes.

**Correct:** Runtime-only nodes: no owner needed. Editor tooling that packs scenes: set `Owner = root` on nodes that should be saved.

Notes: Don't pack throwaway VFX into `.tscn` by accident.

