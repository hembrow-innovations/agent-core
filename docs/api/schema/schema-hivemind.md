---
id: "schema-hivemind"
title: "Hivemind YAML schema"
kind: schema
description: "Fields for project-root hivemind.yaml. Full file. No overlay. Fail-closed unknown keys."
domain: hivemind
area: api
tags: [schema, hivemind]
source: "hivemind.yaml"
created_at: "2026-09-01"
updated_at: "2026-09-01"
---

# Hivemind YAML schema

Runtime reads **project-root `hivemind.yaml` only**. Missing file is fatal. Unknown top-level keys fail closed. The profile template at `profiles/<name>/hivemind.yaml` is install-time only ([[0016-profiles-are-directories]]).

## Fields

- **`concurrency`**: optional non-negative integer. Max live children. Default `1`. `0` is illegal.

- **`watch`**: optional list of project-relative globs or directories the supervisor may scan. If omitted, the engine scans every `folders` path. Discovery is this list, not “AI finds files.”

- **`folders`**: required list of typed folders. Each entry:

  - **`path`**: project-relative directory (`.heio/tickets`, `.heio/quarantine`, …).
  - **`schema`**: name of the per-folder front-matter schema the engine loads from the Hivemind tree (or an inline map). Unknown keys on a note in that folder are a fault.
  - **`required`**: list of required front-matter keys. Missing required key with no documented default is a fault.

- **`lanes`**: required list. Empty list is legal (supervisor never spawns). Each lane:

  - **`lane`**: required string id. Unique in the file.
  - **`cmd`**: required string or string list. Template. After interpolation, tokenize (string form) or use the list, then `exec` argv. No shell.
  - **`agent`**: optional string. Exposed as `{{agent}}`.
  - **`prompt`**: optional project-relative path. Exposed as `{{prompt}}`. Missing file at spawn is a fault; do not spawn.
  - **`trigger`**: required map of front-matter predicates. All listed keys must match the candidate file (`kind`, `status`, …). Values are exact. Status strings are pack-defined, not core enums.
  - **`need`**: optional extra predicates already true before spawn (example: sealed spec + EXPECT present). Fail `need` → skip, do not fault the file.
  - **`scope`**: optional list of project-relative path prefixes this run may intend to write. Passed as `{{exclusive}}` (joined) when the template asks. Core does not audit writes in v1. Two live runs whose declared `scope`/`exclusive` sets overlap are not spawned together.
  - **`exclusive`**: optional path list. Alias of `scope` if both appear they must be equal or the file is illegal.
  - **`backoff`**: optional duration string. Sleep when `when` is false. `0` means retry on the next scan with no extra sleep.
  - **`claim-status`**: required string. Front-matter `status` written on CAS before spawn.
  - **`mint-status`**: optional. Only meaningful if this lane creates tickets (user-written Review). Default in the heio-stack template is `ready-for-human`.

- **`disable`**: optional list of lane ids to ignore even if present in `lanes`. For templates that include Mint.

Placeholders in `cmd` (double braces only):

- **`{{agent}}`**, **`{{prompt}}`**, **`{{cwd}}`**, **`{{exclusive}}`**, **`{{lane}}`**
- **`{{env.NAME}}`**: `process.env.NAME`. Missing or empty → do not spawn. Values are never logged.
- Lane fields of scalar string type may be referenced by name. Unknown `{{name}}` fail closed. Leftover `{{` after interpolation fails closed.

## Constraints

- YAML subset follows [[schema-profile]] (no anchors, no block scalars, indentation nesting).
- `cmd` string form: interpolate, then split on whitespace with simple double/single quotes. Unmatched quotes fail closed. YAML list form skips the splitter.
- No `$VAR` shell expansion. No `/bin/sh -c`.
- Supervisor does not parse markdown bodies.
- Supervisor write allowlist is not in this file; it is engine behaviour in [[spec-hivemind]].

## Example

```yaml
concurrency: 2
folders:
  - path: .heio/tickets
    schema: ticket
    required: [id, status]
  - path: .heio/quarantine
    schema: quarantine
    required: [origin-location, quarantined-at, fault]
lanes:
  - lane: plan
    cmd: "pi --agent {{agent}} {{prompt}}"
    agent: heio-planner
    trigger:
      kind: ticket
      status: ready-for-agent
    scope:
      - .heio/planning
      - .heio/tickets
    prompt: .pi/prompts/heio-planning.md
    claim-status: active
    backoff: 30s
```
