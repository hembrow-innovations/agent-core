# defense-lane

VS night TD: single approach lane, dusk place/confirm towers, waves of crop-eater threats, towers engage; player is gap-plugger not a second lose bar.

## intent

prove one lane + loadout rebuild into night session; threats path and take damage from scarecrow mortar / bee hive stubs; wave clear / session complete signals; home leak is separate slice (`home-fail`).

## docs SoT

- primary: `docs/reference/game/defense/defense-night.md`
- related: `docs/reference/game/defense/dusk-deploy.md`, `docs/reference/game/defense/tower-archetype-catalog.md`, `docs/reference/world/entities/enemies/vertical_slice/crop_eater/`
- planning unlock: defense / dusk / wave issues (map historical `008`, `014`, `031`, `032`)

## happy path (human / agent)

1. doctor + build
2. pure tests: ApproachLane engagement, tower AoE/DoT stubs vs DummyThreat
3. dusk: place/confirm default sockets → night session rebuilds from loadout
4. night: spawn trickle, kill or leak; wave-cleared / session-complete as designed
5. optional headless/GdUnit FarmYard night smoke

## observables / assertions

- **1 lane** in VS (no multi-lane default)
- towers auto-fight; player help optional for this slice
- threat death removes pressure; leak hands damage to home system (assert hook exists, full fail in `home-fail`)
- dusk confirm required before night loadout sticks
- crop_eater / dummy body readable when mesh wired

## verify commands (when scaffolded)

```bash
dotnet build LittlepawFarmAndFortify.csproj -c Debug
dotnet test LittlepawFarmAndFortify.csproj -c Debug --filter FullyQualifiedName~SouthLane
dotnet test LittlepawFarmAndFortify.csproj -c Debug --filter FullyQualifiedName~NightDefense
dotnet test LittlepawFarmAndFortify.csproj -c Debug --filter FullyQualifiedName~DuskDeploy
GODOT="/Applications/Godot_mono.app/Contents/MacOS/Godot"
"$GODOT" --headless --path . --quit-after 2
# GdUnit4: res://tests/scenes/levels/farm_yard/south_lane_night_yard_test.gd
```

## current status

**PASS** (2026-08-22) — C# green: SouthLane + NightDefense + DuskDeploy 43/43, headless boot exit 0. GdUnit `south_lane_night_yard_test.gd` 4/4 after the test reads `Marker3D` waypoints only (`LaneVisual` is dress). Dusk chip getter restored. Full suite 905 cases, 0 failures, 32 dated skips for unmounted place-drivers. Evidence `docs/log/reporting/2026/08/2026-08-22-report-verify-385.md`.
