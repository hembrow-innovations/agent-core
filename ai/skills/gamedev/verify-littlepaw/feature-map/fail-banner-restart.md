# fail-banner-restart

freedom-day lose path: SoftFailBanner Retry restores the last VS checkpoint in memory; Quit flags the menu. Issue 293 is closed. Exercise the live path. Do not mark DEFERRED.

## intent

prove home HP to zero shows the banner, Retry applies `RetryNightApplied` and restores a playable home, and Quit requests the menu without treating Retry as a disk continuum slot.

## docs SoT

- primary: `docs/reference/game/defense/home-and-fail.md`
- related: ADR 0003, `CONTEXT.md` (fail continuum), issue 293 closed
- planning: `docs/planning/issues/closed/293-fail-restart-play-path.md`

## happy path (human / agent)

1. doctor + build
2. pure `FailRestartCheckpointTest` + `HomeFailPresentationTest`
3. GdUnit `soft_fail_banner_retry_test.gd`: banner actions, fail then retry, fail then quit

## observables / assertions

- banner exposes retry and quit actions
- `RunSession.fail_restart` is the play owner
- damage to max HP shows the fail banner
- `request_retry` returns `RetryNightApplied`, home is not destroyed, combat is unpaused
- quit path sets the menu flag without tearing the test tree

## verify commands

```bash
dotnet test LittlepawFarmAndFortify.csproj -c Debug --filter FullyQualifiedName~FailRestart
GODOT="/Applications/Godot_mono.app/Contents/MacOS/Godot"
"$GODOT" --headless --path . -s res://addons/gdUnit4/bin/GdUnitCmdTool.gd \
  --add res://tests/ui/banners/soft_fail_banner_retry_test.gd --ignoreHeadlessMode \
  -rd docs/log/reports
```

## current status

**PASS** (2026-08-22) — `FailRestartCheckpointTest` 6/6; GdUnit `soft_fail_banner_retry_test.gd` 3/3. Not DEFERRED. Evidence `docs/log/reporting/2026/08/2026-08-22-report-swarm-297.md`.
