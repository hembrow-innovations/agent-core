---
title: Respect UVs when retexturing
impact: HIGH
impactDescription: model_missing_uv and seam flicker
tags: [pipeline, uv, retexture]
---

## Respect UVs when retexturing

Retexture (`POST /openapi/v1/retexture`) can keep or rebuild UVs. `enable_original_uv: true` on a mesh with no UVs fails `model_missing_uv`.

**Incorrect:** Upload a DCC mesh with `enable_original_uv: true` and no UV set. Or rebuild UVs on a Meshy mesh that already had a good layout, then wonder why seams moved.

**Correct:** Meshy-generated input: `enable_original_uv: true`. Third-party without UVs: leave it false, or UV Unwrap API first. Style via exactly one of `text_style_prompt`, `image_style_url`, `multiview_image_urls`.

Notes: Multiview requires `ai_model: "meshy-7"`. Image style wins over text if both are sent.
