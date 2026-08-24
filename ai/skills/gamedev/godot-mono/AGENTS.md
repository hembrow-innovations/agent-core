# Godot 4.7.2.stable.mono — reference only

**Prefer `rules/` + `SKILL.md` stack notes.** This file is optional bulk context for humans or when the agent is stuck. Do not load it by default on skill activation.

## Official docs (start here)

- Scripting overview: https://docs.godotengine.org/en/stable/getting_started/step_by_step/scripting_languages.html
- C# basics: https://docs.godotengine.org/en/stable/tutorials/scripting/c_sharp/c_sharp_basics.html
- C# features: https://docs.godotengine.org/en/stable/tutorials/scripting/c_sharp/c_sharp_features.html
- C# API differences vs GDScript: https://docs.godotengine.org/en/stable/tutorials/scripting/c_sharp/c_sharp_differences.html
- C# signals: https://docs.godotengine.org/en/stable/tutorials/scripting/c_sharp/c_sharp_signals.html
- Style guide GDScript: https://docs.godotengine.org/en/stable/tutorials/scripting/gdscript/gdscript_styleguide.html
- Style guide C#: https://docs.godotengine.org/en/stable/tutorials/scripting/c_sharp/c_sharp_styleguide.html
- .NET platforms / export notes: https://docs.godotengine.org/en/stable/tutorials/scripting/c_sharp/index.html

Pin version-specific pages to **4.7** when docs offer version switcher. This pack targets **4.7.2.stable.mono**.

## Hybrid architecture (summary)

```
Scenes (.tscn)           = composition & designer surface
GDScript                 = glue, UI, rapid iteration, thin adapters
C#                       = systems, typed domain, hot paths, libraries
Autoload façades         = stable cross-language entry points
Resources (.tres)        = shared data definitions
```

Default flow:

1. Design scene tree and signals first.
2. Put ephemeral glue in GDScript.
3. When logic hardens or needs types/perf, move the **core** to C# behind a small API.
4. Keep crossing the language boundary intentional and narrow.

## Project files checklist

| Path | Commit? | Notes |
|------|---------|--------|
| `project.godot` | yes | |
| `*.tscn`, `*.tres` | yes | |
| `*.gd`, `*.cs` | yes | |
| `*.csproj`, `*.sln` | yes | Godot.NET.Sdk |
| `.godot/` | no | includes mono caches |
| `bin/`, `obj/` | no | if present |

## C# skeleton

```csharp
using Godot;

public partial class ExampleSystem : Node
{
    [Export] public float Speed { get; set; } = 5f;

    [Signal]
    public delegate void StartedEventHandler();

    public override void _Ready()
    {
        SetProcess(false);
    }

    public void Start()
    {
        EmitSignal(SignalName.Started);
        SetProcess(true);
    }

    public override void _Process(double delta)
    {
        // hot path: cache native props, avoid allocs
    }
}
```

## GDScript skeleton (glue)

```gdscript
extends Node
## Thin adapter — calls into C# system

@onready var system: Node = %ExampleSystem

func _on_start_pressed() -> void:
	system.start()
```

## Interop quick facts

- String-based `Call` / `CallDeferred` / engine `Connect` names: **snake_case**.
- Prefer `MethodName` / `SignalName` / `PropertyName` in C#.
- Rebuild after new exports/signals/tool changes.
- Class name == `.cs` file name; class must be `partial`.
- Struct properties: copy → mutate → reassign (`with` expressions).
- Most Node APIs: main thread only.
- C# web export: not available on Godot 4.x; mobile .NET export has limitations—read current platform docs.

## Performance quick facts

- Native property get/set from C# is interop-expensive in tight loops.
- `string` → `StringName`/`NodePath` implicit conversion costs; preallocate.
- Measure before rewriting GDScript systems in C#.
- Cross-language chattiness can erase C# gains.

## Debugging approach

1. Confirm Godot **mono** binary + SDK versions.
2. Build from editor; read MSBuild errors first.
3. For “signal not in inspector”: rebuild.
4. For “cannot find class for script”: filename/class/`partial`.
5. For “node doesn’t move”: struct copy reassignment.
6. For cross-language call no-op: snake_case vs PascalCase name mismatch.
7. Nuke `.godot/mono` if caches corrupt (keeps sources).

## Upstream issue trackers

- Engine: https://github.com/godotengine/godot
- .NET topic label: https://github.com/godotengine/godot/labels/topic%3Adotnet
- Docs: https://github.com/godotengine/godot-docs
