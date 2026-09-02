# day-night

phase spine for the dual loop: Day → DuskDeploy → Night → DawnResolve, with illegal skips rejected and a 3-night VS terminal.

## intent

prove the calendar/phase driver advances one legal step at a time, refuses Day→Night skips, and ends the slice after night 3 win path (no multi-season calendar in VS).

## docs SoT

- primary: `docs/reference/game/loop/day-night-loop.md`
- related: `docs/reference/game/loop/day-weather.md`, `docs/reference/adr/0001-vertical-slice-product-lock.md`
- planning unlock: `docs/planning/map.md` (phase driver / issue family historically `005`+)

## happy path (human / agent)

1. doctor repo root (`project.godot` + build)
2. run C# pure tests for phase advance / reject illegal transition
3. optional: headless boot, then scene/GdUnit that TryAdvance through one full cycle
4. optional: night 1→2→3 counter reaches VS terminal without season system

## observables / assertions

- ordered phases only; illegal skip returns reject / no state change
- night counter + day index stub behave per docs (3-night VS)
- no free skip Day→Night
- weather (if present) does not invent seasons calendar
- headless boot clean if scene wires phase driver

## verify commands (when scaffolded)

```bash
dotnet build LittlepawFarmAndFortify.csproj -c Debug
dotnet test LittlepawFarmAndFortify.csproj -c Debug --filter FullyQualifiedName~DayNightLoop
dotnet test LittlepawFarmAndFortify.csproj -c Debug --filter FullyQualifiedName~DayWeather
GODOT="/Applications/Godot_mono.app/Contents/MacOS/Godot"
"$GODOT" --headless --path . --quit-after 2
# GdUnit4: res://tests/core/phase_audio_bed_test.gd
```

## current status

**PASS** (2026-08-22) — `DayNightLoopTest` 15/15; `DayWeatherStubTest` 5/5; headless boot exit 0; GdUnit `phase_audio_bed_test.gd` 3/3. Full `dotnet test` 657 passed. Evidence `docs/log/reporting/2026/08/2026-08-22-report-swarm-297.md`.
