# tools-underfoot

freedom-day starting tools and cell-prop use: axe, hammer, hoe, watering can, season seed pack. Play applies the selected tool through AimedToolUse on the hovered in-range cell.

## intent

prove the yard grants the ADR 0003 starting loadout, cell props spawn on the grid, and play tool use goes through AimedToolUse → `ToolSession.use_at_world` rather than a yard id switch or E-miss.

## docs SoT

- primary: `docs/reference/adr/0003-homestead-freedom-product-lock.md`
- related: `docs/reference/guides/use-tool-session.md`, `CONTEXT.md` (tool session)
- planning: issue 283 (closed)

## happy path (human / agent)

1. doctor + build
2. pure tests: `ToolActionTest`, `CellPropFieldTest`
3. GdUnit `tools_cell_props_yard_test.gd`: hotbar ids 10–13 and 20, props spawned, AimedToolUse child, session method present

## observables / assertions

- hotbar 0–4 is Axe, Hammer, Hoe, WateringCan, SeedPack
- seed pack count is 12 at start
- homestead grid PropCount greater than 0
- `CellProps` has children
- yard has child `AimedToolUse`
- motor source does not contain `cell_tool_use`
- yard `get_tool_session` exposes `use_at_world`

## verify commands

```bash
dotnet test LittlepawFarmAndFortify.csproj -c Debug --filter FullyQualifiedName~ToolAim
dotnet test LittlepawFarmAndFortify.csproj -c Debug --filter FullyQualifiedName~ToolAction
dotnet test LittlepawFarmAndFortify.csproj -c Debug --filter FullyQualifiedName~CellProp
GODOT="/Applications/Godot_mono.app/Contents/MacOS/Godot"
"$GODOT" --headless --path . -s res://addons/gdUnit4/bin/GdUnitCmdTool.gd \
  --add res://tests/scenes/levels/farm_yard/tools_cell_props_yard_test.gd --ignoreHeadlessMode \
  -rd docs/log/reports
```

## current status

**PASS** (2026-08-22) — `ToolAimTest` 8/8; `ToolActionTest` 13/13; `CellPropFieldTest` 2/2; GdUnit `tools_cell_props_yard_test.gd` 1/1 after AimedToolUse bind fix. Evidence `docs/log/reporting/2026/08/2026-08-22-report-verify-aimed-tool-use.md`.
