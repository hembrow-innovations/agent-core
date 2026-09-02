# farm-cell-till-harvest

freedom-day freeform farm cell: hoe till → plant → water → harvest on a grass cell, no fixed 3-plot bed.

## intent

prove a player-selected tool loop on an open grass cell deposits farm stock and that two cells stay independent. Overlaps `crops-turnip` on the stage machine; this slice is the lived tool path.

## docs SoT

- primary: `docs/reference/game/farming/crops-and-farming.md`
- related: ADR 0003, `docs/reference/guides/use-tool-session.md`
- planning: issue 284 (closed), issue 387 (closed)

## happy path (human / agent)

1. doctor + build
2. pure `FarmCellFieldTest` multi-cell hoe→plant→water→advance→harvest
3. GdUnit `crop_plot_yard_test.gd`: no starter plots, tool till→harvest deposits stock, multi-cell independence

## observables / assertions

- yard starts with zero fixed crop plots
- hoe then seed then water then harvest on one grass cell deposits stock
- hoe recolors the existing chunk cell. SoilBed stays hidden. Farm-cell view sits at y 0
- a second cell does not inherit the first cell’s stage
- harvest goes through the tool session, not a plot interact leftover

## verify commands

```bash
dotnet test LittlepawFarmAndFortify.csproj -c Debug --filter FullyQualifiedName~FarmCell
GODOT="/Applications/Godot_mono.app/Contents/MacOS/Godot"
"$GODOT" --headless --path . -s res://addons/gdUnit4/bin/GdUnitCmdTool.gd \
  --add res://tests/entities/crop_plot/crop_plot_yard_test.gd --ignoreHeadlessMode \
  -rd docs/log/reports
```

## current status

**PASS** (2026-08-22) — `FarmCellFieldTest` 6/6; GdUnit `crop_plot_yard_test.gd` 4/4 including hidden SoilBed at y 0 after hoe. Evidence `docs/log/reporting/2026/08/2026-08-22-report-verify-hoe-tills-chunk-cell.md`.
