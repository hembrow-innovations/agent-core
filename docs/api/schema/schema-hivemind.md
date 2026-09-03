---
id: "schema-hivemind"
title: "Hivemind YAML schema"
kind: schema
description: "Fields for .hivemind/hivemind.yaml. Full file. No overlay. Fail-closed unknown keys."
domain: hivemind
area: api
tags: [schema, hivemind]
source: ".hivemind/hivemind.yaml"
created_at: "2026-09-01"
updated_at: "2026-09-03"
---

# Hivemind YAML schema

Runtime reads **`.hivemind/hivemind.yaml` only**. Missing file is fatal. A project-root `hivemind.yaml` is not read. Unknown top-level keys fail closed. The profile template at `profiles/<name>/hivemind.yaml` is install-time only ([[0016-profiles-are-directories]], [[0018-hivemind-independent-lanes]]).

## Fields

- **`history`**: optional project-relative path. Append-only TSV of supervisor actions (`scan`, `quarantine`, `skip`, `claim`, `spawn`, `exit`). Absent → no file. Events still print one line each to stderr. Values from `{{env.NAME}}` are never written.

- **`watch`**: optional list of project-relative globs or directories the supervisor may scan. If omitted, the engine scans every `folders` path. Discovery is this list, not “AI finds files.”

- **`folders`**: required list of typed folders. Each entry:

  - **`path`**: project-relative directory (`.heio/tickets`, `.heio/quarantine`, …).
  - **`schema`**: name of the per-folder front-matter schema the engine loads from the Hivemind tree (or an inline map). Unknown keys on a note in that folder are a fault.
  - **`required`**: list of required front-matter keys. Missing required key with no documented default is a fault.

- **`actors`**: optional map of reusable spawn identities. Also loaded from `.hivemind/actors/*.yaml` (and `*.yml`). A file with top-level `cmd` is one actor named by the filename stem. Otherwise the file is a map of named actors. Duplicate names across files fail. The `actors:` map in `.hivemind/hivemind.yaml` overlays file actors of the same name. Actor fields:

  - **`cmd`**: optional string or string list. Required after merge onto a `single` lane or pipeline stage.
  - **`agent`**: optional string. Exposed as `{{agent}}`.
  - **`prompt`**: optional project-relative path. Exposed as `{{prompt}}`.
  - **`scope`** / **`exclusive`**: optional path lists. Same equality rule as lanes.
  - **`claim-status`**: optional string. Required after merge onto a lane.
  - Extra string keys become interpolation scalars (`mint-status`, …).

- **`lanes`**: required map keyed by lane id. Empty map `{}` is legal (supervisor never spawns). A list is illegal. Each entry:

  - **`type`**: required. `single` or `pipeline`. Unknown types fail closed.
  - **`concurrency`**: optional positive integer. Max live runs of this lane. Default `1`. `0` is illegal. Lanes do not share seats.
  - **`actor`**: optional name of an actor. Lane fields override the actor after merge.
  - **`cmd`**: string or string list. Required on `single` after actor merge. Illegal as the only spawn on a pipeline; stages hold cmd.
  - **`agent`**: optional string. Exposed as `{{agent}}`.
  - **`prompt`**: optional project-relative path. Exposed as `{{prompt}}`. Missing file at spawn is a skip; do not spawn.
  - **`trigger`**: required map of front-matter predicates. All listed keys must match the candidate file (`kind`, `status`, …). Values are exact. Status strings are pack-defined, not core enums.
  - **`need`**: optional extra predicates already true before spawn (example: sealed spec + EXPECT present). Fail `need` → skip, do not fault the file.
  - **`scope`**: optional list of project-relative path prefixes this run may intend to write. Passed as `{{exclusive}}` (joined) when the template asks. Core does not audit writes in v1. Two live runs whose declared `scope`/`exclusive` sets overlap are not spawned together.
  - **`exclusive`**: optional path list. Alias of `scope`; if both appear they must be equal or the file is illegal.
  - **`backoff`**: optional duration string (`30s`). Sleep on a quiet watch scan. `0` means retry on the next scan with no extra sleep.
  - **`cooldown`**: optional duration string. After a run of this lane finishes, skip new matches until it elapses.
  - **`claim-status`**: required string after actor merge. Front-matter `status` written on CAS before spawn.
  - **`mint-status`**: optional extra scalar. Only meaningful if this lane creates tickets (user-written Review). Default in the heio-stack template is `ready-for-human`.
  - **`stages`**: required on `type: pipeline`. Ordered list. Each entry has `stage` (id unique in the pipeline) plus spawn fields (`cmd` / `actor` / `agent` / `prompt` / `scope` / `exclusive` / `claim-status`). Extra string keys become interpolation scalars. Pipeline `cmd` / `actor` are defaults for stages that omit them. Claim once, then run stages as sequential children. Non-zero exit stops remaining stages. The pipeline occupies one of this lane's concurrency seats for the whole chain.

- **`disable`**: optional list of lane ids to ignore even if present in `lanes`. Unknown ids are unused. Filtered at run, not parse. For templates that include Mint.

There is no top-level `concurrency`. That key is unknown and fails closed.

Placeholders in `cmd` (double braces only):

- **`{{agent}}`**, **`{{prompt}}`**, **`{{cwd}}`**, **`{{exclusive}}`**, **`{{lane}}`**, **`{{stage}}`** (pipeline stages)
- **`{{env.NAME}}`**: `process.env.NAME`. Missing or empty → do not spawn. Values are never logged.
- Lane fields of scalar string type may be referenced by name. Unknown `{{name}}` fail closed. Leftover `{{` after interpolation fails closed.

## Constraints

- YAML subset follows [[schema-profile]] (no anchors, no block scalars, indentation nesting). Empty map `{}` is legal.
- `cmd` string form: interpolate, then split on whitespace with simple double/single quotes. Unmatched quotes fail closed. YAML list form skips the splitter.
- No `$VAR` shell expansion. No `/bin/sh -c`.
- Supervisor does not parse markdown bodies.
- Supervisor write allowlist is not in this file; it is engine behaviour in [[spec-hivemind]].
- Lanes are independent. Matching is not a priority queue. A busy `plan` lane does not take seats from `build`.

## Example

```yaml
history: .heio/logs/hivemind.tsv
actors:
  pi:
    cmd: "pi --agent {{agent}} {{prompt}}"
folders:
  - path: .heio/tickets
    schema: ticket
    required: [id, status]
  - path: .heio/quarantine
    schema: quarantine
    required: [origin-location, quarantined-at, fault]
lanes:
  plan:
    type: single
    concurrency: 1
    actor: pi
    agent: heio-planner
    prompt: .pi/prompts/heio-planning.md
    trigger:
      kind: ticket
      status: ready-for-agent
    scope:
      - .heio/planning
      - .heio/tickets
    claim-status: active
    backoff: 30s
  workflow:
    type: pipeline
    concurrency: 1
    actor: pi
    trigger:
      kind: ticket
      status: ready-for-agent
    claim-status: active
    stages:
      - stage: plan
        agent: heio-planner
        prompt: .pi/prompts/heio-planning.md
      - stage: build
        agent: heio-builder
        prompt: .pi/prompts/heio-slice.md
```

Pack-root `example.hivemind.yaml` is a sample. Runtime does not read it.
