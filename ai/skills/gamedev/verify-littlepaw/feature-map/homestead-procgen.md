# homestead-procgen

New-game homestead layout: fixed hub and south lane, random dress under water-mass and tree-grove rules.

## intent

Prove a seeded generate keeps the starting yard dry, paints water as solid ponds, and scatters more trees in groves plus singles.

## docs SoT

- primary: `docs/planning/plans/post-256-farm-freedom-and-feel/phase-3-new-game-procgen.md`
- related: ADR 0003, issue 389
- planning: issue 281 (closed), issue 389

## happy path (human / agent)

1. doctor + build
2. pure `HomesteadProcgenTest`
3. headless boot (yard constructs from `RunSession` seed)

## observables / assertions

- same seed yields the same terrain fingerprint
- no water inside 15 cells of the hub centre
- every water cell has an orthogonal water neighbour
- every 4-connected water mass has at least 4 cells
- tree count is at least 40
- the seed set includes both a grove and a singleton
- hub and south lane stay walkable path

## verify commands

```bash
dotnet test LittlepawFarmAndFortify.csproj -c Debug --filter HomesteadProcgenTest
GODOT="/Applications/Godot_mono.app/Contents/MacOS/Godot"
"$GODOT" --headless --path . --quit-after 2
```

## current status

**PASS** (2026-08-22) — `HomesteadProcgenTest` 16/16. Headless boot exit 0. Evidence `docs/log/reporting/2026/08/2026-08-22-report-verify-homestead-procgen.md`.
