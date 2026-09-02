# crops-turnip

VS sole crop: turnip stage machine (Empty→Planted→Growing→Ready), moisture, freeform farm cells via hoe/seeds/water/harvest tools.

## intent

prove one turnip definition drives independent grid farm cells through the stage machine; harvest yields stock; tools replace the fixed 3-plot bed.

## docs SoT

- primary: `docs/reference/game/farming/crops-and-farming.md`
- related: ADR 0003, `docs/planning/plans/post-256-farm-freedom-and-feel/phase-6-farm-cells.md`, farm-stock-economy
- planning: issue 284 (closed)

## happy path (human / agent)

1. doctor + `dotnet build`
2. pure tests: `FarmCellFieldTest` multi-cell hoe→plant→water→advance→harvest; `CropPlotTest` machine
3. optional GdUnit: `crop_plot_yard_test` tool loop deposits stock
4. confirm no fixed starter 3-plot bed; freeform cells only

## observables / assertions

- sole staple turnip; HarvestYield constant honored
- stage order enforced (no harvest from Empty)
- multi-cell independence on grid farm cells
- harvest deposits farm stock via tool path
- hoe rejects water/path/prop cells

## verify commands (when scaffolded)

```bash
dotnet build LittlepawFarmAndFortify.csproj -c Debug
dotnet test LittlepawFarmAndFortify.csproj -c Debug --filter FullyQualifiedName~FarmCell
dotnet test LittlepawFarmAndFortify.csproj -c Debug --filter FullyQualifiedName~CropPlot
GODOT="/Applications/Godot_mono.app/Contents/MacOS/Godot"
"$GODOT" --headless --path . --quit-after 2
# GdUnit4: res://tests/entities/crop_plot/crop_plot_yard_test.gd
```

## current status

**PASS** (2026-08-22) — `FarmCellFieldTest` 6/6; `CropPlot*` 20/20; GdUnit `crop_plot_yard_test.gd` 4/4; headless boot exit 0. Full `dotnet test` 657. Evidence `docs/log/reporting/2026/08/2026-08-22-report-swarm-297.md`.
