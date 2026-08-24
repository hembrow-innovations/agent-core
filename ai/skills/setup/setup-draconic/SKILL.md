---
name: setup-draconic
description: Configure which models draconic uses per role. Detects available models and writes .pi/draconic-models.md. Use for /setup-draconic or changing draconic model choices.
---

# Setup draconic

Write the model map to `.pi/draconic-models.md`. Skills fall back to inherit-parent when a line is absent.

## Steps

### 1. Detect available models

List models the user can actually run in this session. Never write a slug you have not confirmed. `inherit-parent` and `auto` are always valid and mean the child runs on the parent chat model.

### 2. Load current state

Read each dest file that already exists. Otherwise start from the defaults in step 5.

### 3. Map and confirm

Show every role with its current model. Ask whether to accept as-is or change specific roles. Offer detected models plus `inherit-parent` and `auto`.

Panel roles (how critics, arena runners, architect runners) are lists. One spawn runs per entry. `arena cross-judge pool` is a list; pick one value whose family differs from the parent when possible. `swarm workers` is the default for every worker unless a race assigns another model per arm.

### 4. Validate

Every real slug must be in the detected set. `inherit-parent` and `auto` always pass.

### 5. Write the rule

Overwrite `.pi/draconic-models.md` so re-runs stay idempotent:

```
---
description: draconic per-role model choices (overrides skill defaults)
---
# One line per role. Delete a line to fall back to inherit-parent.
# inherit-parent or auto: child runs on the parent chat model (omit spawn model).
feature, refactoring: inherit-parent
bug-fix: inherit-parent
perf-issue: inherit-parent
hillclimb: inherit-parent
judgment and prose: inherit-parent
hardest tasks: inherit-parent
how explorer: inherit-parent
how explainer: inherit-parent
how critics: inherit-parent, inherit-parent
why investigators: inherit-parent
why synthesizer: inherit-parent
arena runners: inherit-parent, inherit-parent
arena cross-judge pool: inherit-parent
swarm workers: inherit-parent
architect runners: inherit-parent, inherit-parent
```

Replace `inherit-parent` with confirmed slugs when the user picks real models.

### 6. Confirm

Tell the user the file was written. It applies to new spawn calls.

### 7. Offer a verification skill

If the project has no `verify-*` skill or documented harness, offer once to run `/create-verification-skill`. On no, move on.
