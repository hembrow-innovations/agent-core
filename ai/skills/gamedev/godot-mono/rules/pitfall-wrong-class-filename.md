---
title: Class name must match file name
impact: CRITICAL
impactDescription: attach failures
tags: [pitfall, csharp]
---

## Class name must match file name

Attached scripts require the primary class name to match the `.cs` filename.

**Incorrect:** File `Hero.cs` containing `public partial class Player`

**Correct:** File `Hero.cs` containing `public partial class Hero`

Notes: Error looks like: cannot find class X for script res://X.cs.

