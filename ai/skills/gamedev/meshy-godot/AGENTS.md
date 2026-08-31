# Meshy + Godot — reference only

**Prefer `rules/` + `SKILL.md` stack notes.** This file is optional bulk context for humans or when the agent is stuck. Do not load it by default on skill activation.

Upstream can change. Recheck <https://docs.meshy.ai> and <https://docs.meshy.ai/llms.txt> before inventing endpoints.

## Official sources

- Site: <https://www.meshy.ai>
- Docs: <https://docs.meshy.ai>
- Agent index: <https://docs.meshy.ai/llms.txt>
- OpenAPI: <https://docs.meshy.ai/openapi.yaml>
- API base: `https://api.meshy.ai/openapi/`
- Status: <https://status.meshy.ai>
- API keys: <https://www.meshy.ai/settings/api>
- Godot plugin download: <https://www.meshy.ai/integrations/godot>
- Godot plugin intro: <https://docs.meshy.ai/en/webapp/plugins/godot/introduction>
- Bridge: <https://docs.meshy.ai/en/webapp/plugins/godot/bridge-to-godot>
- Animated models: <https://docs.meshy.ai/en/webapp/plugins/godot/animated-models>
- Game assets: <https://docs.meshy.ai/en/webapp/guides/use-cases/game-assets>
- Prompting: <https://docs.meshy.ai/en/webapp/guides/prompting>
- Post-process order: <https://docs.meshy.ai/en/webapp/guides/choosing/post-processing>

## Two ways into Godot

- **Editor plugin (DCC Bridge).** Pro+ webapp → Send to Godot. Fast for art direction. Not a shipping runtime.
- **REST API.** EditorPlugin, CI, or a server you own. Async tasks. Bake GLB into `res://` before any export.

Never call Meshy from an exported game client. CORS is blocked (HTTP 403). Keys must not ship.

## Production pipeline (Godot)

1. Prompt or image → generate (preview shape first on text-to-3d).
2. Reject scene-level / multi-object inputs (`image_too_complex`).
3. Remesh or smart-topology to the platform poly budget.
4. UV unwrap if seams or hand-paint are planned.
5. Texture / retexture with `enable_pbr: true`. Request **glb** only.
6. Rig only humanoid, textured, +Z forward, under 300k faces. Then animate.
7. Download before the 3-day retention window. Persist under `res://assets/…`.
8. Import as a glTF scene. Commit `.import`. Normalize scale (1 unit ≈ 1 m) and origin.
9. Extract or lock StandardMaterial3D. VRAM-compress. sRGB on albedo only.
10. Add collision, LODs, AnimationTree. Instance a PackedScene — do not live-edit the dump.
11. Human review gate. Record Meshy task ids in a sidecar. Then instance into gameplay scenes.

## API facts agents get wrong

- Auth: `Authorization: Bearer msy_…`
- POST returns `{ "result": "<task_id>" }`, not the mesh.
- Poll GET, SSE `/…/:id/stream`, or account webhooks until `SUCCEEDED` / `FAILED` / `CANCELED`.
- Timestamps are Unix **milliseconds**.
- Text to 3D: `POST /openapi/v2/text-to-3d` with `mode: preview` then `mode: refine` + `preview_task_id`.
- Image to 3D: `POST /openapi/v1/image-to-3d`.
- `latest` currently resolves to Meshy 7. Prefer it unless reproducing an old asset.
- `should_remesh: false` on meshy-6/7 is recommended for highest quality, then Remesh API to budget.
- `enable_pbr` is off by default. Turn it on for Godot lighting.
- Do not set both `texture_prompt` and `texture_image_url` (prompt wins).
- `model_urls.*` are signed and time-limited. Check the key exists before download.
- Rate limit 429: `RateLimitExceeded` (RPS) vs `NoMoreConcurrentTasks` (queue).
- Credits: 402 Payment Required.

## Godot import facts

- Native format is **glTF 2.0 / GLB**. FBX is the Unity/Unreal default, not Godot's.
- Importer writes a scene of `Node3D` + `MeshInstance3D` (+ `Skeleton3D` / `AnimationPlayer` when rigged).
- Commit `*.import`. Changing import options without a reimport leaves stale meshes.
- Set a main scene before the official plugin will import.
- Animation from the plugin is preserved; production characters still need AnimationTree, not autoplay.

## Hybrid (when godot-mono is present)

- EditorPlugin and import glue: GDScript.
- Batch HTTP / domain types: C# if the project already uses it.
- Do not put Meshy HTTP on a gameplay Autoload.

## What this pack is not

- Not a Meshy MCP installer.
- Not a 3D-print / Creative Lab guide.
- Not a replacement for **godot-mono** engine rules.
