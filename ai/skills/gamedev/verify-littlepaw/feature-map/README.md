# littlepaw feature map

maintained index of **verification slices** for `/verify-littlepaw`. read this first, then open one slice file. the map is the source of truth for *what* to prove; docs under `docs/` are design SoT for *what it should mean*.

## baseline (every run)

- repo root = this checkout (`docs/`, `docs/planning/`, `project.godot`, `simulation/`, `assets/`)
- engine pin: Godot **4.7.2 mono**, project path **repo root**
- doctor before drive — see parent `SKILL.md`
- if no `project.godot` → entire map is **`NOT_RUNNABLE`**
- one slice per verify pass unless user asks for a sweep
- evidence report under `docs/log/reporting/<YYYY>/<MM>/YYYY-MM-DD-report-verify-<slug>.md` (not `/tmp`)

## last sweep

**2026-08-22** (issue 297). Evidence: `docs/log/reporting/2026/08/2026-08-22-report-swarm-297.md`.

Worktree GdUnit needs a class cache first (`Godot --headless --path . --import`). Then invoke the cmd tool **without** `runtest.sh -d`, or the debugger aborts on the first script error.

```bash
GODOT="/Applications/Godot_mono.app/Contents/MacOS/Godot"
"$GODOT" --headless --path . -s res://addons/gdUnit4/bin/GdUnitCmdTool.gd \
  --add res://tests --ignoreHeadlessMode \
  -rd docs/log/reports
```

That sweep: **831** GdUnit cases, **17** errors, **21** failures, exit 100. `dotnet test` **657** passed.

## driving conventions

- start from the slice file, not from memory
- prefer C# pure tests for `simulation/**` rules
- prefer GdUnit4 / headless for scenes, signals, UI banners
- never claim PASS because docs exist
- report BLOCKED with the missing path when scaffold is partial
- `docs/reference/game/` is design doctrine, not the engine project root

## slices

| id | file | docs SoT (primary) | status |
| ---- | ------ | -------------------- | -------- |
| day-night | [day-night.md](./day-night.md) | `docs/reference/game/loop/day-night-loop.md` | PASS 2026-08-22 |
| crops-turnip | [crops-turnip.md](./crops-turnip.md) | `docs/reference/game/farming/crops-and-farming.md` | PASS 2026-08-22 |
| defense-lane | [defense-lane.md](./defense-lane.md) | `docs/reference/game/defense/defense-night.md` | FAIL 2026-08-22 |
| home-fail | [home-fail.md](./home-fail.md) | `docs/reference/game/defense/home-and-fail.md` | PASS 2026-08-22 |
| player-move | [player-move.md](./player-move.md) | `docs/reference/game/player/player-and-camera.md` | PASS 2026-08-22 |
| inventory-hotbar | [inventory-hotbar.md](./inventory-hotbar.md) | ADR 0003 | PASS 2026-08-22 |
| tools-underfoot | [tools-underfoot.md](./tools-underfoot.md) | ADR 0003 | PASS 2026-08-22 |
| farm-cell-till-harvest | [farm-cell-till-harvest.md](./farm-cell-till-harvest.md) | `docs/reference/game/farming/crops-and-farming.md` | PASS 2026-08-22 |
| walk-in-home | [walk-in-home.md](./walk-in-home.md) | ADR 0003 | PASS 2026-08-22 |
| fail-banner-restart | [fail-banner-restart.md](./fail-banner-restart.md) | `docs/reference/game/defense/home-and-fail.md` | PASS 2026-08-22 |
| crew-follow | [crew-follow.md](./crew-follow.md) | `docs/reference/game/player/ai-crew.md` | PASS 2026-08-22 |
| homestead-procgen | [homestead-procgen.md](./homestead-procgen.md) | phase-3-new-game-procgen.md | PASS 2026-08-22 |
| water-tile | [water-tile.md](./water-tile.md) | `docs/reference/world/environment/ground/water_tile/design.md` | PASS 2026-08-22 |

## status legend

- **NOT_RUNNABLE** — doctor failed this run (missing project/build/tests)
- **BLOCKED** — project boots but this slice’s path/tests missing
- **NEEDS_REVERIFY** — runtime exists; slice status not proven this pass
- **PASS / FAIL** — ran real commands; see evidence dir

## extending

when slice commands or status change, update the slice file + this table and read [`../references/harness.md`](../references/harness.md). keep upkeep via `/maintain-verification-skill`.
