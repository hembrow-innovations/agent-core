# player-move

VS solo fox control: planar move, dash+energy, elevated third-person follow camera, proximity interact seam (crops/defense help share the body).

## intent

prove fox motor reads move input, displaces on XZ (or project ground plane), camera follows at doctrine framing, and interact reaches nearby farm targets without crew-swap UI in VS.

## docs SoT

- primary: `docs/reference/game/player/player-and-camera.md`
- related: `docs/reference/game/player/animal-stats.md`, `docs/reference/game/presentation/feel-and-presentation.md`, `docs/reference/adr/0001-vertical-slice-product-lock.md` (fox only)
- planning unlock: player locomotion / input / FarmYard (map historical `006`, `009`, `012`)

## happy path (human / agent)

1. doctor + build
2. pure tests: move math / accel-decel given input vectors
3. pure tests: dash consumes energy and refuses when empty
4. optional GdUnit/headless: FarmYard spawn, input smoke, camera not free-look combat orbit
5. confirm no crew-swap default on VS path

## observables / assertions

- one controllable body (fox); no co-op seat
- move changes position along input; stop when input zero (within damping)
- camera remains elevated third-person farm framing (~60° doctrine)
- interact prompt only in range (when interact wired)
- rock, tree, and water cells block `move_and_slide` (GdUnit `yard_blocker_collision_test.gd`)
- Demo solo-swap is **out of scope** for this VS slice

## verify commands (when scaffolded)

```bash
dotnet build LittlepawFarmAndFortify.csproj -c Debug
dotnet test LittlepawFarmAndFortify.csproj -c Debug --filter FullyQualifiedName~TopDownLocomotion
dotnet test LittlepawFarmAndFortify.csproj -c Debug --filter FullyQualifiedName~DashEnergy
dotnet test LittlepawFarmAndFortify.csproj -c Debug --filter FullyQualifiedName~ThirdPerson
GODOT="/Applications/Godot_mono.app/Contents/MacOS/Godot"
"$GODOT" --headless --path . --quit-after 2
# GdUnit4: res://tests/entities/player/soft_loco_bounds_smoke_test.gd
# GdUnit4: res://tests/scenes/levels/farm_yard/yard_blocker_collision_test.gd
```

## current status

**PASS** (2026-08-22) — yard blockers: `yard_blocker_collision_test.gd` 4/4 (empty ground walkable; rock, tree, water block). Headless boot exit 0. Evidence `docs/log/reporting/2026/08/2026-08-22-report-verify-yard-blockers.md`. Prior loco/dash/camera sweep remains in `docs/log/reporting/2026/08/2026-08-22-report-swarm-297.md`.
