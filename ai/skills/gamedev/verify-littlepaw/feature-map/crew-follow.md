# crew-follow

VS cat/dog/rabbit stubs follow the fox on distinct slots and do not occupy one point.

## intent

prove day soft-follow uses a per-stub slot behind the player, and crew capsules keep two bodies from sharing a point.

## docs SoT

- primary: `docs/reference/game/player/ai-crew.md`
- related: `docs/reference/adr/0001-vertical-slice-product-lock.md`

## happy path (human / agent)

1. doctor + build
2. pure tests: shared leash collapses; slot follow stays separated
3. GdUnit: three companions stay apart while the player walks; same-slot capsules do not merge

## observables / assertions

- three distinct species stubs on the yard
- moving follow does not collapse all three onto one point
- pairwise planar distance stays above capsule contact
- fox remains the only controllable body

## verify commands (when scaffolded)

```bash
dotnet build LittlepawFarmAndFortify.csproj -c Debug
dotnet test LittlepawFarmAndFortify.csproj -c Debug --filter FullyQualifiedName~CrewRosterTest.SoftFollow
GODOT="/Applications/Godot_mono.app/Contents/MacOS/Godot"
"$GODOT" --headless --path . --quit-after 2
# GdUnit4: res://tests/entities/crew/crew_follow_separation_test.gd
# GdUnit4: res://tests/entities/player/character_presentation_291_test.gd
```

## current status

**PASS** (2026-08-22) — slot follow keeps three crew apart. Capsules on the same slot do not merge. Evidence `docs/log/reporting/2026/08/2026-08-22-report-verify-crew-follow.md`.
