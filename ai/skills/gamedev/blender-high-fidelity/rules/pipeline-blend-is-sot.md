---
title: .blend is source; .glb is generated
impact: CRITICAL
impactDescription: reproducible art
tags: [pipeline, export]
---

## .blend is source; .glb is generated

Never treat runtime glTF as editable source.

**Incorrect:** Fix normals by hex-editing or re-importing only the `.glb`; commit `.glb` without matching `.blend`.

**Correct:** Edit `.blend` → re-export `.glb` beside it. Document export settings if non-default.

Notes: `_author_*.py` bootstrap scripts may exist; hero destination still requires a real `.blend` SoT.
