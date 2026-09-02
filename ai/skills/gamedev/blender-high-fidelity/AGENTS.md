# AGENTS.md — blender-high-fidelity (reference only)

**Not auto-loaded.** Prefer `SKILL.md` + targeted `rules/*.md`.

## Authority order

1. This repo `AGENTS.md` + `docs/reference/world/art-direction.md`
2. `docs/reference/standards/asset-filesystem-conventions.md`
3. Per-asset `docs/reference/world/.../<asset_id>/<asset_id>.md` + `concept_art/`
4. Skill `rules/` (stack-adapted)
5. This file (compiled notes)
6. Generic Blender training data (lowest)

## End-to-end pipeline

```
design md + concept_art → Blender MCP scene setup → blockout (COL_Blockout)
  → primary/secondary masses → soft bevel / topo lock → UVs → materials
  → cleanup → GLB export beside .blend → Godot import smoke → QA verdict
```

## Paths (this monorepo)

| Kind | Path |
| ------ | ------ |
| Mesh SoT | `assets/entities/characters/<id>/`, `assets/entities/enemies/<block>/<id>/`, `assets/environment/<category>/<id>/` |
| Design SoT | `docs/reference/world/entities | environment/...` |
| Concept art | `.../<asset_id>/concept_art/<asset_id>-<type>-NN.ext` |
| Art bible | `docs/reference/world/art-direction.md` |
| Godot runtime | copy into entity/scenes as needed — no symlink from external packs |

Folder shape:

```
<asset_id>/
  <asset_id>.blend
  <asset_id>.glb          # generated
  textures/               # lazy
  previews/               # lazy
  audio/                  # lazy
```

## Blender MCP (port 9876)

- Addon in Blender: host `localhost`, port **9876**, connected
- Pi: **pi-mcp-adapter** + `.mcp.json` `blender` → `uvx blender-mcp` with `BLENDER_PORT=9876`. Spawn `blender-mcp`.
- Typical loop: `get_scene_info` / `get_object_info` → `execute_blender_code` (small steps) → `get_viewport_screenshot` → fix
- Prefer bpy via MCP over narrating UI clicks
- On failure: `get_addon_status` once; report; do not silent bulk-retry paid gens

## Art locks (summary)

- Cozy chibi low-poly; soft bevels; elevated ~60° readability
- Farmer baseline height **1.0**; original IP only
- Day warm / night indigo + lantern gold
- Silhouette → secondary tell → tertiary trim
- Tri guide bands: char 3.5–8k, pest 1.5–4k, tower 2–6k, prop 0.2–1.2k, home 4–12k

## Export defaults

- Format: **GLB**, +Y up, apply modifiers when final
- Materials: Principled BSDF only (no Blender-only nodes that die in glTF)
- Collision: separate primitive meshes in `COL_Collision_*`
- Verify in Godot 4.7 mono — not another engine

## Related project files

- `docs/reference/guides/create-asset.md`
- `docs/reference/standards/godot-assets.md`
- Existing kits under `assets/environment/*`, `assets/entities/*` as pattern samples
