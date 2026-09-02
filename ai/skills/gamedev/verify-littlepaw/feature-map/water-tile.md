# water-tile

Homestead pond kit on chunk ground: fill, edge, corner, channel, and cap.

## intent

Prove water cells instance `water_tile.glb` children from `WaterShore`, not the pad box, and that walk blockers still stop the player.

## docs SoT

- primary: `docs/reference/world/environment/ground/water_tile/design.md`
- related: `docs/reference/architecture/farm-yard-composition.md`
- planning: issue 390

## happy path (human / agent)

1. doctor + build
2. pure `WaterShoreTest`
3. GdUnit `chunk_ground_smoke_test.gd` and `yard_blocker_collision_test.gd`
4. headless boot

## observables / assertions

- classify covers all 16 neighbor masks
- a 2×2 pond is four corners
- a radius-2 disk tip is a cap
- a 3×3 center is fill
- `water_instance_count() > 0` and the water stream mesh is not a BoxMesh
- `chunk_count() == 25`
- no leftover MeshInstance3D
- `Chunks/WaterBlockers` still blocks the player

## verify commands

```bash
dotnet test LittlepawFarmAndFortify.csproj -c Debug --filter WaterShoreTest
GODOT="/Applications/Godot_mono.app/Contents/MacOS/Godot"
"$GODOT" --headless --path . --quit-after 2
./addons/gdUnit4/runtest.sh --godot_binary "$GODOT" \
  --add res://tests/scenes/levels/farm_yard/chunk_ground_smoke_test.gd \
  --add res://tests/scenes/levels/farm_yard/yard_blocker_collision_test.gd \
  --ignoreHeadlessMode \
  -rd docs/log/reports
```

## current status

**PASS** (2026-08-22) — `WaterShoreTest` 9/9. GdUnit report_79 10/10. Headless boot exit 0. Evidence `docs/log/reporting/2026/08/2026-08-22-report-verify-390-water-tile.md`.
