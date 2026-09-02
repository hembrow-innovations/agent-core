# harness — extending verify-littlepaw

practical notes for keeping this skill honest. parent instructions: `../SKILL.md`. map: `../feature-map/`.

## what “runnable” means

minimum surface at **repo root**:

```text
project.godot          # features: 4.7, C#, Forward Plus
*.csproj               # mono game + test hooks
simulation/            # C# pure rules (preferred proof home)
scenes/, entities/, tests/ as needed
addons/gdUnit4/        # optional but preferred for scene/signal suites
```

binary (this machine default):

```bash
GODOT="/Applications/Godot_mono.app/Contents/MacOS/Godot"
"$GODOT" --version   # expect 4.7.x mono
```

## doctor upgrades

doctor should require:

1. `project.godot` exists at repo root
2. `dotnet build LittlepawFarmAndFortify.csproj` exit 0
3. headless `--path . --quit-after 2` exit 0
4. at least one test target for `simulation/` / `tests/`
5. if claiming scene proof: gdunit addon **or** a named headless scene path in the slice file

flip slice `current status` only with command output in evidence.

## where to put proofs

| kind | home | good for |
| ------ | ------ | ---------- |
| C# pure | `simulation/**` + `dotnet test` | phases, crops, home HP, lane math |
| GdUnit4 | `tests/**` via `addons/gdUnit4/runtest.sh` | signals, UI, scene lifecycle |
| headless boot | `"$GODOT" --headless --path . --quit-after 2` | import/script smoke |
| editor MCP | Beckett etc. if running | visual-only checks |

prefer pure tests first (fast, deterministic). add gdunit when the bug is tree/signal shaped.

## updating a slice file

when a path becomes real:

1. set **current status** to the truth (BLOCKED until green once)
2. replace filter strings with **actual** test class/suite names
3. name the scene (`res://...`) used for smoke
4. list exact observables you can read (property paths, log lines, exit codes)
5. leave docs SoT paths stable unless design moved

## adding a new slice

1. new file under `feature-map/<id>.md` (same headings: intent, docs SoT, happy path, observables, commands, status)
2. link it from `feature-map/README.md` table
3. run `/verify-littlepaw <id>` once end-to-end before calling the map updated
4. optional: `/maintain-verification-skill` for a full pass

## isolation

- no shared editor play session with the human if you can avoid it
- human verify report in `docs/log/reporting/<YYYY>/<MM>/YYYY-MM-DD-report-verify-<slug>.md` (required before done)
- optional bulky command logs beside it under `docs/log/reporting/<YYYY>/<MM>/verify-<slug>/`
- GdUnit runner HTML stays in `docs/log/reports/` (`-rd`); that is not a substitute for the human report
- don’t `git clean` the runtime tree as “cleanup”
- one godot headless at a time if port/lock files fight you; serialize
- fresh worktree: run `Godot --headless --path . --import` so `GdUnitTestCIRunner` is in the class cache. `addons/gdUnit4/bin/` is gitignored. Copy those scripts from a checkout that already opened the editor.
- do not use `runtest.sh` `-d` in agent runs. The debugger stops on the first script error and aborts the suite. Invoke `res://addons/gdUnit4/bin/GdUnitCmdTool.gd` without `-d`.

## failure taxonomy

| status | meaning | next |
| -------- | --------- | ------ |
| NOT_RUNNABLE | no project/build | scaffold from docs + planning unit |
| BLOCKED | boots but slice path missing | implement residual issue; don’t skip map entry |
| FAIL | ran path, assertion missed | fix product or fix flaky harness |
| PASS | commands + observables green | attach `docs/log/reporting/...` path in PR/issue Answer |

## maintenance cadence

- any PR that changes user-visible loop behavior → touch the matching slice
- after first green VS smoke → run all five slices once and record in planning
- rot check: `/maintain-verification-skill` when commands in the map 404

## out of scope for this harness

- CI (repo is local-verify only)
- external Unity / Bevy paths
- paid asset gen as proof
- inventing balance numbers to make a test pass
