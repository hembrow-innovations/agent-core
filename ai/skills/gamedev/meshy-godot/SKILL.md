---
name: meshy-godot
description: Meshy AI 3D inside Godot 4. Use when generating or importing Meshy models, DCC Bridge, addons/meshy, text-to-3d, image-to-3d, remesh, PBR, GLB/glTF, rigging, or taking Meshy assets to production.
metadata:
  version: "1.0.0"
  meshy_docs: "https://docs.meshy.ai"
  meshy_api: "https://api.meshy.ai/openapi/"
---

# Meshy AI in Godot 4

Progressive rules for generating Meshy assets and baking them into a Godot 4 project. Read only the rule files that match the task.

## Stack caveats

**Assumes:** Godot **4.x** (pin **4.7.2.stable.mono** when **godot-mono** is loaded); official Meshy Godot plugin for editor import; REST at `https://api.meshy.ai/openapi/`; keys `msy_…`.

**Prefer:** DCC Bridge for one-off imports; bake **GLB** into `res://` for shipping; `enable_pbr`; remesh / smart-topology to a poly budget; API calls from **EditorPlugin** or CI, not gameplay; GDScript glue when hybrid.

**Careful:** Text-to-3D is preview then refine; rigging is humanoid-only, textured, under 300k faces, +Z forward; signed URLs expire; non-Enterprise assets last **3 days**; CORS **403** from browsers; `image_too_complex` on scene-level inputs.

**Do not introduce:** API keys in exported games; Unity/Unreal **FBX-first** as the Godot default; Meshy MCP as a runtime dep; Creative Lab / print APIs unless asked; polling inside `_process`; Python-only pipelines as the in-editor path.

## When to apply

Installing or using the Meshy Godot plugin; generating via webapp or API; importing GLB into scenes; remesh / PBR / UV / rig / animate; hardening placeholders into production assets; reviewing Meshy-related PRs.

## Priority bands

- **1 CRITICAL** - Secrets (`sec-`)
- **2 CRITICAL** - Production path (`path-`)
- **3 HIGH** - Official plugin (`plugin-`)
- **4 HIGH** - API contract (`api-`)
- **5 HIGH** - Generation (`gen-`)
- **6 HIGH** - Post-process pipeline (`pipe-`)
- **7 HIGH** - Godot import (`import-`)
- **8 MEDIUM-HIGH** - Materials (`mat-`)
- **9 MEDIUM** - Animation (`anim-`)
- **10 MEDIUM** - Production hardening (`prod-`)
- **11 MEDIUM** - Continuous improvement (`iter-`)
- **12 LOW-MEDIUM** - Ops (`ops-`)

## Quick reference

**sec-:** `sec-key-outside-export` keys never ship · `sec-no-runtime-api` no Meshy from exported games · `sec-editor-tooling` API lives in editor/CI

**path-:** `path-bake-glb` bake into `res://` · `path-glb-not-fbx` GLB for Godot · `path-persist-before-expiry` download before 3-day wipe

**plugin-:** `plugin-install-addons` unzip into `addons/` · `plugin-main-scene` set main scene first · `plugin-run-bridge` Run Bridge then Send to Godot

**api-:** `api-async-task` POST returns id · `api-bearer` `Bearer msy_` · `api-godot-http` HTTPRequest, no `_process` poll · `api-status-errors` FAILED vs HTTP errors

**gen-:** `gen-preview-then-refine` text-to-3d two-stage · `gen-image-single-subject` one object · `gen-smart-topology` game meshes · `gen-pose-for-rig` A/T pose · `gen-prompt-formula` subject+material+style+spec

**pipe-:** `pipe-order` remesh→UV→texture→rig · `pipe-poly-budget` platform faces · `pipe-enable-pbr` PBR maps · `pipe-texture-resolution` 2k/4k · `pipe-uv-retexture` UVs before retexture

**import-:** `import-gltf-scene` import as scene · `import-commit-dotimport` lock `.import` · `import-scale-origin` meters, origin · `import-instance-packed` instance PackedScene

**mat-:** `mat-standard-pbr` StandardMaterial3D · `mat-vram-srgb` VRAM + sRGB albedo only

**anim-:** `anim-rig-after-remesh` freeze topology first · `anim-humanoid-limits` biped only · `anim-player-tree` AnimationTree for production

**prod-:** `prod-collision-separate` collision ≠ render · `prod-lod` LODs / vis ranges · `prod-review-gate` review before bake · `prod-sidecar-task-ids` record Meshy ids · `prod-wip-vs-ship` WIP vs committed

**iter-:** `iter-style-bible` shared style · `iter-preview-spend` preview then refine winners · `iter-error-codes` retry vs rewrite · `iter-batch-agent` 3D Agent for sets

**ops-:** `ops-rate-limits` 429 kinds · `ops-webhooks` webhooks over poll

## How to use

1. Pick **1–N** rule ids (higher priority first).
2. `Read` only `rules/<id>.md` (relative to this skill directory).
3. Do **not** bulk-read `rules/` or load all of `AGENTS.md` unless stuck or asked.
4. Reviewing: walk categories top-down until covered.

## Full reference

Upstream Meshy docs + long notes: `AGENTS.md` (reference only; prefer `rules/` + this router).
