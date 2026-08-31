---
title: Keep Meshy keys out of the export
impact: CRITICAL
impactDescription: leaked keys spend credits on your account
tags: [security, secrets]
---

## Keep Meshy keys out of the export

Anyone with `msy_…` can generate on your account. Exported PCK/APK/HTML5 builds are public. Keys are shown once at mint time and cannot be recovered.

**Incorrect:** `const KEY := "msy_live_…"` in an Autoload, `export_presets.cfg`, a committed `.env`, or a scene export.

**Correct:** Read `OS.get_environment("MESHY_API_KEY")` (or EditorSettings) from an **EditorPlugin** / CI job. Put local env files in `.gdignore` / `.gitignore`. Rotate on leak.

Notes: Prefix is `msy_`. Header is `Authorization: Bearer <key>`. Revoke at <https://www.meshy.ai/settings/api>.
