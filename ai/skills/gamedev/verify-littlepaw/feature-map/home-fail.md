# home-fail

main-home single HP pool is the only run-ending fail; warning bands; lose presentation; VS restart hooks (retry night/run/quit).

## intent

prove leak/damage reduces one home pool, bands expose warning state, HP→0 trips fail presentation and pauses combat; restart restores checkpoint book without a second lose entity.

## docs SoT

- primary: `docs/reference/game/defense/home-and-fail.md`
- related: `docs/reference/game/presentation/feel-and-presentation.md`, `docs/reference/game/loop/day-night-loop.md`, `docs/reference/ui/` fail banner mocks
- planning unlock: home HP / fail presentation / restart (map historical `016`, `019`, `021`, `023`)

## happy path (human / agent)

1. doctor + build
2. pure tests: damage channels → bands → `IsRunFailed` at zero
3. pure tests: fail presentation trip (combat pause flag / banner state)
4. pure tests: FailRestartService retry night vs retry run vs quit stub
5. optional GdUnit: banner visible, home snuff, menu quit path

## observables / assertions

- only main home ends the run (fences/crops/crew KO do not)
- warning thresholds fire before zero
- fail presentation is cute-spooky, not a second HP bar on the player
- retry paths restore home+loop from checkpoint book
- no free full heal at dawn (per docs)

## verify commands (when scaffolded)

```bash
dotnet build LittlepawFarmAndFortify.csproj -c Debug
dotnet test LittlepawFarmAndFortify.csproj -c Debug --filter FullyQualifiedName~HomeHp
dotnet test LittlepawFarmAndFortify.csproj -c Debug --filter FullyQualifiedName~HomeFail
dotnet test LittlepawFarmAndFortify.csproj -c Debug --filter FullyQualifiedName~FailRestart
GODOT="/Applications/Godot_mono.app/Contents/MacOS/Godot"
"$GODOT" --headless --path . --quit-after 2
# GdUnit4: res://tests/entities/home/home_yard_test.gd
```

## current status

**PASS** (2026-08-22) — `HomeHpTest` 19/19; `HomeFailPresentationTest` 9/9; `FailRestartCheckpointTest` 6/6; GdUnit `home_yard_test.gd` 4/4; headless boot exit 0. Live banner retry is the `fail-banner-restart` slice. Evidence `docs/log/reporting/2026/08/2026-08-22-report-swarm-297.md`.
