---
title: Language seams on nodes or autoloads
impact: CRITICAL
impactDescription: prevents spaghetti Call chains
tags: [hybrid, architecture]
---

## Language seams on nodes or autoloads

Cross-language traffic should cross a **named seam**: a node class, autoload façade, or resource—not ad-hoc `call("do_thing")` from deep call stacks.

**Incorrect:**
```gdscript
# random enemy.gd
get_node("/root/Foo").get_child(2).call("apply_damage_internal", 3)
```

**Correct:**
```gdscript
# enemy.gd
DamageService.apply(target, amount)  # autoload or injected ref with stable API
```

```csharp
// DamageService.cs — small public surface
public partial class DamageService : Node
{
    public void Apply(Node target, int amount) { /* ... */ }
}
```

Notes: Document which side owns the API. Prefer typed methods over string `call`.

