---
name: verify-littlepaw
description: >
  Prove Littlepaw Farm & Fortify Godot features on the real runtime path — headless boot, C#
  sim tests, GdUnit4 when present. Use for /verify-littlepaw, before claiming done on runtime
  work, or when a feature-map slice needs evidence.
---

# verify-littlepaw

Project-local verification skill for this repo.

**engine:** Godot `4.7.2.stable.mono.official` (Forward+ mono only)  
**surface:** repo root Godot project (C# `simulation/` + GDScript scene/UI glue)  
**map:** [`feature-map/`](feature-map/) — one file per VS slice  
**harness notes:** [`references/harness.md`](references/harness.md)

Missing `project.godot` or a failed doctor is **not** green. Report honestly.

## when to run

- after any change under runtime trees (`simulation/`, `entities/`, `scenes/`, `ui/`, `core/`, `tests/`, `project.godot`, `.csproj`)
- before “done” / merge-ready on a planning unit that touches runtime
- when heio-slice / prove-it-works asks for evidence

## 1. load the feature map

1. read [`feature-map/README.md`](feature-map/README.md)
2. open the slice file named by the user or matching the unit (`day-night`, `crops-turnip`, `defense-lane`, `home-fail`, `player-move`)
3. follow that file’s happy path + observables — do not invent alternate entry points

if the slice is missing: stop and add it via `/maintain-verification-skill` (or extend the map), don’t freestyle.

## 2. doctor — is the Godot project runnable?

from repo root:

```bash
# godot project marker
test -f project.godot

# mono pin (soft check — config/features should mention 4.7 + C#)
grep -E '4\.7|C#' project.godot || true

# csproj present?
ls *.csproj 2>/dev/null || true

# gdunit addon?
test -d addons/gdUnit4 && echo GDUNIT=yes || echo GDUNIT=no
```

### missing project → NOT_RUNNABLE

if `project.godot` is missing or there is no buildable surface:

1. **stop.** do not fake pass.
2. report status: **`NOT_RUNNABLE`**
3. list which docs + planning units unlock scaffold (see below)
4. still confirm the feature-map file + docs SoT exist for the slice under test

**unlock scaffold (docs already lead):**

| need | docs SoT | planning entry points |
| ------ | ---------- | ------------------------ |
| godot project shell | `docs/reference/architecture/runtime-layout.md`, `docs/reference/standards/eng-conventions.md` | `docs/planning/map.md` |
| day/night loop | `docs/reference/game/loop/day-night-loop.md` | map bullets / issues covering phase driver |
| player move | `docs/reference/game/player/player-and-camera.md` | player locomotion / FarmYard issues |
| turnip crops | `docs/reference/game/farming/crops-and-farming.md` | crop plot stage machine issues |
| defense lane | `docs/reference/game/defense/defense-night.md`, `docs/reference/game/defense/dusk-deploy.md` | lane + tower + night session issues |
| home fail | `docs/reference/game/defense/home-and-fail.md` | home HP + fail presentation issues |

claim one `docs/planning/issues/*` unit; implement at repo root; re-run this skill.

## 3. launch / verify paths (when project exists)

set once per shell:

```bash
GODOT="/Applications/Godot_mono.app/Contents/MacOS/Godot"
# override if your binary differs; mono build required
```

run from repo root unless noted. prefer the **narrowest** path that covers the slice.

### A. C# compile smoke

```bash
dotnet build LittlepawFarmAndFortify.csproj -c Debug
```

fail → fix compile before any runtime claim.

### B. headless project boot

```bash
"$GODOT" --headless --path . --quit-after 2
```

expect clean exit (no script parse bombs on boot). capture stderr.

### C. C# pure tests (`simulation/`)

when tests exist for pure rules:

```bash
dotnet test LittlepawFarmAndFortify.csproj -c Debug
# or filter: dotnet test LittlepawFarmAndFortify.csproj -c Debug --filter FullyQualifiedName~Simulation
```

prefer this for day-night phase math, crop stages, home HP, lane engagement — anything without the scene tree.

### D. GdUnit4 (scenes / signals)

only if `addons/gdUnit4` is present:

```bash
./addons/gdUnit4/runtest.sh --godot_binary "$GODOT" \
  --add res://tests --ignoreHeadlessMode \
  -rd docs/log/reports
```

adjust `--add` to the suite path the slice names.

### E. optional editor / MCP

if Beckett (or equivalent) is running against this project: play the scene the feature-map names, screenshot / remote-tree for UI-only observables. not required when pure + headless already prove the slice.

## 4. drive one mapped feature

1. pick **one** feature-map file
2. execute its happy path with the harness above (pure test names, gdunit suite, or headless scene)
3. check every observable/assertion listed
4. if a step is blocked by missing code: **NOT_RUNNABLE** or **BLOCKED** with the missing path — never “pass” on docs alone

## 5. evidence (vault path — required)

**Do not leave the human report in `/tmp`.** History lives in the docs vault.

| Artifact | Path |
| ---------- | ------ |
| Human report (required) | `docs/log/reporting/<YYYY>/<MM>/YYYY-MM-DD-report-verify-<slug>.md` |
| Optional bulky logs | same folder, sibling dir `verify-<slug>/` (build/headless/tests logs) |
| GdUnit HTML/XML only | `docs/log/reports/` via runner `-rd` (gitignored; not the human report) |

```bash
STAMP=$(date +%Y-%m-%d)
YM=$(date +%Y/%m)
SLUG=<slice-or-unit-slug>   # e.g. game-bind-302-380, day-night
REPORT_DIR="docs/log/reporting/${YM}"
LOG_DIR="${REPORT_DIR}/verify-${SLUG}"
mkdir -p "$LOG_DIR"
# write command logs into $LOG_DIR/
# write the human report to:
#   ${REPORT_DIR}/${STAMP}-report-verify-${SLUG}.md
```

Report body (minimum):

```markdown
# {STAMP} report — verify {slug}

## Summary
status + one-paragraph outcome

## Commands
exact commands + exit codes

## Observables
pass/fail list from the feature-map slice

## Evidence paths
links to LOG_DIR files if any
```

proof standards:

- real path (boot / tests / scene), not “i read the doc”
- action + resulting state
- mocks only at true external boundaries (none for core VS loop)
- cite `docs/log/reporting/...` in the chat reply and in issue Answers

## 6. cleanup

- keep the reporting markdown (and optional `verify-<slug>/` logs) in the vault
- kill only godot/dotnet processes **you** started
- do not delete runtime trees or fixtures you didn’t create
- `/tmp` is fine for scratch mid-run; **promote** the report before claiming done

## 7. report shape

```text
slice: <id>
status: PASS | FAIL | BLOCKED | NOT_RUNNABLE
commands: ...
observables: ok/fail list
evidence: docs/log/reporting/<YYYY>/<MM>/YYYY-MM-DD-report-verify-<slug>.md
unlock: <docs/planning if NOT_RUNNABLE>
```

## gotchas

- pin is **4.7.2 mono** — non-mono godot will lie about C#
- doctor first every time
- map lives at `feature-map/` (this skill), not under `docs/`
- no CI — local verify only
- keep hybrid split: prove sim in C# pure tests; prove glue with gdunit/headless
- `docs/reference/game/` is design doctrine, not the Godot project root
