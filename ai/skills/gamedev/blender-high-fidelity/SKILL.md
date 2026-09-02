---
name: blender-high-fidelity
description: >
  High-fidelity Blender modeling + Blender MCP for Littlepaw Farm & Fortify (cozy chibi
  low-poly 3D → Godot 4.7.2 mono). Use when modeling, blockout, sculpt/retopo polish,
  materials, UVs, glTF/GLB export, collision proxies, asset folders under assets/,
  concept-match, QA screenshots, or driving Blender via MCP port 9876.
license: MIT
metadata:
  version: "1.0.0"
  domain: blender
  engine: godot
  godot: "4.7.2.stable.mono.official"
  blender_mcp_port: "9876"
---

# Blender high-fidelity (Littlepaw)

Progressive rules for **Blender MCP + production mesh craft** in this monorepo. Load cost is this router only — read atomic `rules/<id>.md` on demand.

## Stack caveats (read first)

**Assumes:** Blender + BlenderMCP addon (localhost **9876**); Godot **4.7.2.stable.mono** Forward+; mesh SoT under `assets/`; design SoT under `docs/reference/world/`; art bible `docs/reference/world/art-direction.md`.

**Prefer:** MCP-first execution; one-asset-per-folder; `.blend` SoT + generated `.glb`; cozy chibi low-poly with soft bevels; silhouette + elevated (~60°) readability before texture; Principled BSDF → glTF metallic-roughness; shared material families; farmer height baseline **1.0 m**.

**Careful:** Paid AI mesh gen (Meshy/Tripo/fal) only with explicit human opt-in + spend hygiene; LOD0 tri bands are guides not hard engine limits; bootstrap `_author_*.py` kits are not ship bar; Godot lighting is final (Blender lights = lookdev/preview only).

**Do not introduce:** Unity/Bevy/Unreal export as primary path; hand-edited `.glb` as source; franchise-clone silhouettes; gore/grimdark; dense 4k hero maps on yard props; strand-based fur; mesh-body colliders for characters; new top-level asset roots without updating standards docs.

## MCP routing (required)

Blender MCP is **not** for heio-builder or other lean primaries. Load this skill **inside** the `blender-mcp` worker (`subagent` agent `blender-mcp`). Parents load skill **`mcp-worker`** and spawn the worker; they never call the `mcp` proxy for Blender inline. Handback + evidence rules live in `mcp-worker`.

## When to apply

- New/hero mesh under `assets/entities/**` or `assets/environment/**`
- Blender MCP modeling, cleanup, materials, UVs, export (via `blender-mcp` worker)
- Concept-match / art-direction compliance
- glTF import smoke in Godot
- Asset QA before claiming ship

## Priority bands

| Pri | Category | Impact | Prefix |
| ----- | ---------- | -------- | -------- |
| 1 | Blender MCP | CRITICAL | `mcp-` |
| 2 | Asset pipeline | CRITICAL | `pipeline-` |
| 3 | Art direction fidelity | CRITICAL | `art-` |
| 4 | Modeling workflow | HIGH | `model-` |
| 5 | Topology craft | HIGH | `topo-` |
| 6 | Export → Godot | HIGH | `export-` |
| 7 | Materials | MEDIUM-HIGH | `mat-` |
| 8 | UVs | MEDIUM | `uv-` |
| 9 | Collision | MEDIUM | `coll-` |
| 10 | QA / ship bar | HIGH | `qa-` |
| 11 | Pitfalls | CRITICAL | `pitfall-` |

## Quick reference

**mcp-:** `mcp-connect-and-status` addon+port · `mcp-scene-info-first` inspect before mutate · `mcp-execute-stepwise` small code chunks · `mcp-screenshot-verify` visual proof · `mcp-no-ui-narration` ops not menus

**pipeline-:** `pipeline-one-asset-folder` · `pipeline-blend-is-sot` · `pipeline-design-before-mesh` · `pipeline-snake-case-ids` · `pipeline-concept-art-home` · `pipeline-git-lfs`

**art-:** `art-cozy-chibi-pillars` · `art-elevated-readability` · `art-silhouette-first` · `art-original-ip-only` · `art-height-bands` · `art-tri-budgets`

**model-:** `model-workflow-phases` · `model-scene-collections` · `model-non-destructive` · `model-scale-and-pivot` · `model-naming-sm-prefix` · `model-soft-bevels` · `model-blockout-gate`

**topo-:** `topo-quad-dominant` · `topo-support-loops` · `topo-cleanup-checklist` · `topo-normals-auto-smooth` · `topo-mass-hierarchy`

**export-:** `export-glb-first` · `export-apply-transforms` · `export-gltf-materials` · `export-godot-verify` · `export-animation-clips`

**mat-:** `mat-principled-pbr` · `mat-shared-families` · `mat-vertex-color` · `mat-budget-maps` · `mat-emissive-lantern`

**uv-:** `uv-unwrap-after-topo` · `uv-texel-density` · `uv-atlas-props`

**coll-:** `coll-primitives-not-render` · `coll-naming-collection` · `coll-by-asset-class`

**qa-:** `qa-screenshot-angles` · `qa-greyscale-topdown` · `qa-night-readability` · `qa-ship-verdict`

**pitfall-:** `pitfall-default-names` · `pitfall-unapplied-scale` · `pitfall-bootstrap-as-ship` · `pitfall-hand-edit-glb` · `pitfall-franchise-clone` · `pitfall-skip-concept`

## How to use

1. Read this router; pick **1–N** rule ids (higher priority first).
2. `Read` only `rules/<id>.md` (paths relative to this skill directory).
3. Do **not** bulk-read `rules/` or load all of `AGENTS.md` unless stuck or asked.
4. Reviewing/refactoring: walk categories top-down until covered.
5. For product locks, also open `docs/reference/world/art-direction.md` and the asset md under `docs/reference/world/`.

## Full reference

Long-form compile + upstream pointers: `AGENTS.md` (reference only; prefer `rules/` + this router).
