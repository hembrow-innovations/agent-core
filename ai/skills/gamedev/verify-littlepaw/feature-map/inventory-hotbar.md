# inventory-hotbar

freedom-day bag: hotbar 5 + backpack 10, keys 1–5 select, I toggles bag, E stays world interact.

## intent

prove the yard builds an inventory bridge with the starting loadout on the hotbar, slot select works, backpack open/close works, and interact stays on the motor.

## docs SoT

- primary: `docs/reference/adr/0003-homestead-freedom-product-lock.md`
- related: `docs/reference/game/farming/farm-stock-economy.md`, `CONTEXT.md` (Inventory ↔ FarmStock join)
- planning: issue 282 (closed)

## happy path (human / agent)

1. doctor + build
2. pure tests: `InventoryTest` cap, hotbar, backpack move
3. GdUnit `inventory_hud_test.gd`: hotbar select, backpack toggle, move axe into bag, HUD shells present
4. confirm E is not rebound to backpack

## observables / assertions

- hotbar 5 slots; backpack 10
- starting axe on hotbar 0 after yard ready
- `select_hotbar_slot` changes selected index
- backpack starts closed; toggle opens and closes
- player motor still owns `interact`

## verify commands

```bash
dotnet test LittlepawFarmAndFortify.csproj -c Debug --filter FullyQualifiedName~Inventory
GODOT="/Applications/Godot_mono.app/Contents/MacOS/Godot"
"$GODOT" --headless --path . -s res://addons/gdUnit4/bin/GdUnitCmdTool.gd \
  --add res://tests/ui/hud/inventory_hud_test.gd --ignoreHeadlessMode \
  -rd docs/log/reports
```

## current status

**PASS** (2026-08-22) — `Inventory*` 13/13; GdUnit `inventory_hud_test.gd` 2/2. Evidence `docs/log/reporting/2026/08/2026-08-22-report-swarm-297.md`.
