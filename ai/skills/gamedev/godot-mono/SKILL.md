---
name: godot-mono
description: Godot 4.7.2.stable.mono hybrid GDScript + C# development. Use when writing, reviewing, or refactoring Godot Mono projects, .cs/.gd scripts, scene trees, signals, exports, autoloads, .csproj/NuGet, C#↔GDScript interop, or performance-sensitive gameplay code.
metadata:
  version: "1.0.0"
  godot: "4.7.2.stable.mono"
---

# Godot 4.7.2 Mono (GDScript + C#)

Progressive rules for **hybrid** Godot Mono. Read only rule files that match the task.

## Stack caveats

**Assumes:** Godot **4.7.2.stable.mono**; hybrid GDScript + C#; .NET SDK installed separately.

**Prefer:** GDScript for glue/UI/iteration; C# for typed systems/hot loops/libs; scenes as composition root; `MethodName`/`SignalName`/`PropertyName`; language seams on nodes/autoloads.

**Careful:** `Call`/`CallDeferred`/`Connect` use **snake_case**; struct props copy-mutate-reassign; rebuild after `[Export]`/signals/tool changes; class name == `.cs` filename; marshalling cost of strings/arrays/native props.

**Do not introduce:** Godot 3 habits; Unity defaults (`Find`, god-`Update`); C# rewrites of trivial glue; C# web export expectations; globals outside Autoload/explicit services.

## When to apply

New `.gd`/`.cs` or hybrid features; signals/exports/resources/autoloads across languages; perf/architecture/interop refactors; `.csproj`/NuGet/build; PRs touching gameplay/scenes/Mono files.

## Priority bands

| Pri | Category | Impact | Prefix |
|-----|----------|--------|--------|
| 1 | Language split | CRITICAL | `hybrid-` |
| 2 | Cross-language interop | CRITICAL | `interop-` |
| 3 | C# Godot API | CRITICAL | `csharp-` |
| 4 | Lifecycle & deferred | HIGH | `lifecycle-` |
| 5 | Signals | HIGH | `signal-` |
| 6 | Scenes & composition | HIGH | `scene-` |
| 7 | Performance | MEDIUM-HIGH | `perf-` |
| 8 | GDScript hybrid style | MEDIUM | `gdscript-` |
| 9 | .NET tooling | MEDIUM | `dotnet-` |
| 10 | Resources & data | MEDIUM | `resource-` |
| 11 | Async | MEDIUM | `async-` |
| 12 | Physics & input | LOW-MEDIUM | `sim-` |
| 13 | Pitfalls (debugging) | CRITICAL | `pitfall-` |

## Quick reference

**hybrid-:** `hybrid-when-gdscript` glue/iteration · `hybrid-when-csharp` systems/hot paths · `hybrid-boundary-nodes` seams on nodes/autoloads · `hybrid-no-unity-defaults` no Unity defaults

**interop-:** `interop-call-snake-case` Call/Connect snake_case · `interop-stringname-constants` MethodName/SignalName · `interop-signals-across-languages` GD↔C# signals · `interop-expose-small-surface` tiny APIs · `interop-typed-arrays-collections` typed boundaries

**csharp-:** `csharp-partial-node-class` partial + filename · `csharp-export-and-build` rebuild exports · `csharp-struct-property-copy` reassign structs · `csharp-signals-sourcegen` [Signal] · `csharp-ready-process-signatures` override sigs · `csharp-nodepath-unique-name` %unique · `csharp-tool-scripts` [Tool] safety

**lifecycle-:** `lifecycle-ready-vs-enter-tree` · `lifecycle-deferred-setup` · `lifecycle-process-gates` · `lifecycle-exit-cleanup`

**signal-:** `signal-prefer-signals-over-tick` · `signal-callable-binding` · `signal-bus-autoload`

**scene-:** `scene-composition-over-deep-trees` · `scene-owner-and-packed` · `scene-groups-sparingly` · `scene-autoload-thin`

**perf-:** `perf-cache-native-props` · `perf-avoid-string-names-hot` · `perf-gdscript-vs-csharp-hotloop` · `perf-gc-in-process`

**gdscript-:** `gdscript-static-typing` · `gdscript-class-name` · `gdscript-call-csharp`

**dotnet-:** `dotnet-sdk-and-csproj` · `dotnet-nuget-packages` · `dotnet-ignore-godot-mono` · `dotnet-editor-external`

**resource-:** `resource-custom-resources` · `resource-load-vs-preload` · `resource-immutable-shared`

**async-:** `async-tosignal-csharp` · `async-gdscript-await` · `async-no-deadlock-main`

**sim-:** `sim-physics-process` · `sim-input-actions` · `sim-raycasts-cached`

**pitfall-:** `pitfall-missing-partial` · `pitfall-wrong-class-filename` · `pitfall-modify-struct-copy` · `pitfall-hot-reload-state`

## How to use

1. Pick **1–N** rule ids (higher priority first).
2. `Read` only `rules/<id>.md` (relative to this skill directory).
3. Do **not** bulk-read `rules/` or load all of `AGENTS.md` unless stuck or asked.
4. Reviewing/refactoring: walk categories top-down until covered.

## Full reference

Upstream pointers + long notes: `AGENTS.md` (reference only; prefer `rules/` + this router).
