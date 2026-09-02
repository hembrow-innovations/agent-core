# walk-in-home

freedom-day crew home: shut door blocks, open door lets the fox walk in, roof fades, home stays the sole lose entity.

## intent

prove the walk-in house is still in the runtime. Door interact toggles collision. Capsule clears the open lintel. Interior kit exists. HP fail is still this one building.

## docs SoT

- primary: `docs/reference/adr/0003-homestead-freedom-product-lock.md`
- related: `docs/reference/game/defense/home-and-fail.md`, `CONTEXT.md` (crew home / home shell)
- planning: issue 286 (closed)

## happy path (human / agent)

1. doctor + build
2. GdUnit `home_walk_in_test.gd`: standing root, door toggle, interior, roof fade, sole lose, door in interact candidates

## observables / assertions

- player feet on ground; head below door height; capsule narrower than door
- shut door blocks; `try_interact` opens and disables door collision
- open doorway physics probe reaches a point inside the home
- kitchen / crew beds present
- roof fade near and inside
- walk-in home is still the sole lose entity

## verify commands

```bash
GODOT="/Applications/Godot_mono.app/Contents/MacOS/Godot"
"$GODOT" --headless --path . -s res://addons/gdUnit4/bin/GdUnitCmdTool.gd \
  --add res://tests/entities/home/home_walk_in_test.gd --ignoreHeadlessMode \
  -rd docs/log/reports
```

## current status

**PASS** (2026-08-22) — GdUnit `home_walk_in_test.gd` 6/6. Evidence `docs/log/reporting/2026/08/2026-08-22-report-swarm-297.md`.
