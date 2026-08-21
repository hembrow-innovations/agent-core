---
title: Keep autoloads thin façades
impact: HIGH
impactDescription: god-object prevention
tags: [scenes, architecture]
---

## Keep autoloads thin façades

Autoloads should coordinate and expose APIs, not own every system’s implementation details.

**Incorrect:** `Game.cs` autoload with UI, saves, combat, audio, and networking all inlined.

**Correct:** Autoload exposes `SaveService`, `Audio` APIs; implementations in dedicated nodes/classes.

Notes: Hybrid tip: autoload C# façade called from GDScript UI is a strong default seam.

