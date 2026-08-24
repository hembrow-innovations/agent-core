---
title: Cache hot native property access
impact: HIGH
impactDescription: interop call reduction
tags: [perf, csharp]
---

## Cache hot native property access

Reading/writing node properties from C# often crosses native interop. In tight loops, localize to a variable.

**Incorrect:**
```csharp
for (var i = 0; i < 100; i++)
    Position += offsets[i]; // interop each iteration
```

**Correct:**
```csharp
var p = Position;
for (var i = 0; i < 100; i++)
    p += offsets[i];
Position = p;
```

Notes: Same idea for repeated `GlobalPosition` reads in GDScript hot paths.

